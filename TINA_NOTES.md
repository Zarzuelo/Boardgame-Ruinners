# Astro + TinaCMS — Notas del Ecosistema

Documento de referencia sobre el funcionamiento interno de Astro + TinaCMS, basado en la investigación del código fuente y la depuración durante el desarrollo de este proyecto.

---

## 1. Arquitectura general

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Astro SSR  │────▶│  Tina Cloud API  │────▶│  GitHub Repo    │
│  (tu web)   │     │  content.tinajs  │     │  (tina/config)  │
└─────────────┘     └──────────────────┘     └─────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Tina Admin  │
                    │  (editor)    │
                    └──────────────┘
```

- **Astro** genera el sitio estático. Lee el contenido de Tina Cloud en build time (`src/lib/content.ts`).
- **Tina Cloud** actúa como capa intermedia: guarda el contenido indexado y sirve una API GraphQL.
- **GitHub** es la fuente de verdad para el esquema (`tina/config.ts`). Tina Cloud lee el esquema del repo conectado.
- **Tina Admin** es el editor visual que se sirve desde `/admin` (generado por `tinacms build`).

---

## 2. Flujo del esquema (schema)

### Cómo se sincroniza el esquema con Tina Cloud

1. Modificas `tina/config.ts` localmente.
2. Subes los cambios a GitHub (push a `main`).
3. GitHub Actions ejecuta `tinacms build`.
4. `tinacms build` genera los archivos en `tina/__generated__/` y verifica el esquema contra Tina Cloud.
5. Si el esquema cambió, Tina Cloud se reindexa automáticamente.

### Endpoints de Tina Cloud relevantes

| Endpoint | Método | Función |
|---|---|---|
| `/db/{clientId}/reset/{branch}?refreshSchema=true` | POST | Fuerza reindexación + refresco de esquema desde GitHub |
| `/db/{clientId}/status/{branch}` | GET | Estado de indexación: `inprogress`, `complete`, `failed` |
| `/db/{clientId}/{branch}/schemaSha` | GET | Hash SHA-256 del esquema actual en la nube |
| `/1.6/content/{clientId}/github/{branch}` | POST | API GraphQL para consultar contenido |

### Ejemplo: forzar sincronización del esquema

```bash
# 1. Disparar reindexación con refresco de esquema
curl -s -X POST \
  "https://content.tinajs.io/db/{CLIENT_ID}/reset/main?refreshSchema=true&skipIfSchemaCurrent=false" \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: {TOKEN}"

# 2. Verificar estado de indexación
curl -s \
  "https://content.tinajs.io/db/{CLIENT_ID}/status/main" \
  -H "X-API-KEY: {TOKEN}"

# 3. Consultar contenido via GraphQL
curl -s -X POST \
  "https://content.tinajs.io/1.6/content/{CLIENT_ID}/github/main" \
  -H "Content-Type: application/json" \
  -H "x-api-key: {TOKEN}" \
  -d '{"query":"{ pages(relativePath: \"landing.md\") { hero { title } } }"}'
