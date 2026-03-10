-- Tabla principal de gacetillas de prensa
CREATE TABLE gacetillas (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  resumen TEXT DEFAULT '',
  fecha_gacetilla TEXT NOT NULL,
  tema TEXT DEFAULT '',
  archivo_nombre TEXT,
  archivo_key TEXT,
  archivo_mime TEXT,
  archivo_size INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT DEFAULT NULL
);

-- Tabla relacional gacetilla <-> proyecto
CREATE TABLE gacetilla_proyectos (
  id TEXT PRIMARY KEY,
  gacetilla_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  UNIQUE(gacetilla_id, project_id)
);

CREATE INDEX idx_gacetillas_fecha ON gacetillas(fecha_gacetilla);
CREATE INDEX idx_gacetillas_deleted ON gacetillas(deleted_at);
CREATE INDEX idx_gacetilla_proyectos_gacetilla ON gacetilla_proyectos(gacetilla_id);
CREATE INDEX idx_gacetilla_proyectos_project ON gacetilla_proyectos(project_id);
