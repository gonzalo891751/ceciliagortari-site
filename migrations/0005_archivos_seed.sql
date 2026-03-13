-- Carpetas base iniciales para el módulo Archivos
INSERT INTO archive_folders (id, name, parent_id, sort_order, created_at, updated_at) VALUES
  ('folder-institucional',       'Institucional',             NULL, 1, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('folder-legislacion',         'Legislación y reglamentos', NULL, 2, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('folder-modelos',             'Modelos',                   NULL, 3, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('folder-proyectos',           'Proyectos presentados',     NULL, 4, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('folder-notas',               'Notas y oficios',           NULL, 5, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('folder-gacetillas-prensa',   'Gacetillas y prensa',       NULL, 6, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('folder-material-trabajo',    'Material de trabajo',        NULL, 7, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'),
  ('folder-archivo-historico',   'Archivo histórico',          NULL, 8, '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z');
