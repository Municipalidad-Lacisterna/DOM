from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database.config import Base


class FaseTramite(Base):
    """Fases internas de un tipo de trámite (según los flujos reales de la DOM).

    Cada tipo de trámite tiene su propio flujo de fases (ordenadas). La fase
    representa la etapa interna del proceso documental, complementaria al
    estado genérico de la solicitud.
    """

    __tablename__ = "fases_tramite"
    __table_args__ = (
        UniqueConstraint("id_tipo", "orden", name="uq_fase_tipo_orden"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_tipo = Column(
        Integer,
        ForeignKey("tipos_tramite.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    orden = Column(Integer, nullable=False)
    nombre_fase = Column(String(120), nullable=False)
    responsable = Column(String(100), nullable=True)
    descripcion = Column(String(300), nullable=True)

    # ── Relaciones ───────────────────────────────────────────────────
    tipo_tramite = relationship("TipoTramite", back_populates="fases")

    def __repr__(self):
        return f"<FaseTramite id={self.id} tipo={self.id_tipo} orden={self.orden} nombre={self.nombre_fase}>"