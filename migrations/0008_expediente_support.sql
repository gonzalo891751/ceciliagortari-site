-- Migration: Add 'expediente' kind support for presented project documents
-- Run: wrangler d1 execute gestionproyectos --file=migrations/0008_expediente_support.sql
--
-- SQLite does not support ALTER CHECK constraints directly.
-- Strategy: recreate table with expanded CHECK, migrate data, swap.

-- 1) Create new table with updated CHECK constraint
CREATE TABLE IF NOT EXISTS project_documents_v2 (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('main','material','expediente')),
  original_name TEXT NOT NULL,
  stored_key TEXT NOT NULL,
  mime_type TEXT,
  size_bytes INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2) Copy existing data
INSERT OR IGNORE INTO project_documents_v2
  SELECT id, project_id, kind, original_name, stored_key, mime_type, size_bytes, created_at, updated_at
  FROM project_documents;

-- 3) Drop old table and rename
DROP TABLE IF EXISTS project_documents;
ALTER TABLE project_documents_v2 RENAME TO project_documents;

-- 4) Recreate index
CREATE INDEX IF NOT EXISTS idx_project_documents_project_id ON project_documents(project_id);
