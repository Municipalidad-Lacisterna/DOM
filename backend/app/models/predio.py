from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.config import Base


class Predio(Base):
    __tablename__ = "predios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    rol_sii = Column(String(20), unique=True, nullable=False, index=True)
    direccion = Column(String(250), nullable=False)

    # ── Relaciones ───────────────────────────────────────────────────
    solicitudes = relationship("Solicitud", back_populates="predio")

    def __repr__(self):
        return f"<Predio id={self.id} rol={self.rol_sii}>"
