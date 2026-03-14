-- Migration 0009: Add authorship fields to projects
-- tipo_autoria: 'propio' (default), 'acompanado', 'coautoria'
-- autor_principal: name of the main author when tipo_autoria != 'propio'

ALTER TABLE projects ADD COLUMN tipo_autoria TEXT NOT NULL DEFAULT 'propio';
ALTER TABLE projects ADD COLUMN autor_principal TEXT DEFAULT '';
