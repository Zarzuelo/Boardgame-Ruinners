import { defineConfig } from "tinacms";

const branch =
  process.env.TINA_BRANCH || process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || "main";

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      {
        name: "pages",
        label: "Páginas",
        path: "src/content/pages",
        format: "md",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        fields: [
          // ===== HERO SECTION =====
          {
            type: "object",
            label: "Hero",
            name: "hero",
            fields: [
              {
                type: "string",
                label: "Etiqueta superior",
                name: "badge",
                description: "Texto pequeño que aparece encima del título (jugadores, edad, duración)",
              },
              {
                type: "string",
                label: "Título principal",
                name: "title",
              },
              {
                type: "string",
                label: "Subtítulo",
                name: "subtitle",
              },
              {
                type: "string",
                label: "Descripción",
                name: "description",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                label: "Texto del botón principal",
                name: "ludoButtonText",
              },
              {
                type: "string",
                label: "Enlace del botón principal",
                name: "ludoUrl",
              },
              {
                type: "string",
                label: "Texto del segundo botón",
                name: "salesButtonText",
              },
              {
                type: "string",
                label: "Enlace del segundo botón",
                name: "salesUrl",
              },
              {
                type: "string",
                label: "Texto del tercer botón",
                name: "videoButtonText",
              },
              {
                type: "string",
                label: "Enlace del tercer botón",
                name: "videoUrl",
              },
              {
                type: "image",
                label: "Imagen de fondo",
                name: "backgroundImage",
                description: "Imagen de portada que aparece de fondo en la sección Hero",
              },
              {
                type: "image",
                label: "Imagen de portada del juego",
                name: "coverImage",
                description: "Imagen opcional que se muestra junto al texto del Hero. Si se deja vacía no aparece. Se puede ampliar al hacer clic.",
              },
            ],
          },
          // ===== COMPONENTS =====
          {
            type: "object",
            label: "Componentes del juego",
            name: "components",
            fields: [
              {
                type: "string",
                label: "Etiqueta superior",
                name: "badge",
              },
              {
                type: "string",
                label: "Título",
                name: "title",
              },
              {
                type: "string",
                label: "Descripción",
                name: "description",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "object",
                label: "Componentes de la caja",
                name: "features",
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: item?.title,
                  }),
                },
                fields: [
                  {
                    type: "string",
                    label: "Título",
                    name: "title",
                  },
                  {
                    type: "string",
                    label: "Descripción",
                    name: "description",
                    ui: {
                      component: "textarea",
                    },
                  },
                  {
                    type: "string",
                    label: "Icono",
                    name: "icon",
                    options: [
                      "Map",
                      "Dices",
                      "Users",
                      "Target",
                      "Zap",
                      "Shield",
                      "Swords",
                      "Skull",
                      "Flame",
                      "Crown",
                    ],
                  },
                  {
                    type: "image",
                    label: "Imagen del componente",
                    name: "image",
                    description: "Imagen opcional que aparece junto al bloque. Se puede ampliar al hacer clic. Si se deja vacía se muestra solo el icono.",
                  },
                ],
              },
            ],
          },
          // ===== FACTIONS =====
          {
            type: "object",
            label: "Facciones",
            name: "factions",
            fields: [
              {
                type: "string",
                label: "Etiqueta superior",
                name: "badge",
              },
              {
                type: "string",
                label: "Título",
                name: "title",
              },
              {
                type: "string",
                label: "Descripción",
                name: "description",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "object",
                label: "Lista de facciones",
                name: "items",
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: item?.name,
                  }),
                },
                fields: [
                  {
                    type: "string",
                    label: "Nombre",
                    name: "name",
                  },
                  {
                    type: "string",
                    label: "Lema",
                    name: "motto",
                  },
                  {
                    type: "string",
                    label: "Color de acento (hex)",
                    name: "accentColor",
                    description: "Código hexadecimal, ej: #2450a5",
                  },
                  {
                    type: "string",
                    label: "Icono",
                    name: "icon",
                    options: [
                      "Zap",
                      "Wind",
                      "Flame",
                      "Mountain",
                      "Shield",
                      "Skull",
                      "Swords",
                      "Eye",
                    ],
                  },
                  {
                    type: "image",
                    label: "Imagen de la facción",
                    name: "image",
                    description: "Imagen opcional que reemplaza el icono si se sube",
                  },
                  {
                    type: "string",
                    label: "Descripción",
                    name: "description",
                    ui: {
                      component: "textarea",
                    },
                  },
                ],
              },
            ],
          },
          // ===== RULES =====
          {
            type: "object",
            label: "Reglas (flujo de partida)",
            name: "rules",
            fields: [
              {
                type: "string",
                label: "Etiqueta superior",
                name: "badge",
              },
              {
                type: "string",
                label: "Título",
                name: "title",
              },
              {
                type: "string",
                label: "Descripción",
                name: "description",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "object",
                label: "Pasos de una ronda",
                name: "steps",
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: item?.number ? `Paso ${item.number}` : "Nuevo paso",
                  }),
                },
                fields: [
                  {
                    type: "string",
                    label: "Número",
                    name: "number",
                    description: "Ej: 01, 02, 03...",
                  },
                  {
                    type: "string",
                    label: "Título del paso",
                    name: "title",
                  },
                  {
                    type: "string",
                    label: "Descripción",
                    name: "description",
                    ui: {
                      component: "textarea",
                    },
                  },
                  {
                    type: "image",
                    label: "Imagen del paso",
                    name: "image",
                    description: "Imagen opcional que aparece junto al paso. Se puede ampliar al hacer clic. Si se deja vacía no aparece.",
                  },
                ],
              },
            ],
          },
          // ===== VIDEO BLOCK =====
          {
            type: "object",
            label: "Vídeo de cómo se juega",
            name: "videoBlock",
            fields: [
              {
                type: "boolean",
                label: "Mostrar bloque",
                name: "visible",
                description: "Activa o desactiva este bloque en la página",
              },
              {
                type: "string",
                label: "Etiqueta superior",
                name: "badge",
                description: "Texto pequeño que aparece encima del título",
              },
              {
                type: "string",
                label: "Título",
                name: "title",
              },
              {
                type: "string",
                label: "Descripción",
                name: "description",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                label: "URL del vídeo de YouTube",
                name: "youtubeUrl",
                description: "Enlace completo del vídeo de YouTube, ej: https://www.youtube.com/watch?v=...",
              },
            ],
          },
          // ===== SALES SHEET =====
          {
            type: "object",
            label: "Hoja de ventas",
            name: "salesSheet",
            fields: [
              {
                type: "boolean",
                label: "Mostrar bloque",
                name: "visible",
                description: "Activa o desactiva este bloque en la página",
              },
              {
                type: "string",
                label: "Etiqueta superior",
                name: "badge",
                description: "Texto pequeño que aparece encima del título",
              },
              {
                type: "string",
                label: "Título",
                name: "title",
              },
              {
                type: "string",
                label: "Descripción",
                name: "description",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                label: "Texto del enlace español",
                name: "spanishLinkText",
              },
              {
                type: "string",
                label: "URL hoja de ventas (español)",
                name: "spanishUrl",
                description: "Enlace a la hoja de ventas en español. Si se deja vacío, no se mostrará.",
              },
              {
                type: "string",
                label: "Texto del enlace inglés",
                name: "englishLinkText",
              },
              {
                type: "string",
                label: "URL hoja de ventas (inglés)",
                name: "englishUrl",
                description: "Enlace a la hoja de ventas en inglés. Si se deja vacío, no se mostrará.",
              },
            ],
          },
          // ===== FOOTER =====
          {
            type: "object",
            label: "Pie de página",
            name: "footer",
            fields: [
              {
                type: "string",
                label: "Nombre del juego",
                name: "gameName",
              },
              {
                type: "string",
                label: "Eslogan",
                name: "tagline",
              },
              {
                type: "string",
                label: "Texto de copyright",
                name: "copyright",
              },
            ],
          },
        ],
      },
    ],
  },
});
