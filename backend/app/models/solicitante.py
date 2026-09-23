from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.config import Base


class Solicitante(Base):
    __tablename__ = "solicitantes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rut = Column(String(12), unique=True, nullable=False, index=True)
    nombres = Column(String(120), nullable=False)
    email = Column(String(180), nullable=False)

    # ── Relaciones ───────────────────────────────────────────────────
    solicitudes = relationship("Solicitud", back_populates="solicitante")

    def __repr__(self):
        return f"<Solicitante id={self.id} rut={self.rut}>"
