from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database.config import Base


class TipoTramite(Base):
    __tablename__ = "tipos_tramite"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(120), nullable=False, unique=True)
    depto_responsable = Column(String(100), nullable=False)

    # ── Relaciones ───────────────────────────────────────────────────
    solicitudes = relationship("Solicitud", back_populates="tipo_tramite")
    fases = relationship(
        "FaseTramite",
        back_populates="tipo_tramite",
        order_by="FaseTramite.orden",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<TipoTramite id={self.id} nombre={self.nombre}>"
