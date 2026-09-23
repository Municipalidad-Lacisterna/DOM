"""
Router de Tipos de Trámite — DOM en Línea Municipal
GET /api/tipos-tramite → catálogo completo (para el portal ciudadano y bandejas).
GET /api/tipos-tramite/{tipo_id}/fases → fases del flujo de un tipo de trámite.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.config import get_db
from app.models import FaseTramite, TipoTramite
from app.schemas.fase_tramite import FaseTramiteOut
from app.schemas.tipo_tramite import TipoTramiteOut

router = APIRouter(prefix="/api/tipos-tramite", tags=["tipos-tramite"])


@router.get(
    "",
    response_model=list[TipoTramiteOut],
    summary="Listar todos los tipos de trámite (catálogo)",
)
async def listar_tipos(db: AsyncSession = Depends(get_db)):
    """Devuelve el catálogo ordenado por departamento y nombre."""
    stmt = (
        select(TipoTramite)
        .order_by(TipoTramite.depto_responsable, TipoTramite.nombre)
    )
    resultado = await db.execute(stmt)
    return resultado.scalars().all()


@router.get(
    "/{tipo_id}/fases",
    response_model=list[FaseTramiteOut],
    summary="Listar las fases del flujo de un tipo de trámite",
)
async def listar_fases_por_tipo(
    tipo_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Devuelve las fases ordenadas del flujo documental de un tipo de trámite."""
    tipo = await db.get(TipoTramite, tipo_id)
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de trámite no encontrado")

    stmt = (
        select(FaseTramite)
        .where(FaseTramite.id_tipo == tipo_id)
        .order_by(FaseTramite.orden)
    )
    resultado = await db.execute(stmt)
    return resultado.scalars().all()