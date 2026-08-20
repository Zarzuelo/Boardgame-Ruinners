// tina/config.ts
import { defineConfig } from "tinacms";
var branch = process.env.TINA_BRANCH || process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || "main";
var config_default = defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID || null,
  token: process.env.TINA_TOKEN || null,
  build: {
    outputFolder: "admin",
    publicFolder: "public"
  },
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public"
    }
  },
  schema: {
    collections: [
      {
        name: "pages",
        label: "P\xE1ginas",
        path: "src/content/pages",
        format: "md",
        ui: {
          allowedActions: {
            create: false,
            delete: false
          }
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
                description: "Texto peque\xF1o que aparece encima del t\xEDtulo (jugadores, edad, duraci\xF3n)"
              },
              {
                type: "string",
                label: "T\xEDtulo principal",
                name: "title"
              },
              {
                type: "string",
                label: "Subt\xEDtulo",
                name: "subtitle"
              },
              {
                type: "string",
                label: "Descripci\xF3n",
                name: "description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                label: "Texto del bot\xF3n principal",
                name: "ludoButtonText"
              },
              {
                type: "string",
                label: "Enlace del bot\xF3n principal",
                name: "ludoUrl"
              },
              {
                type: "string",
                label: "Texto del segundo bot\xF3n",
                name: "salesButtonText"
              },
              {
                type: "string",
                label: "Enlace del segundo bot\xF3n",
                name: "salesUrl"
              },
              {
                type: "string",
                label: "Texto del tercer bot\xF3n",
                name: "videoButtonText"
              },
              {
                type: "string",
                label: "Enlace del tercer bot\xF3n",
                name: "videoUrl"
              },
              {
                type: "image",
                label: "Imagen de fondo",
                name: "backgroundImage",
                description: "Imagen de portada que aparece de fondo en la secci\xF3n Hero"
              },
              {
                type: "image",
                label: "Imagen de portada del juego",
                name: "coverImage",
                description: "Imagen opcional que se muestra junto al texto del Hero. Si se deja vac\xEDa no aparece. Se puede ampliar al hacer clic."
              }
            ]
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
                name: "badge"
              },
              {
                type: "string",
                label: "T\xEDtulo",
                name: "title"
              },
              {
                type: "string",
                label: "Descripci\xF3n",
                name: "description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "object",
                label: "Componentes de la caja",
                name: "features",
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: item?.title
                  })
                },
                fields: [
                  {
                    type: "string",
                    label: "T\xEDtulo",
                    name: "title"
                  },
                  {
                    type: "string",
                    label: "Descripci\xF3n",
                    name: "description",
                    ui: {
                      component: "textarea"
                    }
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
                      "Crown"
                    ]
                  },
                  {
                    type: "image",
                    label: "Imagen del componente",
                    name: "image",
                    description: "Imagen opcional que aparece junto al bloque. Se puede ampliar al hacer clic. Si se deja vac\xEDa se muestra solo el icono."
                  }
                ]
              }
            ]
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
                name: "badge"
              },
              {
                type: "string",
                label: "T\xEDtulo",
                name: "title"
              },
              {
                type: "string",
                label: "Descripci\xF3n",
                name: "description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "object",
                label: "Lista de facciones",
                name: "items",
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: item?.name
                  })
                },
                fields: [
                  {
                    type: "string",
                    label: "Nombre",
                    name: "name"
                  },
                  {
                    type: "string",
                    label: "Lema",
                    name: "motto"
                  },
                  {
                    type: "string",
                    label: "Color de acento (hex)",
                    name: "accentColor",
                    description: "C\xF3digo hexadecimal, ej: #2450a5"
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
                      "Eye"
                    ]
                  },
                  {
                    type: "image",
                    label: "Imagen de la facci\xF3n",
                    name: "image",
                    description: "Imagen opcional que reemplaza el icono si se sube"
                  },
                  {
                    type: "string",
                    label: "Descripci\xF3n",
                    name: "description",
                    ui: {
                      component: "textarea"
                    }
                  }
                ]
              }
            ]
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
                name: "badge"
              },
              {
                type: "string",
                label: "T\xEDtulo",
                name: "title"
              },
              {
                type: "string",
                label: "Descripci\xF3n",
                name: "description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "object",
                label: "Pasos de una ronda",
                name: "steps",
                list: true,
                ui: {
                  itemProps: (item) => ({
                    label: item?.number ? `Paso ${item.number}` : "Nuevo paso"
                  })
                },
                fields: [
                  {
                    type: "string",
                    label: "N\xFAmero",
                    name: "number",
                    description: "Ej: 01, 02, 03..."
                  },
                  {
                    type: "string",
                    label: "T\xEDtulo del paso",
                    name: "title"
                  },
                  {
                    type: "string",
                    label: "Descripci\xF3n",
                    name: "description",
                    ui: {
                      component: "textarea"
                    }
                  },
                  {
                    type: "image",
                    label: "Imagen del paso",
                    name: "image",
                    description: "Imagen opcional que aparece junto al paso. Se puede ampliar al hacer clic. Si se deja vac\xEDa no aparece."
                  }
                ]
              }
            ]
          },
          // ===== VIDEO BLOCK =====
          {
            type: "object",
            label: "V\xEDdeo de c\xF3mo se juega",
            name: "videoBlock",
            fields: [
              {
                type: "boolean",
                label: "Mostrar bloque",
                name: "visible",
                description: "Activa o desactiva este bloque en la p\xE1gina"
              },
              {
                type: "string",
                label: "Etiqueta superior",
                name: "badge",
                description: "Texto peque\xF1o que aparece encima del t\xEDtulo"
              },
              {
                type: "string",
                label: "T\xEDtulo",
                name: "title"
              },
              {
                type: "string",
                label: "Descripci\xF3n",
                name: "description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                label: "URL del v\xEDdeo de YouTube",
                name: "youtubeUrl",
                description: "Enlace completo del v\xEDdeo de YouTube, ej: https://www.youtube.com/watch?v=..."
              }
            ]
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
                description: "Activa o desactiva este bloque en la p\xE1gina"
              },
              {
                type: "string",
                label: "Etiqueta superior",
                name: "badge",
                description: "Texto peque\xF1o que aparece encima del t\xEDtulo"
              },
              {
                type: "string",
                label: "T\xEDtulo",
                name: "title"
              },
              {
                type: "string",
                label: "Descripci\xF3n",
                name: "description",
                ui: {
                  component: "textarea"
                }
              },
              {
                type: "string",
                label: "Texto del enlace espa\xF1ol",
                name: "spanishLinkText"
              },
              {
                type: "string",
                label: "URL hoja de ventas (espa\xF1ol)",
                name: "spanishUrl",
                description: "Enlace a la hoja de ventas en espa\xF1ol. Si se deja vac\xEDo, no se mostrar\xE1."
              },
              {
                type: "string",
                label: "Texto del enlace ingl\xE9s",
                name: "englishLinkText"
              },
              {
                type: "string",
                label: "URL hoja de ventas (ingl\xE9s)",
                name: "englishUrl",
                description: "Enlace a la hoja de ventas en ingl\xE9s. Si se deja vac\xEDo, no se mostrar\xE1."
              }
            ]
          },
          // ===== FOOTER =====
          {
            type: "object",
            label: "Pie de p\xE1gina",
            name: "footer",
            fields: [
              {
                type: "string",
                label: "Nombre del juego",
                name: "gameName"
              },
              {
                type: "string",
                label: "Eslogan",
                name: "tagline"
              },
              {
                type: "string",
                label: "Texto de copyright",
                name: "copyright"
              }
            ]
          }
        ]
      }
    ]
  }
});
export {
  config_default as default
};
