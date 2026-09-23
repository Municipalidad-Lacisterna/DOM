"""
Seed — DOM en Línea Municipal
Siembra tipos de trámite reales (según flujos de la DOM de La Cisterna)
y funcionarios demo.  Idempotente: re-ejecutable sin duplicar datos.

Uso:  python -m app.seed
"""

from sqlalchemy import text

from app.database.config import engine_sync
from app.security import hash_password

# ═══════════════════════════════════════════════════════════════════
# CATÁLOGO DE TIPOS DE TRÁMITE
# Basado en el análisis de "2- FLUJOS DOM.pdf" (5 departamentos reales)
# ═══════════════════════════════════════════════════════════════════
# DOTECAP = Documentos Técnicos, Catastro y Atención de Público
TIPOS_TRAMITE = [
    # ── DOTECAP (p.1: flujo A certificados + catastro) ──────────────
    ("Certificado de Informaciones Previas", "DOTECAP"),
    ("Subdivisión Predial", "DOTECAP"),
    ("Certificado de Antecedentes Técnicos", "DOTECAP"),

    # ── Edificación (p.1: flujo B permiso de edificación) ───────────
    ("Permiso de Edificación", "Edificación"),
    ("Modificación de Permiso de Edificación", "Edificación"),
    ("Recepción de Obras", "Edificación"),

    # ── Urbanismo e Inspección (p.2 + p.3) ──────────────────────────
    ("Resolución de Urbanismo", "Urbanismo e Inspección"),
    ("Certificado de Urbanización (TEP)", "Urbanismo e Inspección"),
    ("Fiscalización (Denuncia)", "Urbanismo e Inspección"),
    ("Ocupación de Bien Nacional de Uso Público", "Urbanismo e Inspección"),

    # ── Ejecución (p.4: ciclo de vida de proyectos + alumbrado) ─────
    ("Obra Municipal (SECPLAN)", "Ejecución"),
    ("Reparación de Alumbrado Público", "Ejecución"),

    # ── Oficina Impuesto Territorial (p.5: Ley 17.235 / SII) ────────
    ("Solicitud Impuesto Territorial (Ley 17.235)", "Oficina Impuesto Territorial"),
]

# ═══════════════════════════════════════════════════════════════════
# FUNCIONARIOS DEMO
# ═══════════════════════════════════════════════════════════════════
# Contraseña demo para todos: "dom2026" (solo para desarrollo)
FUNCIONARIOS = [
    # (rut, departamento, rol, password)
    ("11111111-1", "DOTECAP", "ejecutor", "dom2026"),
    ("22222222-2", "DOTECAP", "visor", "dom2026"),
    ("33333333-3", "Edificación", "ejecutor", "dom2026"),
    ("44444444-4", "Urbanismo e Inspección", "ejecutor", "dom2026"),
    ("55555555-5", "Ejecución", "ejecutor", "dom2026"),
    ("66666666-6", "Oficina Impuesto Territorial", "ejecutor", "dom2026"),
    ("77777777-7", "Dirección de Obras", "admin", "dom2026"),
]

