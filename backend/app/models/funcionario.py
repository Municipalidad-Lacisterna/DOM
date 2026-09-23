from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.config import Base


class Funcionario(Base):
    __tablename__ = "funcionarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rut = Column(String(12), unique=True, nullable=False, index=True)
    departamento = Column(String(100), nullable=False)
    rol = Column(String(50), nullable=False)  # ej: "admin", "ejecutor", "visor"
    clave_hash = Column(String(255), nullable=False)  # PBKDF2 + salt (ver app.security)

    # ── Relaciones ───────────────────────────────────────────────────
    logs = relationship("LogEstadoTramite", back_populates="funcionario")

    def __repr__(self):
        return f"<Funcionario id={self.id} depto={self.departamento}>"
