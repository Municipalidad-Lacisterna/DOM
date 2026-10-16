"""
Autenticación de funcionarios — DOM en Línea Municipal
POST /api/auth/login  → RUT + contraseña → JWT Bearer
GET  /api/auth/me     → quién soy (requiere Bearer)
"""

import jwt
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.config import get_db
from app.models import Funcionario
from app.schemas.auth import FuncionarioOut, LoginRequest, LoginResponse
from app.security import create_token, decode_token, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


def normalizar_rut(rut: str) -> str:
    """Limpia un RUT para comparar: sin puntos, sin espacios, mayúscula."""
    return rut.replace(".", "").replace(" ", "").upper()


async def _usuario_por_rut(db: AsyncSession, rut: str) -> Funcionario | None:
    resultado = await db.execute(
        select(Funcionario).where(Funcionario.rut == normalizar_rut(rut))
    )
    return resultado.scalar_one_or_none()


@router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    funcionario = await _usuario_por_rut(db, body.rut)
    if funcionario is None or not verify_password(body.password, funcionario.clave_hash):
        # Mismo mensaje para no filtrar qué credencial falló.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
        )
    return LoginResponse(
        access_token=create_token(funcionario.id),
        funcionario=FuncionarioOut.model_validate(funcionario),
    )


async def _funcionario_actual(
    authorization: str | None = Header(default=None),
    db: AsyncSession = Depends(get_db),
) -> Funcionario:
    # Sin header o sin esquema Bearer → mismo 401 que token inválido,
    # así los endpoints internos nunca revelan si el problema es el header.
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )
    token = authorization.removeprefix("Bearer ")
    try:
        payload = decode_token(token)
        funcionario_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        ) from None
    funcionario = await db.get(Funcionario, funcionario_id)
    if funcionario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
        )
    return funcionario


@router.get("/me", response_model=FuncionarioOut)
async def me(funcionario: Funcionario = Depends(_funcionario_actual)):
    return FuncionarioOut.model_validate(funcionario)


@router.get("/funcionarios", summary="Listar funcionarios para derivación")
async def listar_funcionarios(
    departamento: str | None = None,
    funcionario_auth: Funcionario = Depends(_funcionario_actual),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Funcionario).order_by(Funcionario.departamento, Funcionario.id)
    if departamento:
        stmt = stmt.where(Funcionario.departamento == departamento)
    resultado = await db.execute(stmt)
    funcs = resultado.scalars().all()
    return [
        {
            "id": f.id,
            "rut": f.rut,
            "departamento": f.departamento,
            "rol": f.rol,
            "email": f.email or f"{f.rut}@lacisterna.cl",
            "departamentos_admin": f.departamentos_admin or "",
        }
        for f in funcs
    ]


# Dependencia pública para proteger endpoints internos de otros routers
# (bandeja, cambios de estado, documentos, etc.): exige funcionario con JWT.
require_funcionario = _funcionario_actual