# ═══════════════════════════════════════════════════════════════════
# FASES POR TIPO DE TRÁMITE
# Traducción de "2- FLUJOS DOM.pdf" a etapas internas ordenadas.
# Formato: nombre_tipo → [(orden, nombre_fase, responsable, descripcion)]
# ═══════════════════════════════════════════════════════════════════
FASES_POR_TIPO = {
    # ── DOTECAP (p.1: flujo A — certificados) ───────────────────────
    "Certificado de Informaciones Previas": [
        (1, "Entrega de antecedentes", "Mesón", "Ciudadano entrega los antecedentes solicitados en el mesón de atención."),
        (2, "Verificación de completitud", "Mesón", "Se revisa que la documentación esté completa."),
        (3, "Control de producto", "Mesón", "Se asigna número interno y se registra el ingreso en el sistema."),
        (4, "Pago de derechos", "Ciudadano", "El ciudadano cancela los derechos municipales correspondientes."),
        (5, "Revisión técnica", "Urbanismo", "Revisión técnica del expediente (si hay observaciones, se devuelve a corrección y reingreso)."),
        (6, "Redacción de certificado", "Mesón", "El mesón redacta el certificado."),
        (7, "Visto bueno", "Urbanismo", "El área de Urbanismo otorga el visto bueno."),
        (8, "Firma del Director", "Dirección de Obras", "Firma del Director de Obras."),
        (9, "Archivo y entrega", "Mesón", "Se archiva el expediente y se entrega el certificado al ciudadano."),
    ],
    "Subdivisión Predial": [
        (1, "Entrega de antecedentes", "Mesón", "Ciudadano entrega los antecedentes solicitados en el mesón de atención."),
        (2, "Verificación de completitud", "Mesón", "Se revisa que la documentación esté completa."),
        (3, "Control de producto", "Mesón", "Se asigna número interno y se registra el ingreso en el sistema."),
        (4, "Pago de derechos", "Ciudadano", "El ciudadano cancela los derechos municipales correspondientes."),
        (5, "Revisión técnica", "Urbanismo", "Revisión técnica del expediente de subdivisión (si hay observaciones, se devuelve a corrección y reingreso)."),
        (6, "Redacción de certificado", "Mesón", "El mesón redacta el certificado."),
        (7, "Visto bueno", "Urbanismo", "El área de Urbanismo otorga el visto bueno."),
        (8, "Firma del Director", "Dirección de Obras", "Firma del Director de Obras."),
        (9, "Archivo y entrega", "Mesón", "Se archiva el expediente y se entrega el certificado al ciudadano."),
    ],
    "Certificado de Antecedentes Técnicos": [
        (1, "Entrega de antecedentes", "Mesón", "Ciudadano entrega los antecedentes solicitados en el mesón de atención."),
        (2, "Verificación de completitud", "Mesón", "Se revisa que la documentación esté completa."),
        (3, "Control de producto", "Mesón", "Se asigna número interno y se registra el ingreso en el sistema."),
        (4, "Pago de derechos", "Ciudadano", "El ciudadano cancela los derechos municipales correspondientes."),
        (5, "Revisión técnica", "Urbanismo", "Revisión técnica de los antecedentes (si hay observaciones, se devuelve a corrección y reingreso)."),
        (6, "Redacción de certificado", "Mesón", "El mesón redacta el certificado."),
        (7, "Visto bueno", "Urbanismo", "El área de Urbanismo otorga el visto bueno."),
        (8, "Firma del Director", "Dirección de Obras", "Firma del Director de Obras."),
        (9, "Archivo y entrega", "Mesón", "Se archiva el expediente y se entrega el certificado al ciudadano."),
    ],

    # ── Edificación (p.1: flujo B — permiso de edificación) ─────────
    "Permiso de Edificación": [
        (1, "Revisión de antecedentes técnicos", "Edificación", "Se revisan los antecedentes técnicos del proyecto."),
        (2, "Detección de errores", "Edificación", "Se verifica la existencia de errores en la documentación (si los hay, se emite acta de observaciones)."),
        (3, "Acta de observaciones", "Edificación", "Se notifican las observaciones al solicitante — 60 días corridos para subsanar."),
        (4, "Cálculo de derechos", "Edificación", "Se calcula el valor de los derechos municipales."),
        (5, "Pago de derechos", "Ciudadano", "El ciudadano paga los derechos correspondientes."),
        (6, "Otorgamiento del permiso", "Edificación", "Se otorga el permiso de edificación."),
        (7, "Vigencia del permiso", "Dirección de Obras", "El permiso queda vigente por 3 años."),
    ],
    "Modificación de Permiso de Edificación": [
        (1, "Revisión de antecedentes técnicos", "Edificación", "Se revisan los antecedentes técnicos de la modificación."),
        (2, "Detección de errores", "Edificación", "Se verifica la existencia de errores en la documentación (si los hay, se emite acta de observaciones)."),
        (3, "Acta de observaciones", "Edificación", "Se notifican las observaciones al solicitante — 60 días corridos para subsanar."),
        (4, "Cálculo de derechos", "Edificación", "Se calcula el valor de los derechos municipales."),
        (5, "Pago de derechos", "Ciudadano", "El ciudadano paga los derechos correspondientes."),
        (6, "Otorgamiento de la modificación", "Edificación", "Se otorga la modificación del permiso de edificación."),
        (7, "Vigencia del permiso", "Dirección de Obras", "El permiso modificado queda vigente por 3 años."),
    ],
    "Recepción de Obras": [
        (1, "Solicitud de recepción", "Ciudadano", "El ciudadano solicita la recepción de la obra terminada."),
        (2, "Revisión documental", "Edificación", "Se revisa la documentación de la obra (planos, permisos, certificados)."),
        (3, "Inspección de la obra", "Edificación", "Profesional realiza la visita inspectiva a la obra."),
        (4, "Detección de observaciones", "Edificación", "Se evalúa si la obra cumple la normativa (si hay observaciones, se notifican para corrección)."),
        (5, "Corrección de observaciones", "Ciudadano", "El ciudadano subsana las observaciones y solicita nueva inspección."),
        (6, "Constitución de garantía", "Edificación", "Se verifica la constitución de la garantía correspondiente."),
        (7, "Recepción definitiva", "Dirección de Obras", "Se emite la recepción definitiva de la obra."),
    ],

    # ── Urbanismo e Inspección (p.2 + p.3) ──────────────────────────
    "Resolución de Urbanismo": [
        (1, "Revisión de antecedentes", "Urbanismo e Inspección", "Se revisan los antecedentes presentados."),
        (2, "Detección de errores", "Urbanismo e Inspección", "Se verifica la existencia de errores (si los hay, se emite acta de observaciones)."),
        (3, "Acta de observaciones", "Urbanismo e Inspección", "Se notifican las observaciones al solicitante — 60 días corridos para subsanar."),
        (4, "Cálculo de derechos", "Urbanismo e Inspección", "Se calcula el valor de los derechos municipales."),
        (5, "Pago de derechos", "Ciudadano", "El ciudadano paga los derechos correspondientes."),
        (6, "Otorgamiento de la resolución", "Urbanismo e Inspección", "Se otorga la resolución de urbanismo."),
    ],
    "Certificado de Urbanización (TEP)": [
        (1, "Ingreso de expediente", "Urbanismo e Inspección", "Ingresa el expediente de urbanización (TEP)."),
        (2, "Revisión del expediente", "Urbanismo e Inspección", "Se revisa el expediente y sus antecedentes."),
        (3, "Observaciones", "Urbanismo e Inspección", "Se emiten observaciones al expediente si corresponde."),
        (4, "Reingreso subsanado", "Ciudadano", "El solicitante subsana las observaciones y reingresa."),
        (5, "Segunda revisión", "Urbanismo e Inspección", "Se realiza la segunda revisión del expediente."),
        (6, "Emisión del certificado", "Dirección de Obras", "Se emite el certificado de urbanización con firma del Director."),
    ],
    "Fiscalización (Denuncia)": [
        (1, "Recepción de la denuncia", "Urbanismo e Inspección", "Se recibe la denuncia del ciudadano."),
        (2, "Registro interno (folio)", "Urbanismo e Inspección", "Se registra internamente con folio y se deriva al profesional."),
        (3, "Derivación a terreno", "Urbanismo e Inspección", "Se deriva al profesional a terreno (5 a 10 días)."),
        (4, "Revisión de permisos", "Urbanismo e Inspección", "Se revisan los permisos en archivo."),
        (5, "Visita inspectiva", "Urbanismo e Inspección", "Se realiza la visita inspectiva al terreno."),
        (6, "Registro de terreno", "Urbanismo e Inspección", "Se registra el terreno con fotos, fecha y hora."),
        (7, "Aplicación de normativa", "Urbanismo e Inspección", "Se aplica la normativa (notificación para regularizar o JPL)."),
        (8, "Informe al solicitante", "Urbanismo e Inspección", "Se elabora el informe de fiscalización para el solicitante."),
        (9, "Expediente y archivo", "Urbanismo e Inspección", "Se integra el expediente y se archiva."),
    ],
    "Ocupación de Bien Nacional de Uso Público": [
        (1, "Ingreso de solicitud", "Urbanismo e Inspección", "Ingresa la solicitud de ocupación de BNUP."),
        (2, "Revisión de antecedentes", "Urbanismo e Inspección", "Se revisan los antecedentes presentados."),
        (3, "Cálculo de derechos", "Urbanismo e Inspección", "Se calcula el valor de los derechos municipales."),
        (4, "Pago y comprobante", "Ciudadano", "El ciudadano paga y presenta el comprobante."),
        (5, "Redacción y firma del Director", "Dirección de Obras", "El Director redacta y firma la resolución."),
        (6, "Entrega al solicitante", "Urbanismo e Inspección", "Se entrega la resolución al solicitante."),
    ],

    # ── Ejecución (p.4: ciclo de vida de proyectos + alumbrado) ─────
    "Obra Municipal (SECPLAN)": [
        (1, "Inicio del proyecto", "SECPLAN", "SECPLAN inicia el proceso de la obra municipal."),
        (2, "Licitación", "SECPLAN", "Publicación, adjudicación y contrato de la licitación."),
        (3, "Aprobación y designación de ITO", "Ejecución", "Se aprueba el contrato y se designa el ITO."),
        (4, "Entrega de terreno", "SECPLAN", "Se entrega el terreno al contratista."),
        (5, "Proyecto de ingeniería", "SECPLAN", "Se desarrolla el proyecto de ingeniería."),
        (6, "Inicio de obras", "Ejecución", "El contratista inicia las obras en terreno."),
        (7, "Revisión de obras", "ITO/SECPLAN", "El ITO y SECPLAN revisan el avance de las obras."),
        (8, "Cierre contable y garantía", "Administración", "Se realiza el cierre contable y se constituye la garantía."),
        (9, "Entrega de obras", "SECPLAN", "Se entregan las obras terminadas al municipio."),
    ],
    "Reparación de Alumbrado Público": [
        (1, "Solicitud del vecino", "Ciudadano", "El vecino informa la luminaria dañada."),
        (2, "Determinación de la luminaria", "DOM", "La DOM determina el tipo de luminaria dañada."),
        (3, "Despacho de Administración", "Administración", "Administración despacha la orden de reparación."),
        (4, "Ejecución por la empresa", "Empresa", "La empresa ejecuta la reparación (SECE poste metálico / SOLGELEC hormigón)."),
        (5, "Informe de la empresa", "Empresa", "La empresa informa la reparación realizada."),
        (6, "Aviso a Comunicaciones", "Comunicaciones", "Comunicaciones informa al vecino que la reparación fue realizada."),
    ],

    # ── Oficina Impuesto Territorial (p.5: Ley 17.235 / SII) ────────
    "Solicitud Impuesto Territorial (Ley 17.235)": [
        (1, "Recepción de consulta", "Oficina Impuesto Territorial", "Se recibe la consulta o solicitud del ciudadano."),
        (2, "Análisis normativo", "Oficina Impuesto Territorial", "Se analiza la solicitud bajo la Ley 17.235 y normas del SII."),
        (3, "Evaluación de admisibilidad", "Oficina Impuesto Territorial", "Se determina si la solicitud es admisible (si no, se requiere información y reingreso)."),
        (4, "Ingreso online al SII", "Oficina Impuesto Territorial", "Se ingresa la solicitud a la plataforma del SII."),
        (5, "Derivación al funcionario", "Oficina Impuesto Territorial", "Se deriva al funcionario encargado del estudio."),
        (6, "Estudio de antecedentes", "Oficina Impuesto Territorial", "Se estudian los antecedentes prediales."),
        (7, "Revisión DOM y terreno", "Oficina Impuesto Territorial", "Se revisa la información de la DOM y del terreno."),
        (8, "Oficio de respuesta", "Oficina Impuesto Territorial", "Se emite el oficio de respuesta al ciudadano."),
        (9, "Archivo y actualización predial", "Oficina Impuesto Territorial", "Se archiva el expediente y se actualiza el registro predial."),
    ],
}


