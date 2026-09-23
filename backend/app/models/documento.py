from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database.config import Base


class Documento(Base):
    __tablename__ = "documentos"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # ── Foreign Keys ─────────────────────────────────────────────────
    id_solicitud = Column(
        Integer,
        ForeignKey("solicitudes.id", ondelete="CASCADE"),
        nullable=False,
    )
    tipo_documento = Column(String(80), nullable=False)  # ej: "plano", "planilla", "certificado"
    ruta_archivo = Column(String(500), nullable=False)
    fecha_subida = Column(DateTime(timezone=True), server_default=func.now())

    # ── Relaciones ───────────────────────────────────────────────────
    solicitud = relationship("Solicitud", back_populates="documentos")

    def __repr__(self):
        return f"<Documento id={self.id} tipo={self.tipo_documento}>"
