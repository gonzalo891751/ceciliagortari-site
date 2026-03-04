-- Migration: Add action_plan column to projects table
-- Run: wrangler d1 execute gestionproyectos --file=migrations/0002_action_plan.sql

ALTER TABLE projects ADD COLUMN action_plan TEXT DEFAULT '[]';
