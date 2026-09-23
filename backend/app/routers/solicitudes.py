"""
Router de Solicitudes — DOM en Línea Municipal
Endpoints: ingreso, cambio de estado (con log), bandeja del funcionario.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database.config import get_db
from app.models import (
    Funcionario,
    LogEstadoTramite,
    Predio,
    Solicitud,
    Solicitante,
    TipoTramite,
)
from app.schemas.solicitud import (
    EstadoUpdate,
    SolicitudBandejaOut,
    SolicitudIngreso,
    SolicitudOut,
    SolicitudUpdate,
)

router = APIRouter(prefix="/api/solicitudes", tags=["solicitudes"])

# ── Flujo válido de estados del trámite ─────────────────────────────
ESTADOS_VALIDOS: set[str] = {
    "Ingresado",
    "En Revisión",
    "En Corrección",
    "Aprobado",
    "Rechazado",
    "Finalizado",
}


# ── Helper: generar numero_ingreso único por año ─────────────────────
async def _generar_numero_ingreso(db: AsyncSession) -> str:
    """DOM-{año}-{secuencia:03d}  — secuencia reinicia cada año."""
    anio = datetime.now().year
    prefijo = f"DOM-{anio}-"

    resultado = await db.execute(
        select(func.max(Solicitud.numero_ingreso)).where(
            Solicitud.numero_ingreso.like(f"{prefijo}%")
        )
    )
    ultimo = resultado.scalar()

    if ultimo is None:
        return f"{prefijo}001"

    secuencia = int(ultimo.split("-")[-1]) + 1
    return f"{prefijo}{secuencia:03d}"


# ═══════════════════════════════════════════════════════════════════
# 1. POST  /api/solicitudes/ingreso
# ═══════════════════════════════════════════════════════════════════
@router.post(
    "/ingreso",
    response_model=SolicitudOut,
    status_code=201,
    summary="Ingresar un nuevo trámite municipal",
)
async def crear_solicitud(data: SolicitudIngreso, db: AsyncSession = Depends(get_db)):
    """
    Crea la solicitud con estado inicial **'Ingresado'**.

    - Si el RUT o Rol SII ya existen, reutiliza el registro (get-or-create).
    - El `numero_ingreso` se genera automáticamente: DOM-2026-001, etc.
    - Se inserta el primer registro en `log_estados_tramite` con
      `estado_anterior = None`.
    """

    # ── 1. Solicitante (get-or-create) ───────────────────────────────
    stmt = select(Solicitante).where(Solicitante.rut == data.solicitante.rut)
    resultado = await db.execute(stmt)
    solicitante = resultado.scalar_one_or_none()

    if not solicitante:
        solicitante = Solicitante(**data.solicitante.model_dump())
        db.add(solicitante)
        await db.flush()  # obtiene el id sin commitear

    # ── 2. Predio (get-or-create) ───────────────────────────────────
    stmt = select(Predio).where(Predio.rol_sii == data.predio.rol_sii)
    resultado = await db.execute(stmt)
    predio = resultado.scalar_one_or_none()

    if not predio:
        predio = Predio(**data.predio.model_dump())
        db.add(predio)
        await db.flush()

    # ── 3. Validar tipo de trámite ──────────────────────────────────
    tipo = await db.get(TipoTramite, data.id_tipo)
    if not tipo:
        raise HTTPException(
            status_code=404,
            detail=f"Tipo de trámite {data.id_tipo} no encontrado",
        )

    # ── 4. Crear solicitud ──────────────────────────────────────────
    numero = await _generar_numero_ingreso(db)

    solicitud = Solicitud(
        numero_ingreso=numero,
        id_solicitante=solicitante.id,
        id_predio=predio.id,
        id_tipo=data.id_tipo,
        estado_actual="Ingresado",
    )
    db.add(solicitud)
    await db.flush()  # necesitamos solicitud.id para el log

    # ── 5. Log del primer estado ────────────────────────────────────
    log_inicial = LogEstadoTramite(
        id_solicitud=solicitud.id,
        estado_anterior=None,
        estado_nuevo="Ingresado",
        id_funcionario=None,
        observaciones="Trámite ingresado al sistema",
    )
    db.add(log_inicial)

    await db.commit()
    await db.refresh(solicitud)

    return solicitud


# ═══════════════════════════════════════════════════════════════════
# 2. PUT  /api/solicitudes/{solicitud_id}/estado
# ═══════════════════════════════════════════════════════════════════
@router.put(
    "/{solicitud_id}/estado",
    response_model=SolicitudOut,
    summary="Cambiar estado de un trámite (inserta log automáticamente)",
)
async def cambiar_estado(
    solicitud_id: int,
    payload: EstadoUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Cambia el estado y **siempre** inserta un registro en
    `log_estados_tramite` con el cambio.  Esto garantiza trazabilidad
    completa del trámite.

    Validaciones:
    - El estado nuevo debe ser válido.
    - No se permite un cambio al mismo estado.
    - Se verifica que el funcionario exista (si se pasa `id_funcionario`).
    """

    # ── Validar estado permitido ────────────────────────────────────
    if payload.estado_nuevo not in ESTADOS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Estado '{payload.estado_nuevo}' no es válido. "
                f"Estados permitidos: {sorted(ESTADOS_VALIDOS)}"
            ),
        )

    # ── Buscar solicitud ────────────────────────────────────────────
    solicitud = await db.get(Solicitud, solicitud_id)
    if not solicitud:
        raise HTTPException(
            status_code=404,
            detail=f"Solicitud {solicitud_id} no encontrada",
        )

    # ── Evitar cambio al mismo estado ───────────────────────────────
    if solicitud.estado_actual == payload.estado_nuevo:
        raise HTTPException(
            status_code=400,
            detail="El trámite ya está en ese estado",
        )

    # ── Verificar funcionario (si viene) ────────────────────────────
    if payload.id_funcionario is not None:
        funcionario = await db.get(Funcionario, payload.id_funcionario)
        if not funcionario:
            raise HTTPException(
                status_code=404,
                detail=f"Funcionario {payload.id_funcionario} no encontrado",
            )

    # ── Cambiar estado ──────────────────────────────────────────────
    estado_anterior = solicitud.estado_actual
    solicitud.estado_actual = payload.estado_nuevo

    # ── Registrar en log (CRÍTICO) ──────────────────────────────────
    log = LogEstadoTramite(
        id_solicitud=solicitud.id,
        estado_anterior=estado_anterior,
        estado_nuevo=payload.estado_nuevo,
        id_funcionario=payload.id_funcionario,
        observaciones=payload.observaciones,
    )
    db.add(log)

    await db.commit()
    await db.refresh(solicitud)

    return solicitud


