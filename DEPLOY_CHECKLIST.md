# DEPLOY CHECKLIST — Documentos del Proyecto (R2 + D1)

> Generado: 2026-02-27
> Proyecto: ceciliagortari-site
> Repo: github.com/gonzalo891751/ceciliagortari-site

---

## A) QUE YA ESTA OK (en el repo)

| Item | Estado | Detalle |
|------|--------|---------|
| `wrangler.toml` — D1 binding `DB` | OK | `database_name: gestionproyectos`, `database_id: 72124dc1-...` |
| `wrangler.toml` — R2 binding `PROJECTS_BUCKET` | OK | `bucket_name: ceciliagortari-projects` |
| `wrangler.toml` — `pages_build_output_dir: dist` | OK | Correcto para `wrangler pages deploy dist` |
| Migración SQL | OK | `migrations/0001_project_documents.sql` — tabla `project_documents` + indice |
| Endpoints Functions (8 archivos) | OK | CRUD documentos en `functions/api/projects/[id]/documents/...` |
| GET `/api/projects` extendido | OK | Incluye `has_main_doc` y `materials_count` via subqueries |
| Frontend actualizado | OK | Modal tabs, upload/download/preview, badges, sorting, mobile fix |
| Deploy script existente | OK | `npm run deploy:pages` → `wrangler pages deploy dist` |

---

## B) QUE FALTA PARA PRODUCCION

### B.1 — Acciones en Cloudflare (MANUAL, no se pueden hacer desde CLI o repo)

| # | Accion | Tipo | Urgencia |
|---|--------|------|----------|
| 1 | **Crear bucket R2** `ceciliagortari-projects` | CLI o Dashboard | BLOQUEANTE |
| 2 | **Correr migracion D1 remota** (tabla `project_documents`) | CLI | BLOQUEANTE |
| 3 | **Verificar bindings en Pages Settings** (si usa Git Integration) | Dashboard | BLOQUEANTE |
| 4 | **Verificar limites R2** (free tier: 10GB storage, 10M requests/mes Class A) | Dashboard | Informativo |

### B.2 — Problema critico: auto-create de tablas en runtime

`functions/api/projects/index.js` tiene un `ensureTable()` que ejecuta `CREATE TABLE IF NOT EXISTS` en cada request GET y POST. Esto incluye ahora tambien `project_documents`.

**Riesgo**: Funciona, pero es un anti-patron. Cada request paga el costo de 2 queries DDL innecesarias. En Fase 2 se recomienda remover y confiar en migraciones.

**Para produccion inmediata**: No es bloqueante. La tabla se va a crear sola en el primer request. Pero es preferible correr la migracion explicitamente.

### B.3 — Ningun endpoint de documentos valida que el binding `PROJECTS_BUCKET` exista

Si el bucket R2 no esta creado o el binding no esta configurado en Pages, todos los endpoints de documentos van a fallar con un error críptico tipo `Cannot read properties of undefined (reading 'put')`.

**Para produccion inmediata**: Se soluciona creando el bucket y configurando el binding. En Fase 2 se agrega validacion explicita.

---

## C) PASOS EXACTOS PARA COMPLETAR

### Paso 1: Crear bucket R2 (CLI)

```bash
npx wrangler r2 bucket create ceciliagortari-projects
```

**Verificacion:**
```bash
npx wrangler r2 bucket list
```
Debe aparecer `ceciliagortari-projects` en la lista.

**Alternativa Dashboard:**
1. Ir a https://dash.cloudflare.com → R2 Object Storage
2. Click "Create bucket"
3. Nombre: `ceciliagortari-projects`
4. Region: Auto (o la mas cercana)
5. Confirmar

---

### Paso 2: Correr migracion D1 en produccion (CLI)

```bash
npx wrangler d1 execute gestionproyectos --file=migrations/0001_project_documents.sql --remote
```

**Verificacion:**
```bash
npx wrangler d1 execute gestionproyectos --command="SELECT name FROM sqlite_master WHERE type='table' AND name='project_documents'" --remote
```
Debe devolver una fila con `project_documents`.

---

### Paso 3: Determinar metodo de deploy y configurar bindings

El proyecto soporta dos metodos. Necesitas saber CUAL estas usando:

#### Opcion A: Deploy manual con CLI (`wrangler pages deploy`)

Si usas `npm run deploy:pages` / `wrangler pages deploy dist`:
- Los bindings de `wrangler.toml` se aplican automaticamente en cada deploy.
- **No necesitas hacer nada extra en el Dashboard** para bindings.
- Solo necesitas que el bucket R2 y la DB D1 existan (pasos 1 y 2).

**Deploy:**
```bash
npm run build
npm run deploy:pages
```

#### Opcion B: Git Integration (GitHub → Cloudflare Pages auto-deploy)

Si el repo esta conectado a Cloudflare Pages via GitHub:
- `wrangler.toml` **SI se respeta** para bindings desde nov 2024 (con `compatibility_date >= 2024-09-23`). Tu `compatibility_date` es `2026-01-26`, asi que esta OK.
- Sin embargo, **verificá manualmente** que los bindings aparezcan en el Dashboard:

1. Ir a https://dash.cloudflare.com → Workers & Pages → `ceciliagortari-site`
2. Ir a **Settings** → **Functions** → **Bindings**
3. Verificar que aparezcan:
   - **D1 Database**: Variable name = `DB`, Database = `gestionproyectos`
   - **R2 Bucket**: Variable name = `PROJECTS_BUCKET`, Bucket = `ceciliagortari-projects`
4. Si **NO aparecen**, agregarlos manualmente:
   - Click "Add binding" → D1 Database → Variable: `DB` → Seleccionar `gestionproyectos`
   - Click "Add binding" → R2 Bucket → Variable: `PROJECTS_BUCKET` → Seleccionar `ceciliagortari-projects`
5. **Guardar** y hacer un nuevo deploy (push a main o redeploy manual).

**IMPORTANTE**: Si los bindings estan en `wrangler.toml` Y en el Dashboard, el de `wrangler.toml` tiene prioridad. No hay conflicto, pero evita duplicados confusos.

---

### Paso 4: Deploy

```bash
npm ci
npm run build
npm run deploy:pages
```

O si usas Git Integration: simplemente push a `main`.

---

### Paso 5: Build config (solo si Git Integration)

Verificar en Dashboard → Settings → Build & deployments:
- **Root directory**: `/` (NO `dist`)
- **Build command**: `npm run build`
- **Build output directory**: `dist`

(Esto ya deberia estar configurado segun `DEPLOY_PAGES_FUNCTIONS.md` existente)

---

## D) VERIFICACIONES POST-DEPLOY

### D.1 — Endpoints existentes siguen andando

```bash
curl -s "https://ceciliagortari.com.ar/api/projects" | head -c 200
```
Debe devolver JSON con proyectos. Ahora incluye `has_main_doc` y `materials_count`.

### D.2 — Endpoint de documentos responde

```bash
# Usar un project ID real (ej: P-0001)
curl -s "https://ceciliagortari.com.ar/api/projects/P-0001/documents"
```
Debe devolver `{"main":null,"materials":[]}` (asumiendo que no hay docs aun).

### D.3 — Upload funciona

Probar desde la UI:
1. Ir a `/gestionproyectos/`
2. Abrir un proyecto existente
3. Ir a tab "Documentos"
4. Subir un PDF como documento principal
5. Verificar que aparece el nombre, peso, fecha
6. Click "Vista previa" → debe abrir iframe con el PDF
7. Click "Descargar" → debe descargar con nombre `P-XXXX_titulo_Proyecto.pdf`

### D.4 — Verificar que R2 tiene el archivo

```bash
npx wrangler r2 object list ceciliagortari-projects --prefix="projects/"
```

### D.5 — Verificar tabla D1

```bash
npx wrangler d1 execute gestionproyectos --command="SELECT id, project_id, kind, original_name FROM project_documents" --remote
```

---

## E) RIESGOS CONOCIDOS

| Riesgo | Severidad | Mitigacion |
|--------|-----------|------------|
| **R2 free tier**: 10GB storage, 1M Class A ops (PUT), 10M Class B ops (GET)/mes | Baja | Suficiente para uso interno. Monitorear en Dashboard → R2 → Usage |
| **D1 free tier**: 5M rows read, 100K writes/dia, 5GB storage | Baja | Subqueries en GET /projects agregan 2 reads extra por proyecto. Con 100 proyectos = 200 reads extra por listado. Manejable |
| **Cloudflare Pages Functions**: max 100MB por upload request | Baja | Limite de 50MB por archivo esta debajo. OK |
| **Workers/Pages CPU time**: 10ms (free) / 30s (paid) por request | Media | Upload de archivos grandes puede acercarse al limite en free tier. Si falla, considerar Paid plan ($5/mes) |
| **Sin validacion de binding**: Si PROJECTS_BUCKET no existe, error críptico | Media | Se resuelve en Fase 2 con validacion explicita |
| **Auto-create tablas en runtime**: `ensureTable()` en cada request | Baja | Funciona pero es overhead innecesario. Se resuelve en Fase 2 |
| **Sin autenticacion en endpoints de documentos**: Cualquiera con el URL puede subir/borrar | Media | Actualmente toda la app es "publica dentro del PIN". Consistente con la decision tomada |
| **Nombre de archivo en Content-Disposition**: Caracteres especiales | Baja | Se usa slugify. Probado con tildes y ñ |
| **Preview de PDF en iframe**: Algunos navegadores mobiles no soportan bien iframes con PDF | Baja | Fallback: el usuario puede descargar |

---

## RESUMEN RAPIDO

```
ANTES DE DEPLOY:
1. wrangler r2 bucket create ceciliagortari-projects
2. wrangler d1 execute gestionproyectos --file=migrations/0001_project_documents.sql --remote
3. (Si Git Integration) Verificar bindings en Dashboard → Settings → Functions → Bindings

DEPLOY:
4. npm run build && npm run deploy:pages  (o push a main)

VERIFICAR:
5. curl https://ceciliagortari.com.ar/api/projects/P-0001/documents
6. Probar upload desde UI
```