```

### No se puede subir el esquema directamente

Tina Cloud **no expone** un endpoint PUT/POST/PATCH para subir el esquema directamente. Solo se puede actualizar mediante:

- Push a GitHub + GitHub Actions (`tinacms build`).
- El endpoint `reset` que relee el esquema del repo de GitHub.

Si el repo de GitHub no tiene los cambios en `tina/config.ts`, el esquema en la nube no se actualizará sin importar cuántas veces se haga un reset.

---

## 3. `tinacms build` — flags importantes

| Flag | Efecto |
|---|---|
| `--skip-cloud-checks` | Omite verificación de esquema vs nube. **No sincroniza el esquema.** |
| `--skip-indexing` | Omite indexación de contenido (solo self-hosted). |
| `--skip-search-index` | Omite indexación para búsqueda. |
| `--local` | Usa servidor GraphQL local en vez de producción. |
| `--partial-reindex` | Reindexa solo contenido cambiado. |

### Comportamiento interno de `tinacms build`

1. Procesa `tina/config.ts` y genera archivos en `tina/__generated__/`.
2. Si es self-hosted o `--local`, indexa contenido localmente.
3. Si **no** tiene `--skip-cloud-checks`:
   - Verifica que el branch existe en Tina Cloud.
   - Si hay upstream/preview, llama a `syncProject` (POST `/db/{clientId}/reset/{branch}?refreshSchema=true`).
   - Ejecuta `waitForDB` que hace polling del estado de indexación.
   - Compara el esquema local con el de la nube (`checkGraphqlSchema`, `checkTinaSchema`).
4. Construye el SPA del admin panel.

### El círculo vicioso de `--skip-cloud-checks`

Si el esquema local tiene campos que la nube no tiene:
- `tinacms build` sin `--skip-cloud-checks` → **falla** por mismatch de esquema.
- `tinacms build --skip-cloud-checks` → **pasa** pero no sincroniza el esquema.

La solución: añadir un paso explícito de `reset` con `refreshSchema=true` **antes** del build en GitHub Actions (ver `deploy.yml`).

---

## 4. Estructura de archivos generados

```
tina/
├── config.ts                          # Configuración del esquema (fuente de verdad)
├── tina-lock.json                     # Lock file de versiones
└── __generated__/
    ├── _schema.json                   # Esquema serializado (para comparación SHA)
    ├── _graphql.json                  # Schema GraphQL completo
    ├── _lookup.json                   # Lookup de tipos
    ├── client.ts                      # Cliente TypeScript para queries
    ├── types.ts                       # Tipos TypeScript generados
    ├── schema.gql                     # Schema GraphQL en formato SDL
    ├── queries.gql                    # Queries pre-generadas
    ├── frags.gql                      # Fragments pre-generados
    ├── config.prebuild.jsx            # Config de prebuild para el admin
    └── static-media.json              # Mapeo de medios estáticos
```

---

## 5. Cómo funciona `src/lib/content.ts`

### Estrategia de consulta con fallback de esquema

Cuando el esquema local tiene campos que la nube aún no tiene, la consulta GraphQL falla. La solución es un sistema de **degradación graceful**:

```typescript
// 1. Intentar consulta completa (con todos los campos)
let res = await fetch(url, { body: JSON.stringify({ query: TINA_QUERY_FULL }) });

// 2. Si falla (schema mismatch), intentar consulta sin los campos nuevos
if (json.errors) {
  res = await fetch(url, { body: JSON.stringify({ query: TINA_QUERY_LEGACY }) });
}

// 3. Rellenar los campos nuevos con contenido local
if (!pages.videoBlock) pages.videoBlock = local.videoBlock;
if (!pages.salesSheet) pages.salesSheet = local.salesSheet;
```

### Cómo se resuelven las URLs de imágenes

Tina Cloud devuelve referencias relativas a imágenes. La función `applyMediaUrls` las convierte a URLs absolutas:

- Imágenes subidas via Tina Admin → se sirven desde `https://assets.tinajs.io/...`
- Imágenes locales en `public/images/` → se sirven desde el dominio del sitio

---

## 6. Admin panel (Tina Editor)

- Se sirve desde `/admin/index.html` (generado por `tinacms build`).
- El admin panel compara el esquema local (generado) contra el esquema de la nube.
- Si hay mismatch, muestra **"GraphQL Schema Mismatch"**.
- El admin panel **no se puede usar** para editar contenido hasta que el esquema coincida.

### Cómo se construye el admin

El build del admin usa Vite internamente. Requiere:
- `tina/config.ts` (esquema).
- `tina/__generated__/` (archivos generados).
- Variables de entorno: `TINA_CLIENT_ID`, `TINA_TOKEN`, `TINA_BRANCH`.

### Limitación de memoria

`tinacms build` puede consumir mucha memoria. En entornos con poca RAM (<2GB), usar:
```bash
NODE_OPTIONS="--max-old-space-size=4096" tinacms build
```

---

## 7. GitHub Actions — deploy.yml

### Flujo correcto para sincronizar esquema

