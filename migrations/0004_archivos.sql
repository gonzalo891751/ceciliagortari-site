-- Tabla de carpetas del módulo Archivos
CREATE TABLE archive_folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  parent_id TEXT DEFAULT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT DEFAULT NULL
);

CREATE INDEX idx_archive_folders_parent ON archive_folders(parent_id);
CREATE INDEX idx_archive_folders_deleted ON archive_folders(deleted_at);

-- Tabla de archivos del módulo Archivos
CREATE TABLE archive_files (
  id TEXT PRIMARY KEY,
  folder_id TEXT DEFAULT NULL,
  original_name TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  mime_type TEXT,
  extension TEXT,
  size_bytes INTEGER DEFAULT 0,
  is_pinned INTEGER DEFAULT 0,
  uploaded_by TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT DEFAULT NULL
);

CREATE INDEX idx_archive_files_folder ON archive_files(folder_id);
CREATE INDEX idx_archive_files_deleted ON archive_files(deleted_at);
CREATE INDEX idx_archive_files_pinned ON archive_files(is_pinned);
