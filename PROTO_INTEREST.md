# Registro de interesados en protos

## Cómo funciona

El formulario del modal abre el cliente de correo del visitante con un mensaje pre-escrito dirigido a `news@hemosjugaomal.com`. No usa base de datos ni Supabase: los registros llegan como emails normales.

## Archivos involucrados

| Archivo | Función |
|---|---|
| `src/components/InterestModal.astro` | Modal con formulario + script que genera el `mailto:` |
| `src/components/Hero.astro` | Botón que abre el modal (`id="interest-cta-btn"`) |
| `src/pages/index.astro` | Incluye `<InterestModal />` al final de la página |

## Cómo reutilizarlo en otro proyecto de Bolt

### Paso 1: Copiar el componente del modal

Copiar `src/components/InterestModal.astro` al nuevo proyecto. Cambiar el correo y el nombre del proto en el `mailto:`:

```js
var subject = encodeURIComponent('Registro de interés: NombreDelNuevoProto');
var body = encodeURIComponent('Quiero recibir novedades sobre el prototipo NombreDelNuevoProto.\n\nCorreo: ' + email);
window.location.href = 'mailto:news@hemosjugaomal.com?subject=' + subject + '&body=' + body;
```

### Paso 2: Añadir el botón que abre el modal

En el Hero (o donde quieras) del nuevo proyecto:

```html
<button id="interest-cta-btn" type="button" class="...">
  Avísame del proto
</button>
```

### Paso 3: Incluir el modal en la página

```astro
---
import InterestModal from '@/components/InterestModal.astro';
---
<Layout>
  <!-- contenido -->
  <InterestModal />
</Layout>
```

Eso es todo. No necesita variables de entorno ni base de datos.

_Última actualización: 2026-08-18_
