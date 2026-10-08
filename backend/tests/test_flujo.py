import pytest

from app.services.flujo import (
    AccionFlujo,
    EstadoTramite,
    TransicionFlujoError,
    resolver_transicion,
)


def test_inicia_revision_sin_saltar_la_primera_fase() -> None:
    # Given
    estado = EstadoTramite.INGRESADO

    # When
    resultado = resolver_transicion(
        estado, fase_actual=1, total_fases=9, accion=AccionFlujo.INICIAR
    )

    # Then
    assert resultado.estado is EstadoTramite.EN_REVISION
    assert resultado.fase_actual == 1


def test_avanza_exactamente_una_fase_durante_la_revision() -> None:
    # Given
    estado = EstadoTramite.EN_REVISION

    # When
    resultado = resolver_transicion(
        estado, fase_actual=4, total_fases=9, accion=AccionFlujo.AVANZAR
    )

    # Then
    assert resultado.estado is EstadoTramite.EN_REVISION
    assert resultado.fase_actual == 5


def test_finaliza_solo_al_completar_la_ultima_fase() -> None:
    # Given
    estado = EstadoTramite.EN_REVISION

    # When
    resultado = resolver_transicion(
        estado, fase_actual=9, total_fases=9, accion=AccionFlujo.AVANZAR
    )

    # Then
    assert resultado.estado is EstadoTramite.FINALIZADO
    assert resultado.fase_actual == 9


def test_observacion_y_reingreso_conservan_la_fase_pendiente() -> None:
    # Given
    fase_pendiente = 5

    # When
    observado = resolver_transicion(
        EstadoTramite.EN_REVISION,
        fase_actual=fase_pendiente,
        total_fases=9,
        accion=AccionFlujo.OBSERVAR,
    )
    reingresado = resolver_transicion(
        observado.estado,
        fase_actual=observado.fase_actual,
        total_fases=9,
        accion=AccionFlujo.REINGRESAR,
    )

    # Then
    assert observado.estado is EstadoTramite.EN_CORRECCION
    assert reingresado.estado is EstadoTramite.EN_REVISION
    assert reingresado.fase_actual == fase_pendiente


def test_rechaza_una_accion_fuera_del_estado_permitido() -> None:
    # Given
    estado = EstadoTramite.INGRESADO

    # When / Then
    with pytest.raises(TransicionFlujoError, match="no está permitida"):
        resolver_transicion(
            estado, fase_actual=1, total_fases=9, accion=AccionFlujo.AVANZAR
        )
