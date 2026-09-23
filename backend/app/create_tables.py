"""
Script para crear todas las tablas definidas en los modelos.
Uso:  python -m app.create_tables
"""

from app.database.config import engine_sync, Base

# Importar todos los modelos para que Base los registre
from app.models import (
    Solicitante,
    Funcionario,
    Predio,
    TipoTramite,
    Solicitud,
    Documento,
    LogEstadoTramite,
    FaseTramite,
)


def crear_tablas():
    print("📦 Creando tablas en PostgreSQL...")
    Base.metadata.create_all(bind=engine_sync)
    print("✅ Todas las tablas creadas exitosamente.")


if __name__ == "__main__":
    crear_tablas()
