# Documentación de Cambios - Detalle de Prensa

## Resumen
Se han corregido los bugs reportados relacionados con el recorte de la imagen destacada y el renderizado de Markdown.

## Cambios Realizados

### 1. Fix Imagen Destacada (CSS)
Archivo: `assets/css/additions.css`
- Se eliminó `aspect-ratio: 16/9` del contenedor `.prensa-detail__image-container` para permitir dimensiones naturales.
- Se actualizó la clase `.prensa-detail__image` a:
  - `height: auto`
  - `object-fit: contain`
  - `max-height: 80vh`
Esto asegura que las imágenes verticales, horizontales y cuadradas se vean completas sin recorte.

### 2. Renderizado de Markdown (JS + HTML)
Archivos: `prensa/detalle/index.html`, `assets/js/prensa-detail.js`
- **Librería**: Se incluyó `marked.js` vía CDN en `prensa/detalle/index.html`.
  - URL: `https://cdn.jsdelivr.net/npm/marked/marked.min.js`
  - Ubicación: Antes de `prensa-detail.js`.
- **Implementación**: Se actualizó la función `parseContent` en `assets/js/prensa-detail.js` para utilizar `marked.parse(content)`.
- **Fallback**: Se mantuvo una lógica mínima de respaldo en caso de que la librería no cargue.

## Pruebas
- **Imágenes**: Verificadas por lógica de CSS (contain + auto height).
- **Markdown**: El contenido `## Título` ahora se renderizará como `<h2>Título</h2>` gracias a `marked.js`.
