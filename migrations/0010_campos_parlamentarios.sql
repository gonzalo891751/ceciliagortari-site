-- Migration 0010: campos parlamentarios y distinción entre autoría formal e impulso político
-- Run: npx wrangler d1 execute gestionproyectos --remote --file=migrations/0010_campos_parlamentarios.sql
--
-- Solo agrega columnas con valores por defecto: los registros existentes no cambian y la API
-- funciona antes y después de aplicarla (detecta las columnas disponibles).
--
-- numero_expediente  Número de expediente de la Cámara (ej. "20413").
-- titulo_oficial     "Asunto" tal como figura en la ficha oficial.
-- firmantes          Autores tal como figuran en el expediente oficial (autoría parlamentaria formal).
-- participacion      'bloque' (solo integrantes del bloque) | 'acompanamos' (con otros bloques) | '' (sin dato).
-- impulso            Origen político: 'cecilia' | 'emiliano' | 'gustavo' | 'conjunto' | 'otros' | 'pendiente'.
-- impulso_nota       Respaldo interno de la clasificación del impulso (no se publica).
-- norma_tipo         Ley | Resolución | Declaración, cuando fue aprobado.
-- norma_numero       Número de la norma (ej. "352/26").
-- fecha_aprobacion   Fecha de aprobación o sanción (YYYY-MM-DD).
-- enlace_oficial     Ficha oficial del expediente en hcdcorrientes.gov.ar.
-- fuente             Fuente documental de los datos parlamentarios.
-- verificado_at      Fecha de la última verificación contra la fuente oficial (YYYY-MM-DD).

ALTER TABLE projects ADD COLUMN numero_expediente TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN titulo_oficial TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN firmantes TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN participacion TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN impulso TEXT DEFAULT 'pendiente';
ALTER TABLE projects ADD COLUMN impulso_nota TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN norma_tipo TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN norma_numero TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN fecha_aprobacion TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN enlace_oficial TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN fuente TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN verificado_at TEXT DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_projects_numero_expediente ON projects(numero_expediente);
CREATE INDEX IF NOT EXISTS idx_projects_publicos ON projects(estado_preparacion, deleted_at, fecha_presentacion);

-- Documentos: permite marcar el PDF principal de descarga y rotular documentos adicionales
-- (por ejemplo, la Declaración o Resolución sancionada).
ALTER TABLE project_documents ADD COLUMN is_primary INTEGER DEFAULT 0;
ALTER TABLE project_documents ADD COLUMN public_label TEXT DEFAULT '';
