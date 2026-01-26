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

