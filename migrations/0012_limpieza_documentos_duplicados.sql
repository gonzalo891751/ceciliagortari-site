-- 0012 · Elimina 15 registros duplicados de PDF de expediente (mismo nombre y tamaño, cargados con < 1 s de diferencia)
-- Generado por scripts/auditoria-legislativa-2026-10.mjs a partir de fuentes oficiales relevadas
-- (corte 2026-09-16) e instantánea D1 docs/legislative-update-2026-10-22/d1-snapshot-2026-10-22.txt (sha256 165c521c414b44c9…).
-- Solo completa campos vacíos: nunca sobrescribe datos cargados por el equipo. Idempotente.
-- Requiere migrations/0010_campos_parlamentarios.sql aplicada antes.
-- Conserva el registro más antiguo de cada par. Los objetos R2 huérfanos se listan en
-- docs/legislative-update-2026-10-22/r2-objetos-duplicados.txt y se eliminan aparte, tras verificar su hash.

DELETE FROM project_documents WHERE id = '045392e4-b9ba-449e-a1a2-2d995f0efe92' AND project_id = 'EXP-20011' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20011' AND k.kind = 'expediente' AND k.id <> '045392e4-b9ba-449e-a1a2-2d995f0efe92');
DELETE FROM project_documents WHERE id = 'a74fbd46-5d84-487d-bc47-7b9bd7a30f5b' AND project_id = 'EXP-20014' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20014' AND k.kind = 'expediente' AND k.id <> 'a74fbd46-5d84-487d-bc47-7b9bd7a30f5b');
DELETE FROM project_documents WHERE id = '4f2ce0fc-64c2-4a84-9cd2-39f694e47f88' AND project_id = 'EXP-20043' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20043' AND k.kind = 'expediente' AND k.id <> '4f2ce0fc-64c2-4a84-9cd2-39f694e47f88');
DELETE FROM project_documents WHERE id = 'abeca914-02a5-4f27-b2c9-7feddd729b80' AND project_id = 'EXP-20056' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20056' AND k.kind = 'expediente' AND k.id <> 'abeca914-02a5-4f27-b2c9-7feddd729b80');
DELETE FROM project_documents WHERE id = '4a4272e9-5069-41c8-8243-0cf7c1d65cbc' AND project_id = 'EXP-20067' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20067' AND k.kind = 'expediente' AND k.id <> '4a4272e9-5069-41c8-8243-0cf7c1d65cbc');
DELETE FROM project_documents WHERE id = '5794444f-67d4-44f1-ad5b-42e966ac8499' AND project_id = 'EXP-20084' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20084' AND k.kind = 'expediente' AND k.id <> '5794444f-67d4-44f1-ad5b-42e966ac8499');
DELETE FROM project_documents WHERE id = '48bd829d-4ebe-498a-be4f-253df675d6d9' AND project_id = 'EXP-20100' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20100' AND k.kind = 'expediente' AND k.id <> '48bd829d-4ebe-498a-be4f-253df675d6d9');
DELETE FROM project_documents WHERE id = '5852b45f-3c1a-4c12-8413-e195a063fa3a' AND project_id = 'EXP-20116' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20116' AND k.kind = 'expediente' AND k.id <> '5852b45f-3c1a-4c12-8413-e195a063fa3a');
DELETE FROM project_documents WHERE id = '22e1ab7d-eef7-451e-85c5-f3889673c8a4' AND project_id = 'EXP-20117' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20117' AND k.kind = 'expediente' AND k.id <> '22e1ab7d-eef7-451e-85c5-f3889673c8a4');
DELETE FROM project_documents WHERE id = '0768538b-acb7-48f9-b0f0-6a77d6876304' AND project_id = 'EXP-20118' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20118' AND k.kind = 'expediente' AND k.id <> '0768538b-acb7-48f9-b0f0-6a77d6876304');
DELETE FROM project_documents WHERE id = '6a63010a-0abc-448a-bdbd-0a839d962f94' AND project_id = 'EXP-20119' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20119' AND k.kind = 'expediente' AND k.id <> '6a63010a-0abc-448a-bdbd-0a839d962f94');
DELETE FROM project_documents WHERE id = 'a92c548f-1111-4447-8ab1-5e7632f17df2' AND project_id = 'EXP-20134' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20134' AND k.kind = 'expediente' AND k.id <> 'a92c548f-1111-4447-8ab1-5e7632f17df2');
DELETE FROM project_documents WHERE id = 'b713c926-7922-4a90-8931-0f42ee0c4ba8' AND project_id = 'EXP-20145' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20145' AND k.kind = 'expediente' AND k.id <> 'b713c926-7922-4a90-8931-0f42ee0c4ba8');
DELETE FROM project_documents WHERE id = '50f4e766-5486-485d-a2ae-ee64d7ad5b7d' AND project_id = 'EXP-20176' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20176' AND k.kind = 'expediente' AND k.id <> '50f4e766-5486-485d-a2ae-ee64d7ad5b7d');
DELETE FROM project_documents WHERE id = '62bf6554-eef3-49e5-8c9c-7bb65a6c74fc' AND project_id = 'EXP-20192' AND kind = 'expediente'
  AND EXISTS (SELECT 1 FROM project_documents k WHERE k.project_id = 'EXP-20192' AND k.kind = 'expediente' AND k.id <> '62bf6554-eef3-49e5-8c9c-7bb65a6c74fc');
