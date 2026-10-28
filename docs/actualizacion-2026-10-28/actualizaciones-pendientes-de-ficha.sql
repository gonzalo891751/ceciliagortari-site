-- Actualización de expedientes ya cargados, según el informe oficial de la sesión del 28/10/2026.
-- NO APLICAR hasta validar cada cambio contra la ficha oficial (regla 7 del procedimiento):
-- desde el entorno de esta actualización hcdcorrientes.gov.ar no fue accesible.
-- Al confirmar, completar verificado_at con la fecha de la verificación.
--   npx wrangler d1 execute gestionproyectos --remote --file=docs/actualizacion-2026-10-28/actualizaciones-pendientes-de-ficha.sql

-- EXP-20332 · Resolución · Reactivación de balsa Goya-Reconquista
-- Informe 28/10/2026, Orden del Día 08: Despacho 3363 (Asuntos Constitucionales y Legislación General),
-- sanción favorable sin modificaciones → "RESOLUCIÓN 17".
-- Ficha a verificar: https://hcdcorrientes.gov.ar/expedientes/20332/
UPDATE projects SET
  estado_tramite = 'Aprobado',
  norma_tipo = 'Resolución',
  norma_numero = '17/26',
  fecha_aprobacion = '2026-10-28',
  fuente = 'Informe oficial de sesión (Informe-26-08-26-2.pdf), ficha oficial de la Cámara de Diputados e informe oficial de la sesión del 28/10/2026 (Informe-28-10-26.pdf).',
  updated_at = '2026-10-28T12:00:00.000Z'
WHERE id = 'EXP-20332' AND deleted_at IS NULL;
