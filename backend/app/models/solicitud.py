from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database.config import Base


class Solicitud(Base):
    __tablename__ = "solicitudes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    numero_ingreso = Column(String(30), unique=True, nullable=False, index=True)

    # ── Foreign Keys ─────────────────────────────────────────────────
    id_solicitante = Column(
        Integer, ForeignKey("solicitantes.id", ondelete="RESTRICT"), nullable=False
    )
    id_predio = Column(
        Integer, ForeignKey("predios.id", ondelete="RESTRICT"), nullable=False
    )
    id_tipo = Column(
        Integer, ForeignKey("tipos_tramite.id", ondelete="RESTRICT"), nullable=False
    )
    estado_actual = Column(String(50), nullable=False, default="ingresado")

    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())
    fecha_actualizacion = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ── Relaciones ───────────────────────────────────────────────────
    solicitante = relationship("Solicitante", back_populates="solicitudes")
    predio = relationship("Predio", back_populates="solicitudes")
    tipo_tramite = relationship("TipoTramite", back_populates="solicitudes")
    documentos = relationship("Documento", back_populates="solicitud", cascade="all, delete-orphan")
    logs = relationship("LogEstadoTramite", back_populates="solicitud")

    def __repr__(self):
        return f"<Solicitud id={self.id} nro={self.numero_ingreso} estado={self.estado_actual}>"
