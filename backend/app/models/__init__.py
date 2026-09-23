from app.models.solicitante import Solicitante
from app.models.funcionario import Funcionario
from app.models.predio import Predio
from app.models.tipo_tramite import TipoTramite
from app.models.solicitud import Solicitud
from app.models.documento import Documento
from app.models.log_estado import LogEstadoTramite
from app.models.fase_tramite import FaseTramite

__all__ = [
    "Solicitante",
    "Funcionario",
    "Predio",
    "TipoTramite",
    "Solicitud",
    "Documento",
    "LogEstadoTramite",
    "FaseTramite",
]
