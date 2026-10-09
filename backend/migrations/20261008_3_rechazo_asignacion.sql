BEGIN;

ALTER TABLE solicitudes
    ADD COLUMN IF NOT EXISTS id_funcionario_asignado integer NULL
    REFERENCES funcionarios(id) ON DELETE SET NULL;

COMMIT;
