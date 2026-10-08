from app.seed import FASES_POR_TIPO, TIPOS_TRAMITE


def test_incluye_los_cinco_procesos_de_ejecucion_del_pdf() -> None:
    # Given
    esperados = {
        "Obra Municipal (SECPLAN)",
        "Reparación de Alumbrado Público",
        "Obra Eléctrica Municipal",
        "Licitación Eléctrica Municipal",
        "Denuncia SUBTEL (SOS Emergencia)",
    }

    # When
    tipos_ejecucion = {
        nombre for nombre, departamento in TIPOS_TRAMITE if departamento == "Ejecución"
    }

    # Then
    assert tipos_ejecucion == esperados


def test_separa_las_etapas_que_el_pdf_define_individualmente() -> None:
    # Given
    cantidades_esperadas = {
        "Permiso de Edificación": 8,
        "Resolución de Urbanismo": 7,
        "Fiscalización (Denuncia)": 10,
    }

    # When
    cantidades_reales = {
        nombre: len(FASES_POR_TIPO[nombre]) for nombre in cantidades_esperadas
    }

    # Then
    assert cantidades_reales == cantidades_esperadas


def test_catalogo_completo_contiene_16_tipos_y_118_fases() -> None:
    # Given / When
    total_fases = sum(len(fases) for fases in FASES_POR_TIPO.values())

    # Then
    assert len(TIPOS_TRAMITE) == 16
    assert len(FASES_POR_TIPO) == 16
    assert total_fases == 118
