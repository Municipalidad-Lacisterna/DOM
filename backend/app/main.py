"""
DOM en Línea Municipal — FastAPI Backend
Punto de entrada de la aplicación.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, documentos, solicitudes, tipos


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Evento de startup/shutdown."""
    print("🚀 DOM en Línea Municipal — API arrancando...")
    yield
    print("🛑 API apagada.")


app = FastAPI(
    title="DOM en Línea Municipal",
    description="Sistema de Trámites Municipales — Fase 4 (MVP)",
    version="0.4.0",
    lifespan=lifespan,
)

# ── CORS (ajustar en producción) ────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ─────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(solicitudes.router)
app.include_router(documentos.router)
app.include_router(tipos.router)


# ── Healthcheck ─────────────────────────────────────────────────────
@app.get("/health", tags=["infra"])
async def health():
    return {"status": "ok", "service": "dom-municipal-api"}


@app.get("/", tags=["infra"])
async def root():
    return {
        "mensaje": "DOM en Línea Municipal — API",
        "docs": "/docs",
        "version": "0.4.0",
    }
