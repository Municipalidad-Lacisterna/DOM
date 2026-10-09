from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class MensajeInternoCreate(BaseModel):
    mensaje: str = Field(..., min_length=1, max_length=1000)


class MensajeInternoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    id_solicitud: int
    mensaje: str
    fecha_creacion: datetime

    # Datos del funcionario que escribió
    funcionario_nombre_rol: str  # ej: "11111111-1 (DOTECAP)"
