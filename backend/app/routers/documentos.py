"""
Router de Documentos — DOM en Línea Municipal
Subida de PDFs a almacenamiento local (/storage) simulando AWS S3,
listado por solicitud y entrega inline para visualización en el navegador.
"""

import os
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.config import get_db
from app.models import Documento, Funcionario, Solicitud
from app.routers.auth import require_funcionario
from app.schemas.documento import DocumentoOut

router = APIRouter(prefix="/api/documentos", tags=["documentos"])

# ── "Bucket" local que simula S3 ────────────────────────────────────
STORAGE_DIR = Path(os.getenv("STORAGE_DIR", "/storage"))
STORAGE_DIR.mkdir(parents=True, exist_ok=True)

MAX_PDF_MB = 20
MAX_BYTES = MAX_PDF_MB * 1024 * 1024
TIPOS_MIME_PDF = {"application/pdf"}
CHUNK = 1024 * 1024  # 1 MB


# ═══════════════════════════════════════════════════════════════════
# 1. POST  /api/documentos/upload
# ═══════════════════════════════════════════════════════════════════
@router.post(
    "/upload",
    response_model=DocumentoOut,
    status_code=201,
    summary="Subir PDF de una solicitud (almacenamiento tipo S3)",
)
async def subir_documento(
    id_solicitud: int = Form(..., gt=0),
    tipo_documento: str = Form(..., max_length=80),
    archivo: UploadFile = File(..., description="Archivo PDF"),
    db: AsyncSession = Depends(get_db),
):
    """Guarda el PDF en /storage (simula S3) y registra la ruta en `documentos`."""

    # ── Validar solicitud ───────────────────────────────────────────
    solicitud = await db.get(Solicitud, id_solicitud)
    if not solicitud:
        raise HTTPException(
            status_code=404, detail=f"Solicitud {id_solicitud} no encontrada"
        )

    # ── Validar que sea un PDF ──────────────────────────────────────
    nombre_original = archivo.filename or ""
    if not nombre_original.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos PDF.")

    if archivo.content_type and archivo.content_type not in TIPOS_MIME_PDF:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de contenido '{archivo.content_type}' no permitido.",
        )

    # ── Guardar en /storage con nombre único (simula S3 key) ────────
    clave_s3 = f"{uuid4().hex}.pdf"
    ruta = STORAGE_DIR / clave_s3

    tamano = 0
    try:
        with ruta.open("wb") as buffer:
            # Escritura en chunks para soportar PDFs pesados sin cargar todo en RAM
            while pedazo := await archivo.read(CHUNK):
                tamano += len(pedazo)
                if tamano > MAX_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"El PDF supera el límite de {MAX_PDF_MB} MB.",
                    )
                buffer.write(pedazo)
    except HTTPException:
        ruta.unlink(missing_ok=True)
        raise

    # ── Registrar en la tabla documentos ────────────────────────────
    documento = Documento(
        id_solicitud=id_solicitud,
        tipo_documento=tipo_documento,
        ruta_archivo=str(ruta),
    )
    db.add(documento)
    await db.commit()
    await db.refresh(documento)

    return documento


# ═══════════════════════════════════════════════════════════════════
# 2. GET  /api/documentos/solicitud/{id_solicitud}
# ═══════════════════════════════════════════════════════════════════
@router.get(
    "/solicitud/{id_solicitud}",
    response_model=list[DocumentoOut],
    summary="Listar documentos de una solicitud",
)
async def listar_documentos(
    id_solicitud: int,
    funcionario_auth: Funcionario = Depends(require_funcionario),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Documento)
        .where(Documento.id_solicitud == id_solicitud)
        .order_by(Documento.fecha_subida.desc())
    )
    resultado = await db.execute(stmt)
    return resultado.scalars().all()


# ═══════════════════════════════════════════════════════════════════
# 3. GET  /api/documentos/{documento_id}/archivo
# ═══════════════════════════════════════════════════════════════════
@router.get(
    "/{documento_id}/archivo",
    summary="Entregar el PDF inline (para <iframe>/visor sin descarga)",
    responses={200: {"content": {"application/pdf": {}}}},
)
async def obtener_archivo(
    documento_id: int,
    funcionario_auth: Funcionario = Depends(require_funcionario),
    db: AsyncSession = Depends(get_db),
):
    doc = await db.get(Documento, documento_id)
    if not doc:
        raise HTTPException(
            status_code=404, detail=f"Documento {documento_id} no encontrado"
        )

    ruta = Path(doc.ruta_archivo)
    if not ruta.exists():
        raise HTTPException(
            status_code=404, detail="El archivo físico no existe en el storage"
        )

    # inline → el navegador lo renderiza (iframe/visor) sin forzar descarga
    return FileResponse(
        ruta,
        media_type="application/pdf",
        filename=ruta.name,
        content_disposition_type="inline",
    )