# AUDIT — Gestión de Proyectos

## Historial de cambios

### v2: Modal Split View + Plan de Acción (Actual)

#### Diagnóstico Pre-Implementación

**Problema reportado**: "A veces no guarda / no se refresca"

**Causas identificadas**:
1. `saveProject()` construía el objeto local y lo metía en `projects[]` sin usar `result.project` devuelto por el backend → datos stale
2. Debounce de 300ms en `triggerSave()` podía pisar saves rápidos
3. Tabs Datos/Documentos creaban estados intermedios confusos
4. Sin scroll-lock: modal overlay permitía scroll del body

**Fixes aplicados**:
1. Backend como fuente de verdad: `saveProject()` usa `result.project` del API response
2. Split view reemplaza tabs (elimina estados intermedios)
3. `body.modal-open { overflow: hidden; }` para scroll-lock
4. Escape key handler para cerrar modales
5. Error handling visible en modal footer

#### Archivos modificados/creados

| Archivo | Acción |
|---------|--------|
| `migrations/0002_action_plan.sql` | Nueva migración: columna `action_plan TEXT` |
| `functions/api/projects/index.js` | GET/POST soportan `action_plan` (JSON array) |
| `src/gestionproyectos/index.html` | Split view, checklist, fix guardado |

#### Migración D1

```sql
ALTER TABLE projects ADD COLUMN action_plan TEXT DEFAULT '[]';
```

**Ejecutar**:
```bash
wrangler d1 execute gestionproyectos --file=migrations/0002_action_plan.sql --remote
```

---

### v1: Documentos (R2 + D1)

| Archivo | Acción |
|---------|--------|
| `wrangler.toml` | R2 binding `PROJECTS_BUCKET` |
| `migrations/0001_project_documents.sql` | Tabla `project_documents` |
| `functions/api/projects/[id]/documents/*` | CRUD de documentos |
| `src/gestionproyectos/index.html` | Upload/download/preview |

---

## TEST MANUAL

### 1. Crear Proyecto con Checklist
1. Click "+ Nuevo" → se abre modal split view
2. Llenar datos: Título, Tipo, Área
3. En "Plan de Acción": click "+ Plantillas" → aparecen 5 tareas
4. Agregar tarea manual: escribir texto + Enter
5. Tildar 2 tareas → barra de progreso se actualiza
6. Click "Guardar cambios" → "Guardado" verde
7. Columna docs habilitada para subir archivos
8. Cerrar modal → verificar mini progress bar en tabla

### 2. Editar Proyecto
1. Click en proyecto → Detalle → "Editar"
2. Cambiar título → "Guardar cambios"
3. Verificar en tabla y detalle

### 3. Checklist en Detalle (guardado instantáneo)
1. Click en proyecto con plan → Detalle
2. Tildar tarea → toast "Guardado" aparece
3. Progress bar se actualiza
4. Cerrar y reabrir → tarea sigue tildada

### 4. Documentos
1. Editar proyecto → columna derecha: subir PDF + materiales
2. Cerrar → detalle muestra documentos

### 5. Error Handling
1. Desconectar red → intentar guardar
2. Error rojo visible, modal NO se cierra

### 6. UX
1. Modal abierto → body sin scroll
2. Escape → cierra modal
3. Responsive: columnas se apilan en mobile