```yaml
steps:
  # 1. Checkout + install
  # 2. Setup env vars
  # 3. Refrescar esquema de Tina Cloud (no-op si ya está sincronizado)
  - name: Refresh Tina Cloud schema
    run: |
      curl -s -X POST \
        "https://content.tinajs.io/db/${TINA_CLIENT_ID}/reset/main?refreshSchema=true&skipIfSchemaCurrent=true" \
        -H "X-API-KEY: ${TINA_TOKEN}"
      # Polling hasta que termine la indexación
      for i in $(seq 1 60); do
        STATUS=$(curl -s "https://content.tinajs.io/db/${TINA_CLIENT_ID}/status/main" \
          -H "X-API-KEY: ${TINA_TOKEN}" | jq -r '.status')
        [ "$STATUS" = "complete" ] && break
        [ "$STATUS" = "failed" ] && exit 1
        sleep 5
      done
  # 4. Build con --skip-cloud-checks (genera admin panel) + astro build
  - name: Build
    run: npx tinacms build --skip-cloud-checks && npx astro build
```

**Importante:** NUNCA usar `npm run build:cloud` (= `tinacms build && astro build`) en CI porque `tinacms build` sin `--skip-cloud-checks` falla si el esquema local tiene campos que Tina Cloud aún no conoce. Usar `npx tinacms build --skip-cloud-checks && npx astro build`.

### Secrets necesarios en GitHub

| Secret | Valor |
|---|---|
| `TINA_CLIENT_ID` | ID del proyecto en Tina Cloud |
| `TINA_TOKEN` | Token de API de Tina Cloud |

---

## 8. Content management

### Archivo de contenido

El contenido vive en `src/content/pages/landing.md` como Markdown con frontmatter YAML.

### Formato del frontmatter

```yaml
---
hero:
  badge: "2-5 jugadores | 12+ | 30 min"
  title: "RUINNERS"
  subtitle: "Conquista las ruinas"
  backgroundImage: "images/hero-bg.jpg"
components:
  features:
    - title: "Exploración"
      icon: "compass"
factions:
  items:
    - name: "Sindicato Volta"
      accentColor: "#e8b339"
videoBlock:
  visible: true
  youtubeUrl: "https://youtube.com/..."
salesSheet:
  visible: true
  spanishUrl: "https://drive.google.com/..."
---
```

### Prioridad de contenido

1. **Tina Cloud** (si está disponible y responde sin errores).
2. **Archivo local** `landing.md` (fallback).

---

## 9. Limitaciones conocidas

- **No se puede subir el esquema a Tina Cloud sin GitHub.** El esquema se lee del repo conectado.
- **El endpoint `reset` relee el esquema de GitHub**, no de un esquema local.
- **El admin panel no funciona con schema mismatch.** No se puede editar hasta que coincidan.
- **`tinacms build` es intensivo en memoria.** Puede necesitar hasta 4GB.
- **No hay endpoint directo para pushear schema.** Solo PUT/POST/PATCH a `/db/.../schema` devuelven "Method Not Allowed".
- **`--skip-cloud-checks` es necesario en CI.** Permite generar el admin panel sin verificar el esquema contra la nube. La sincronización se hace con el paso `refreshSchema` anterior.
- **`syncProject` solo se ejecuta para branches upstream/preview.** Para `main` se necesita el paso explícito de reset en CI.

---

## 10. Variables de entorno

| Variable | Dónde se usa | Descripción |
|---|---|---|
| `TINA_CLIENT_ID` | content.ts, admin, CI | ID del proyecto en Tina Cloud |
| `TINA_TOKEN` | content.ts, admin, CI | Token de API para autenticación |
| `TINA_BRANCH` | admin, CI | Branch actual (default: `main`) |
| `HEAD` | tina/config.ts | Branch alternativo (Vercel) |
| `VERCEL_GIT_COMMIT_REF` | tina/config.ts | Branch alternativo (Vercel) |

---

## 11. Troubleshooting

### "GraphQL Schema Mismatch" en el admin panel

**Causa:** El esquema local (`tina/config.ts`) tiene campos que Tina Cloud no conoce.

