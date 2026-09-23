from pydantic import BaseModel, ConfigDict


class FaseTramiteOut(BaseModel):
    """Fase de un tipo de trámite (etapa del flujo documental)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    id_tipo: int
    orden: int
    nombre_fase: str
    responsable: str | None = None
    descripcion: str | None = None