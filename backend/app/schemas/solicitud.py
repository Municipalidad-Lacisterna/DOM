"""Schemas Pydantic — Solicitante / Predio / Solicitudes"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ── Entrada: ingreso de trámite ─────────────────────────────────────
class SolicitanteIngreso(BaseModel):
    """Datos del ciudadano que presenta el trámite."""

    rut: str = Field(
        ...,
        max_length=12,
        pattern=r"^\d{1,8}-[\dkK]$",
        description="RUT formato chileno: 12345678-k",
    )
    nombres: str = Field(..., max_length=120)
    email: EmailStr


class PredioIngreso(BaseModel):
    """Datos del predio involucrado en el trámite."""

    rol_sii: str = Field(..., max_length=20, description="Rol SII ej: 1234-5")
    direccion: str = Field(..., max_length=250)


class SolicitudIngreso(BaseModel):
    """Payload completo de POST /api/solicitudes/ingreso."""

    solicitante: SolicitanteIngreso
    predio: PredioIngreso
    id_tipo: int = Field(..., gt=0, description="ID de tipos_tramite")


# ── Entrada: cambio de estado ───────────────────────────────────────
class EstadoUpdate(BaseModel):
    """Payload de PUT /api/solicitudes/{id}/estado."""

    estado_nuevo: str = Field(..., min_length=2, max_length=50)
    id_funcionario: int | None = Field(
        None, gt=0, description="Quién hace el cambio (opcional en fase dev)"
    )
    observaciones: str | None = Field(None, max_length=500)


# ── Entrada: edición de un trámite (intranet) ───────────────────────
class SolicitudUpdate(BaseModel):
    """Payload de PUT /api/solicitudes/{id} — corrección por funcionario.

    Todos los campos son opcionales: solo se actualiza lo que viene.
    Los datos de solicitante/predio siguen get-or-create (por RUT / Rol SII).
    """

    solicitante: SolicitanteIngreso | None = None
    predio: PredioIngreso | None = None
    id_tipo: int | None = Field(None, gt=0, description="ID de tipos_tramite")


# ── Salida: solicitud simple (ingreso / cambio de estado) ──────────
class SolicitudOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    numero_ingreso: str
    estado_actual: str
    id_solicitante: int
    id_predio: int
    id_tipo: int
    fecha_creacion: datetime | None = None


# ── Salida: fila de bandeja (con datos relacionados) ────────────────
class SolicitudBandejaOut(BaseModel):
    id: int
    numero_ingreso: str
    estado_actual: str
    fecha_creacion: datetime | None = None

    id_tipo: int = Field(gt=0, description="Id del tipo de trámite")

    tipo_tramite: str
    depto_responsable: str

    solicitante_rut: str
    solicitante_nombres: str
    solicitante_email: str

    predio_rol_sii: str
    predio_direccion: str