**Solución:**
1. Verificar que los cambios están en GitHub: `tina/config.ts` debe tener los campos nuevos.
2. Forzar reset: `POST /db/{clientId}/reset/main?refreshSchema=true&skipIfSchemaCurrent=false`
3. Esperar a que el estado sea `complete`.
4. Si persiste, el repo de GitHub no tiene los cambios — hacer push primero.

### La web muestra contenido incorrecto o vacío

**Causa:** La consulta GraphQL falla porque la nube no tiene campos nuevos.

**Solución:** El sistema de fallback en `content.ts` debe manejar esto (consulta legacy + relleno local).

### `tinacms build` se cuelga o muere (OOM)

**Solución:** Aumentar memoria: `NODE_OPTIONS="--max-old-space-size=4096"`

### El build de GitHub Actions falla

**Causa más común:** `tinacms build` sin `--skip-cloud-checks` falla porque el esquema local tiene campos nuevos que Tina Cloud aún no conoce.

**Solución:** Usar `npx tinacms build --skip-cloud-checks && npx astro build` en CI. El flag `--skip-cloud-checks` evita la verificación de esquema contra la nube (que se hace en el paso anterior de `refreshSchema`).

**Otras causas posibles:**
- Faltan secrets `TINA_CLIENT_ID` o `TINA_TOKEN` en GitHub.
- El branch en GitHub no existe en Tina Cloud.

---

## 12. Paquetes y versiones

| Paquete | Versión | Función |
|---|---|---|
| `tinacms` | ^1.5.28 | SDK del cliente (admin panel) |
| `@tinacms/cli` | ^1.5.39 | CLI para build y dev server |
| `@tinacms/graphql` | (transitiva) | Generación de esquema GraphQL |
| `@tinacms/schema-tools` | (transitiva) | Validación y hashing de esquema |

---

_Última actualización: 2026-08-17_

### Recuperación de contenido perdido via GitHub Events API

**Método que funcionó:** GitHub conserva los commits incluso después de un force-push. Se pueden recuperar consultando la Events API:

```bash
# 1. Listar todos los push events (incluye commits sobrescritos)
curl -s "https://api.github.com/repos/{owner}/{repo}/events?per_page=30" \
  | jq '.[] | select(.type=="PushEvent") | .payload.head[:12]'

# 2. Acceder al commit perdido directamente por SHA
curl -s "https://api.github.com/repos/{owner}/{repo}/commits/{sha}"

# 3. Leer el archivo desde ese commit
curl -s "https://raw.githubusercontent.com/{owner}/{repo}/{sha}/src/content/pages/landing.md"
```

**Importante:** Los commits sobrescritos por force-push siguen siendo accesibles en GitHub mientras no se haga garbage collection. Esto es una ventana de recuperación.

### Las imágenes subidas via Tina Admin se quedan en el CDN

Aunque el reset sobreescriba las referencias a las imágenes en el contenido, las imágenes siguen en `https://assets.tina.io/{clientId}/{filename}`. Si conoces el nombre del archivo (que se puede recuperar del historial de commits), la imagen sigue siendo accesible.

---

## 13. Lección crítica: el reset puede borrar contenido editado

### Qué pasó

Se ejecutó `POST /db/{clientId}/reset/main?refreshSchema=true&skipIfSchemaCurrent=false`.

Este endpoint **relee el contenido del repo de GitHub** y sobreescribe lo que había en la base de datos de Tina Cloud. Cualquier edición hecha desde el admin panel de Tina que **no se había commiteado a GitHub** se perdió.

### Por qué ocurrió

- El editor de Tina guarda los cambios en la base de datos de Tina Cloud.
- Tina Cloud sincroniza esos cambios de vuelta al repo de GitHub (commits automáticos).
- Pero si haces un `reset` con `skipIfSchemaCurrent=false`, fuerza una reindexación completa que **relee todo desde GitHub**, sobreescribiendo el estado de Tina Cloud.
- Si los commits automáticos de Tina no llegaron a GitHub (o el repo estaba desactualizado), el contenido se pierde.

### Cómo evitarlo

1. **NUNCA usar `skipIfSchemaCurrent=false`** en producción. Usar `skipIfSchemaCurrent=true`.
2. **Comparar el SHA del esquema local vs cloud** antes de hacer cualquier reset.
3. **Solo hacer reset si el esquema realmente cambió** (comparación de hashes).
4. **El reset solo debe refrescar el esquema**, no el contenido.

