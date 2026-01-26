# AI Handoff

## CHECKPOINT
- Objetivo: Corregir rutas de uploads del CMS para que los archivos queden en src/assets/uploads, se copien a dist, y asegurar URLs con espacios en prensa.
- Archivos tocados:
  - src/admin/config.yml
  - src/assets/js/prensa-feed.js
  - src/assets/js/prensa-detail.js
- Cambios realizados:
  - Se actualizó media_folder del CMS a src/assets/uploads (public_folder se mantiene en /assets/uploads).
  - Se migraron uploads desde assets/uploads a src/assets/uploads (imagen destacada y PDF).
  - Se agregó encodeURI en imágenes y enlaces de documentos para soportar URLs con espacios.
- Pendientes:
  - [ ] Ejecutar npm run dev y validar en navegador los endpoints de prensa.
  - [ ] Verificar deploy en Cloudflare Pages.
- Cómo validar:
  - npm run build
  - npm run dev
  - Abrir http://localhost:8080/content/prensa.json
  - Abrir http://localhost:8080/assets/uploads/<archivo>
  - Abrir http://localhost:8080/ (Home - Novedades)
  - Abrir http://localhost:8080/prensa/detalle/?id=<id>

## CHECKPOINT
- Objetivo: Dejar de trackear dist/ para evitar conflictos binarios en GitHub Desktop.
- Archivos tocados:
  - .gitignore
- Comandos ejecutados:
  - git checkout --ours src/content/prensa.json
  - git add src/content/prensa.json
  - git rm -r --cached dist
- Cómo validar:
  - git status -sb
  - git ls-files | find dist


## CHECKPOINT
- Objetivo: Agregar SSR de metadatos OG/Twitter/canonical para detalle de prensa con ?id= sin romper el render cliente.
- Archivos tocados:
  - src/functions/prensa/detalle/index.ts
- Cambios realizados:
  - Se actualizo la function para leer /content/prensa.json via ASSETS (con fallback fetch), buscar item por id/slug y construir metadatos dinamicos.
  - Se normalizo og:image a URL absoluta con encodeURI y se agregaron twitter tags y canonical.
  - Se devolvio HTML completo con el mismo markup base y scripts del detalle para no afectar el cliente.
- Pendientes:
  - [ ] Ejecutar npm run dev y probar el HTML servido por la function con un User-Agent de bot.
  - [ ] Verificar en entorno Cloudflare Pages con WhatsApp/FB Debugger.
- Como validar:
  - npm run build
  - npm run dev
  - curl -A "facebookexternalhit/1.1" "http://localhost:8080/prensa/detalle/?id=<id>" | rg "og:title|og:image|twitter:title|canonical"
  - Abrir en navegador /prensa/detalle/?id=<id> y confirmar render normal

## CHECKPOINT (SOCIAL PREVIEW FIX - FINAL)
- Objetivo: Solucionar que Cloudflare Pages no ejecutaba la Function de prensa/detalle por estar en carpeta incorrecta (`src/functions`) y ser opacada por archivo estático.
- Archivos tocados:
  - `.eleventy.js` (se eliminó `addPassthroughCopy("src/functions")`)
  - `functions/prensa/detalle.ts` (NUEVO, movido desde `src/functions`)
- Cambios realizados:
  - Se creó carpeta `/functions` en la raíz (estándar de CF Pages).
  - Se implementó la lógica de detección de bots y generación de OG tags en `/functions/prensa/detalle.ts`.
  - Se eliminó la copia de `src/functions` hacia `dist` para evitar conflictos.
  - Se limpió `dist` para asegurar build limpio.
- Validación realizada:
  - `npm run build` genera `dist` limpio (SIN `dist/functions`).
  - `dist/prensa/detalle/index.html` existe para usuarios normales.
- Cómo validar en Prod:
  - `curl -A "facebookexternalhit/1.1" "https://www.ceciliagortari.com.ar/prensa/detalle/?id=2026-01-26-solidaridad-alal-goya-despidos"`
  - Verificar que devuelve `<meta property="og:title" content="...">` dinámico.
