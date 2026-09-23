from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database.config import Base


class LogEstadoTramite(Base):
    __tablename__ = "log_estados_tramite"

    id = Column(Integer, primary_key=True, autoincrement=True)

    # ── Foreign Keys ─────────────────────────────────────────────────
    id_solicitud = Column(
        Integer,
        ForeignKey("solicitudes.id", ondelete="CASCADE"),
        nullable=False,
    )
    estado_anterior = Column(String(50), nullable=True)  # NULL en el primer registro
    estado_nuevo = Column(String(50), nullable=False)
    id_funcionario = Column(
        Integer,
        ForeignKey("funcionarios.id", ondelete="SET NULL"),
        nullable=True,
    )
    fecha_cambio = Column(DateTime(timezone=True), server_default=func.now())
    observaciones = Column(String(500), nullable=True)

    # ── Relaciones ───────────────────────────────────────────────────
    solicitud = relationship("Solicitud", back_populates="logs")
    funcionario = relationship("Funcionario", back_populates="logs")

    def __repr__(self):
        return f"<LogEstado id={self.id} {self.estado_anterior}→{self.estado_nuevo}>"
