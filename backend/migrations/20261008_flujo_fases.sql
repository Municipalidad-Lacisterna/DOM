BEGIN;

ALTER TABLE solicitudes
    ADD COLUMN IF NOT EXISTS fase_actual integer NOT NULL DEFAULT 1;

UPDATE solicitudes AS solicitud
SET fase_actual = flujo.total_fases
FROM (
    SELECT id_tipo, MAX(orden) AS total_fases
    FROM fases_tramite
    GROUP BY id_tipo
) AS flujo
WHERE solicitud.id_tipo = flujo.id_tipo
  AND solicitud.estado_actual IN ('Aprobado', 'Finalizado');

COMMIT;