def run():
    print("🌱 Sembrando datos de demo...")

    with engine_sync.begin() as conn:
        # ── Tipos de trámite (ON CONFLICT DO NOTHING por nombre) ─────
        for nombre, depto in TIPOS_TRAMITE:
            conn.execute(
                text(
                    "INSERT INTO tipos_tramite (nombre, depto_responsable) "
                    "VALUES (:nombre, :depto) "
                    "ON CONFLICT (nombre) DO NOTHING"
                ),
                {"nombre": nombre, "depto": depto},
            )
        print(f"  ✅ {len(TIPOS_TRAMITE)} tipos de trámite (idempotente)")

        # ── Funcionarios (upsert por rut: crea o actualiza) ──────────
        for rut, depto, rol, clave in FUNCIONARIOS:
            conn.execute(
                text(
                    "INSERT INTO funcionarios (rut, departamento, rol, clave_hash) "
                    "VALUES (:rut, :depto, :rol, :clave) "
                    "ON CONFLICT (rut) DO UPDATE SET "
                    "departamento = EXCLUDED.departamento, "
                    "rol = EXCLUDED.rol, "
                    "clave_hash = EXCLUDED.clave_hash"
                ),
                {"rut": rut, "depto": depto, "rol": rol, "clave": hash_password(clave)},
            )
        print(f"  ✅ {len(FUNCIONARIOS)} funcionarios con clave_hash (upsert)")

        # ── Fases por tipo de trámite (ON CONFLICT DO NOTHING por id_tipo+orden) ──
        total_fases = 0
        for nombre_tipo, fases in FASES_POR_TIPO.items():
            for orden, nombre_fase, responsable, descripcion in fases:
                conn.execute(
                    text(
                        "INSERT INTO fases_tramite "
                        "(id_tipo, orden, nombre_fase, responsable, descripcion) "
                        "SELECT id, :orden, :nombre_fase, :responsable, :descripcion "
                        "FROM tipos_tramite WHERE nombre = :nombre_tipo "
                        "ON CONFLICT (id_tipo, orden) DO NOTHING"
                    ),
                    {
                        "nombre_tipo": nombre_tipo,
                        "orden": orden,
                        "nombre_fase": nombre_fase,
                        "responsable": responsable,
                        "descripcion": descripcion,
                    },
                )
                total_fases += 1
        print(f"  ✅ {total_fases} fases para {len(FASES_POR_TIPO)} tipos (idempotente)")

    # ── Mostrar resumen ─────────────────────────────────────────────
    with engine_sync.connect() as conn:
        tipos = conn.execute(
            text(
                "SELECT id, nombre, depto_responsable "
                "FROM tipos_tramite ORDER BY depto_responsable, id"
            )
        ).fetchall()
        funcs = conn.execute(
            text(
                "SELECT id, rut, departamento, rol "
                "FROM funcionarios ORDER BY id"
            )
        ).fetchall()

    print("\n📋 TIPOS DE TRÁMITE EN BASE:")
    depto_actual = None
    for t in tipos:
        if t.depto_responsable != depto_actual:
            print(f"\n  ── {t.depto_responsable} ──")
            depto_actual = t.depto_responsable
        print(f"    [{t.id}] {t.nombre}")

    print("\n👤 FUNCIONARIOS:")
    for f in funcs:
        print(f"  [{f.id}] {f.rut} — {f.departamento} ({f.rol})")

    print("\n🪜 FASES POR TIPO (resumen):")
    with engine_sync.connect() as conn:
        fases_resumen = conn.execute(
            text(
                "SELECT t.nombre, COUNT(f.id) AS n_fases "
                "FROM tipos_tramite t "
                "LEFT JOIN fases_tramite f ON f.id_tipo = t.id "
                "GROUP BY t.id, t.nombre ORDER BY t.depto_responsable, t.id"
            )
        ).fetchall()
    for fr in fases_resumen:
        print(f"  {fr.nombre}: {fr.n_fases} fases")

    print("\n✅ Seed completado.")


if __name__ == "__main__":
    run()