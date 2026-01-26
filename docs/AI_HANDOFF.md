# AI Handoff

## CHECKPOINT
- Objetivo actual: Alinear CMS con la ruta real de contenido para que /admin publique en src/content/prensa.json y se refleje en /prensa y home.
- Archivos tocados:
  - src/admin/config.yml
- Cambios realizados:
  - Se corrigio la ruta del archivo de prensa para que el CMS escriba en src/content/prensa.json.
- Nota:
  - No existe content/prensa.json en la raiz del repo (no hay duplicado).
- Pendientes:
  - [ ] Publicar desde /admin y verificar commit en main.
  - [ ] Verificar deploy en Cloudflare Pages.
- Como validar:
  - npm run build
  - npm run dev
  - Abrir http://localhost:8080/content/prensa.json y http://localhost:8080/prensa/
- Que hacer en produccion:
  - Merge/push a main.
  - Re-deploy Cloudflare Pages.
  - Probar /content/prensa.json en produccion con cache bust (?v=timestamp).

