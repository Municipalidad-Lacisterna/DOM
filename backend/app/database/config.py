"""
Database configuration — DOM en Línea Municipal
Motor async (para FastAPI) + sync (para scripts de migración).
"""

import os
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# ── URLs desde variables de entorno ──────────────────────────────────
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://dom_user:dom_pass_2026@localhost:5432/dom_municipal",
)
DATABASE_URL_SYNC = os.getenv(
    "DATABASE_URL_SYNC",
    "postgresql://dom_user:dom_pass_2026@localhost:5432/dom_municipal",
)

# ── Engine async (para la app) ──────────────────────────────────────
engine_async = create_async_engine(DATABASE_URL, echo=True, future=True)
AsyncSessionLocal = async_sessionmaker(
    engine_async, class_=AsyncSession, expire_on_commit=False
)

# ── Engine sync (para scripts de creación / migración) ──────────────
engine_sync = create_engine(DATABASE_URL_SYNC, echo=True)


# ── Base declarativa ────────────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Dependency para FastAPI ──────────────────────────────────────────
async def get_db():
    """Inyecta sesión async en los endpoints."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
