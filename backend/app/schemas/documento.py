"""Schemas Pydantic — Documentos"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DocumentoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    id_solicitud: int
    tipo_documento: str
    ruta_archivo: str
    fecha_subida: datetime | None = None