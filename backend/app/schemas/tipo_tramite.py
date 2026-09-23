"""Schemas Pydantic — Tipos de Trámite"""

from pydantic import BaseModel, ConfigDict


class TipoTramiteOut(BaseModel):
    """Catálogo de tipos de trámite (GET /api/tipos-tramite)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    nombre: str
    depto_responsable: str