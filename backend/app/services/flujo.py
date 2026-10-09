from dataclasses import dataclass
from enum import StrEnum


class EstadoTramite(StrEnum):
    INGRESADO = "Ingresado"
    EN_REVISION = "En Revisión"
    EN_CORRECCION = "En Corrección"
    RECHAZADO = "Rechazado"
    FINALIZADO = "Finalizado"


class AccionFlujo(StrEnum):
    INICIAR = "iniciar"
    AVANZAR = "avanzar"
    OBSERVAR = "observar"
    REINGRESAR = "reingresar"
    RECHAZAR = "rechazar"


@dataclass(frozen=True, slots=True)
class ResultadoTransicion:
    estado: EstadoTramite
    fase_actual: int


class TransicionFlujoError(Exception):
    def __init__(self, estado: EstadoTramite, accion: AccionFlujo, motivo: str) -> None:
        self.estado: EstadoTramite = estado
        self.accion: AccionFlujo = accion
        self.motivo: str = motivo
        super().__init__(
            f"La acción '{accion}' no está permitida desde '{estado}': {motivo}"
        )


def resolver_transicion(
    estado: EstadoTramite,
    fase_actual: int,
    total_fases: int,
    accion: AccionFlujo,
) -> ResultadoTransicion:
    if total_fases < 1:
        raise TransicionFlujoError(estado, accion, "el tipo de trámite no tiene fases")
    if fase_actual < 1 or fase_actual > total_fases:
        raise TransicionFlujoError(
            estado, accion, "la fase actual está fuera del flujo"
        )

    match estado, accion:
        case EstadoTramite.INGRESADO, AccionFlujo.INICIAR:
            return ResultadoTransicion(EstadoTramite.EN_REVISION, fase_actual)
        case EstadoTramite.EN_REVISION, AccionFlujo.AVANZAR:
            if fase_actual == total_fases:
                return ResultadoTransicion(EstadoTramite.FINALIZADO, fase_actual)
            return ResultadoTransicion(EstadoTramite.EN_REVISION, fase_actual + 1)
        case EstadoTramite.EN_REVISION, AccionFlujo.OBSERVAR:
            return ResultadoTransicion(EstadoTramite.EN_CORRECCION, fase_actual)
        case EstadoTramite.EN_CORRECCION, AccionFlujo.REINGRESAR:
            return ResultadoTransicion(EstadoTramite.EN_REVISION, fase_actual)
        case estado, AccionFlujo.RECHAZAR if estado not in (
            EstadoTramite.FINALIZADO,
            EstadoTramite.RECHAZADO,
        ):
            return ResultadoTransicion(EstadoTramite.RECHAZADO, fase_actual)
        case _:
            raise TransicionFlujoError(
                estado, accion, "la transición no está permitida"
            )
