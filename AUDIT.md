# AUDIT — Documentos del Proyecto

## Archivos modificados

| Archivo | Acción |
|---------|--------|
| `wrangler.toml` | Agregado R2 binding `PROJECTS_BUCKET` |
| `functions/api/projects/index.js` | Extendido GET con `has_main_doc` + `materials_count` subqueries; auto-create `project_documents` table |
| `src/gestionproyectos/index.html` | Modal con tabs Datos/Documentos, badges, SVG icons, sorting, upload/download/preview, mobile fix |

## Archivos creados

| Archivo | Propósito |
|---------|-----------|
| `migrations/0001_project_documents.sql` | Esquema D1 para `project_documents` |
| `functions/api/projects/[id]/documents/index.js` | GET: listar docs de un proyecto |
| `functions/api/projects/[id]/documents/main.js` | POST: subir/reemplazar main, DELETE: borrar main |
| `functions/api/projects/[id]/documents/materials.js` | POST: subir materiales múltiples |
| `functions/api/projects/[id]/documents/materials/[docId].js` | DELETE: borrar un material |
| `functions/api/projects/[id]/documents/[docId]/download.js` | GET: descargar con Content-Disposition: attachment |
| `functions/api/projects/[id]/documents/[docId]/preview.js` | GET: preview con Content-Disposition: inline |

## Endpoints nuevos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/projects/:id/documents` | Lista main + materials de un proyecto |
| POST | `/api/projects/:id/documents/main` | Sube/reemplaza documento principal (PDF/DOCX) |
| DELETE | `/api/projects/:id/documents/main` | Borra documento principal |
| POST | `/api/projects/:id/documents/materials` | Sube múltiples materiales |
| DELETE | `/api/projects/:id/documents/materials/:docId` | Borra un material |
| GET | `/api/projects/:id/documents/:docId/download` | Descarga con nombre auto-generado |
| GET | `/api/projects/:id/documents/:docId/preview` | Preview inline (PDF/imágenes) |

## Endpoint modificado

| Método | Ruta | Cambio |
|--------|------|--------|
| GET | `/api/projects` | Ahora incluye `has_main_doc` (0/1) y `materials_count` (int) por proyecto |

## Migración D1

```sql
CREATE TABLE IF NOT EXISTS project_documents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('main','material')),
  original_name TEXT NOT NULL,
  stored_key TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
```

## Setup

### 1. Crear bucket R2
```bash
wrangler r2 bucket create ceciliagortari-projects
```

### 2. Correr migración D1
```bash
wrangler d1 execute gestionproyectos --file=migrations/0001_project_documents.sql
```

Para producción (remoto):
```bash
wrangler d1 execute gestionproyectos --file=migrations/0001_project_documents.sql --remote
```

### 3. Testing local
```bash
npx wrangler pages dev dist
```

Wrangler lee automáticamente `wrangler.toml` para bindings D1 y R2 en local.

## Checklist de pruebas manuales

### Desktop
- [ ] Crear proyecto nuevo → tab "Documentos" se habilita después de guardar
- [ ] En tab Documentos, subir PDF como documento principal → aparece con nombre, tamaño, fecha
- [ ] Reemplazar documento principal → viejo desaparece, nuevo se muestra
- [ ] Subir múltiples materiales → aparecen listados
- [ ] Click "Vista previa" en PDF → iframe con preview inline
- [ ] Click "Vista previa" en imagen → se muestra la imagen
- [ ] Archivo DOCX/XLSX → "Sin vista previa disponible" + botón descargar
- [ ] Descargar doc principal → nombre: `P-XXXX_titulo_Proyecto.pdf`
- [ ] Descargar material → nombre: `P-XXXX_titulo_Material.ext`
- [ ] Eliminar material individual → desaparece de la lista
- [ ] Eliminar documento principal → zona de upload reaparece
- [ ] En la tabla: badge azul (file icon) junto al título si hay main doc
- [ ] En la tabla: badge violeta (paperclip + N) si hay materiales
- [ ] Botón "Descargar" en acciones solo aparece si hay docs
- [ ] Click en botón "Descargar" en tabla → abre modal de documentos
- [ ] Sorting: click en encabezado "Proyecto" → ordena A-Z, click de nuevo → Z-A
- [ ] Sorting: indicador ▲/▼ visible en columna activa
- [ ] Headers de tabla sortables para: Proyecto, Tipo, Responsable, Preparación, Fechas, Actualizado

### Mobile (< 768px)
- [ ] Header: botones se organizan en grid 2x2, "Nuevo" ocupa fila completa
- [ ] Cards muestran badges de documentos junto al ID
- [ ] Botones de acción en cards usan íconos SVG (no emojis)
- [ ] Botón "Documentos" aparece en cards si hay docs
- [ ] Modal de proyecto con tabs funciona correctamente
- [ ] Modal de preview se adapta al ancho
