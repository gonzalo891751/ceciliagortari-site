-- Migration: Create project_documents table for file storage metadata
-- Run: wrangler d1 execute gestionproyectos --file=migrations/0001_project_documents.sql

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
