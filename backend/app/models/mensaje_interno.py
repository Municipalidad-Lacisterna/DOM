from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from app.database.config import Base


class MensajeInterno(Base):
    __tablename__ = "mensajes_internos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_solicitud = Column(
        Integer, ForeignKey("solicitudes.id", ondelete="CASCADE"), nullable=False
    )
    id_funcionario = Column(
        Integer, ForeignKey("funcionarios.id", ondelete="CASCADE"), nullable=False
    )
    mensaje = Column(String(1000), nullable=False)
    fecha_creacion = Column(DateTime(timezone=True), server_default=func.now())

    solicitud = relationship("Solicitud", back_populates="mensajes_internos")
    funcionario = relationship("Funcionario")

    def __repr__(self):
        return f"<MensajeInterno {self.id} sol={self.id_solicitud}>"