### Flujo seguro implementado en deploy.yml

```
1. Calcular SHA-256 de tina/__generated__/_schema.json (local)
2. Consultar SHA del esquema en Tina Cloud (GET /db/{id}/main/schemaSha)
3. Si coincen → NO hacer nada (esquema ya sincronizado, contenido preservado)
4. Si no coincen → POST /reset con skipIfSchemaCurrent=true (solo refresca si el esquema cambió)
5. Esperar a que la indexación termine
6. Ejecutar build
```

### Bug adicional: URLs de imágenes duplicadas

Tina Cloud a veces devuelve URLs de imágenes con el prefijo del CDN duplicado:

```
https://assets.tina.io/{clientId}https://assets.tina.io/{clientId}/imagen.png
```

La función `resolveMediaUrl` en `content.ts` ahora detecta y limpia estas duplicaciones automáticamente usando `lastIndexOf(TINA_CDN_PREFIX)`.

### Lección crítica: `tinacms build` en CI debe usar `--skip-cloud-checks`

**Problema:** `tinacms build` sin flags compara el esquema local contra el esquema de Tina Cloud y falla con exit code 1 si no coinciden:

```
The local GraphQL schema doesn't match the remote GraphQL schema.
Reason: [NON_BREAKING - FIELD_ADDED] Field 'coverImage' was added to object type 'PagesHero'
```

Esto ocurre siempre que se añade un campo nuevo a `tina/config.ts`. El esquema de Tina Cloud solo se actualiza cuando Tina reindexa desde GitHub, pero `tinacms build` se ejecuta **antes** de que esa reindexación termine.

**Solución:** Ejecutar `tinacms build --skip-cloud-checks` en CI. Esto genera el panel admin (necesario para `/admin`) sin verificar el esquema contra la nube. El paso anterior de `refreshSchema` se encarga de sincronizar Tina Cloud.

**NUNCA usar `npm run build:cloud` (= `tinacms build && astro build`) en CI** porque ejecuta `tinacms build` sin `--skip-cloud-checks`. Usar en su lugar: `npx tinacms build --skip-cloud-checks && npx astro build`.

**Flujo correcto cuando se modifica el schema:**
1. Cambiar `tina/config.ts` localmente.
2. Ejecutar `tinacms build` localmente con credenciales para regenerar `tina/__generated__/`.
3. Commitar los archivos generados junto con el cambio de schema.
4. Hacer push a GitHub. El workflow ejecuta `refreshSchema` (reset con `skipIfSchemaCurrent=true`) + `tinacms build --skip-cloud-checks` + `astro build`.
5. Tina Cloud reindexa desde GitHub y actualiza su esquema.

**Comparación de hashes local vs cloud es inútil:** El `sha256sum` de `tina/__generated__/_schema.json` nunca coincide con el hash `tinaSchema` que devuelve Tina Cloud porque son hashes de representaciones distintas del mismo esquema. Por eso el workflow hace un `refreshSchema` incondicional con `skipIfSchemaCurrent=true` (no-op si ya está sincronizado).

### Recuperación de contenido perdido

Si el contenido se pierde por un reset:

1. El archivo local `src/content/pages/landing.md` es el último respaldo conocido.
2. Tina Cloud puede tener campos parciales que sobrevivieron (ej: `youtubeUrl` se conservó).
3. Consultar Tina Cloud via GraphQL para ver qué quedó: `POST /1.6/content/{id}/github/main`
4. Cruzar la información del archivo local + lo que quedó en Tina Cloud.
5. Actualizar `landing.md` con los valores recuperados.

### Mejor práctica: respaldo antes de reset

Antes de cualquier reset en producción, guardar el contenido actual de Tina Cloud:

```bash
curl -s -X POST "https://content.tinajs.io/1.6/content/{ID}/github/main" \
  -H "x-api-key: {TOKEN}" \
  -d '{"query":"{ pages(relativePath: \"landing.md\") { hero { title } ... } }"}' \
  > backup-content.json
```