# ═══════════════════════════════════════════════════════════════════
# 3. GET  /api/solicitudes/bandeja
# ═══════════════════════════════════════════════════════════════════
@router.get(
    "/bandeja",
    response_model=list[SolicitudBandejaOut],
    summary="Bandeja de trámites del funcionario (filtrable)",
)
async def bandeja(
    departamento: str | None = Query(
        None, description="Dept. responsable del tipo de trámite"
    ),
    estado: str | None = Query(None, description="Estado actual del trámite"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """
    Devuelve las solicitudes con información de tipo de trámite,
    solicitante y predio.  Filtrable por departamento y/o estado.
    """

    stmt = (
        select(Solicitud, TipoTramite, Solicitante, Predio)
        .join(TipoTramite, Solicitud.id_tipo == TipoTramite.id)
        .join(Solicitante, Solicitud.id_solicitante == Solicitante.id)
        .join(Predio, Solicitud.id_predio == Predio.id)
        .order_by(Solicitud.fecha_creacion.desc())
        .offset(skip)
        .limit(limit)
    )

    if departamento:
        stmt = stmt.where(TipoTramite.depto_responsable == departamento)
    if estado:
        stmt = stmt.where(Solicitud.estado_actual == estado)

    resultado = await db.execute(stmt)
    filas = resultado.all()

    return [
        SolicitudBandejaOut(
            id=sol.id,
            numero_ingreso=sol.numero_ingreso,
            estado_actual=sol.estado_actual,
            fecha_creacion=sol.fecha_creacion,
            id_tipo=tipo.id,
            tipo_tramite=tipo.nombre,
            depto_responsable=tipo.depto_responsable,
            solicitante_rut=sol_s.rut,
            solicitante_nombres=sol_s.nombres,
            solicitante_email=sol_s.email,
            predio_rol_sii=prd.rol_sii,
            predio_direccion=prd.direccion,
        )
        for sol, tipo, sol_s, prd in filas
    ]


# ═══════════════════════════════════════════════════════════════════
# 3b. GET  /api/solicitudes/estado/{numero_ingreso}
# ═══════════════════════════════════════════════════════════════════
@router.get(
    "/estado/{numero_ingreso}",
    response_model=SolicitudBandejaOut,
    summary="Consulta pública de estado por código de seguimiento (folio)",
)
async def consultar_estado_por_folio(
    numero_ingreso: str, db: AsyncSession = Depends(get_db)
):
    """
    Permite al ciudadano consultar el estado de su trámite con el
    código serial (folio) que recibió al ingresarlo, p. ej. DOM-2026-001.
    Devuelve la misma forma que el detalle de bandeja.
    """
    stmt = (
        select(Solicitud, TipoTramite, Solicitante, Predio)
        .join(TipoTramite, Solicitud.id_tipo == TipoTramite.id)
        .join(Solicitante, Solicitud.id_solicitante == Solicitante.id)
        .join(Predio, Solicitud.id_predio == Predio.id)
        .where(Solicitud.numero_ingreso == numero_ingreso)
    )
    resultado = await db.execute(stmt)
    fila = resultado.one_or_none()

    if not fila:
        raise HTTPException(
            status_code=404,
            detail=f"No existe ningún trámite con el código {numero_ingreso}",
        )

    sol, tipo, sol_s, prd = fila
    return SolicitudBandejaOut(
        id=sol.id,
        numero_ingreso=sol.numero_ingreso,
        estado_actual=sol.estado_actual,
        fecha_creacion=sol.fecha_creacion,
        id_tipo=tipo.id,
        tipo_tramite=tipo.nombre,
        depto_responsable=tipo.depto_responsable,
        solicitante_rut=sol_s.rut,
        solicitante_nombres=sol_s.nombres,
        solicitante_email=sol_s.email,
        predio_rol_sii=prd.rol_sii,
        predio_direccion=prd.direccion,
    )


# ═══════════════════════════════════════════════════════════════════
# 4. GET  /api/solicitudes/{solicitud_id}
# ═══════════════════════════════════════════════════════════════════
@router.get(
    "/{solicitud_id}",
    response_model=SolicitudBandejaOut,
    summary="Detalle de una solicitud (con relaciónes)",
)
async def obtener_solicitud(
    solicitud_id: int, db: AsyncSession = Depends(get_db)
):
    """Devuelve una solicitud con datos de trámite, solicitante y predio."""
    stmt = (
        select(Solicitud, TipoTramite, Solicitante, Predio)
        .join(TipoTramite, Solicitud.id_tipo == TipoTramite.id)
        .join(Solicitante, Solicitud.id_solicitante == Solicitante.id)
        .join(Predio, Solicitud.id_predio == Predio.id)
        .where(Solicitud.id == solicitud_id)
    )
    resultado = await db.execute(stmt)
    fila = resultado.one_or_none()

    if not fila:
        raise HTTPException(
            status_code=404, detail=f"Solicitud {solicitud_id} no encontrada"
        )

    sol, tipo, sol_s, prd = fila
    return SolicitudBandejaOut(
        id=sol.id,
        numero_ingreso=sol.numero_ingreso,
        estado_actual=sol.estado_actual,
        fecha_creacion=sol.fecha_creacion,
        id_tipo=tipo.id,
        tipo_tramite=tipo.nombre,
        depto_responsable=tipo.depto_responsable,
        solicitante_rut=sol_s.rut,
        solicitante_nombres=sol_s.nombres,
        solicitante_email=sol_s.email,
        predio_rol_sii=prd.rol_sii,
        predio_direccion=prd.direccion,
    )


# ═══════════════════════════════════════════════════════════════════
# 5. PUT  /api/solicitudes/{solicitud_id}  (edición en intranet)
# ═══════════════════════════════════════════════════════════════════
@router.put(
    "/{solicitud_id}",
    response_model=SolicitudBandejaOut,
    summary="Editar datos de un trámite (solicitante, predio y/o tipo)",
)
async def editar_solicitud(
    solicitud_id: int,
    payload: SolicitudUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Corrige datos de un trámite desde la intranet.

    - Actualiza solo los campos que vienen en el payload.
    - Solicitante/predio siguen **get-or-create** por RUT / Rol SII:
      si el identificador nuevo ya pertenece a otro registro, se reutiliza
      (re-apunta la solicitud y sincroniza nombres/email/dirección).
    - Cambiar `id_tipo` actualiza el tipo de trámite (y su departamento).
    """

    solicitud = await db.get(Solicitud, solicitud_id)
    if not solicitud:
        raise HTTPException(
            status_code=404, detail=f"Solicitud {solicitud_id} no encontrada"
        )

    if payload.solicitante is not None:
        nuevo_sol = payload.solicitante
        existente = (
            await db.execute(
                select(Solicitante).where(Solicitante.rut == nuevo_sol.rut)
            )
        ).scalar_one_or_none()

        if existente and existente.id != solicitud.id_solicitante:
            solicitud.id_solicitante = existente.id
            existente.nombres = nuevo_sol.nombres
            existente.email = nuevo_sol.email
        else:
            solicitante = await db.get(Solicitante, solicitud.id_solicitante)
            solicitante.rut = nuevo_sol.rut
            solicitante.nombres = nuevo_sol.nombres
            solicitante.email = nuevo_sol.email

    if payload.predio is not None:
        nuevo_predio = payload.predio
        existente = (
            await db.execute(
                select(Predio).where(Predio.rol_sii == nuevo_predio.rol_sii)
            )
        ).scalar_one_or_none()

        if existente and existente.id != solicitud.id_predio:
            solicitud.id_predio = existente.id
            existente.direccion = nuevo_predio.direccion
        else:
            predio = await db.get(Predio, solicitud.id_predio)
            predio.rol_sii = nuevo_predio.rol_sii
            predio.direccion = nuevo_predio.direccion

    if payload.id_tipo is not None and payload.id_tipo != solicitud.id_tipo:
        tipo = await db.get(TipoTramite, payload.id_tipo)
        if not tipo:
            raise HTTPException(
                status_code=404,
                detail=f"Tipo de trámite {payload.id_tipo} no encontrado",
            )
        solicitud.id_tipo = payload.id_tipo

    await db.commit()

    stmt = (
        select(Solicitud, TipoTramite, Solicitante, Predio)
        .join(TipoTramite, Solicitud.id_tipo == TipoTramite.id)
        .join(Solicitante, Solicitud.id_solicitante == Solicitante.id)
        .join(Predio, Solicitud.id_predio == Predio.id)
        .where(Solicitud.id == solicitud_id)
    )
    resultado = await db.execute(stmt)
    sol, tipo, sol_s, prd = resultado.one()

    return SolicitudBandejaOut(
        id=sol.id,
        numero_ingreso=sol.numero_ingreso,
        estado_actual=sol.estado_actual,
        fecha_creacion=sol.fecha_creacion,
        id_tipo=tipo.id,
        tipo_tramite=tipo.nombre,
        depto_responsable=tipo.depto_responsable,
        solicitante_rut=sol_s.rut,
        solicitante_nombres=sol_s.nombres,
        solicitante_email=sol_s.email,
        predio_rol_sii=prd.rol_sii,
        predio_direccion=prd.direccion,
    )
