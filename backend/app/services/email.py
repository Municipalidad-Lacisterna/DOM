import logging

logger = logging.getLogger(__name__)


async def enviar_correo_rechazo(email_destino: str, folio: str, motivo: str) -> None:
    """
    Servicio simulado de envío de correos.
    En producción, aquí se integra aiosmtplib, SendGrid, o AWS SES.
    """
    asunto = f"Resolución de Trámite {folio} - CANCELADO/RECHAZADO"
    cuerpo = (
        f"Estimado/a vecino/a,\n\n"
        f"Le informamos que su trámite con folio {folio} ha sido CANCELADO / RECHAZADO "
        f"en la etapa de revisión de admisibilidad.\n\n"
        f"Motivo del rechazo:\n"
        f"----------------------------------------\n"
        f"{motivo}\n"
        f"----------------------------------------\n\n"
        f"Si desea volver a intentarlo, por favor ingrese una nueva solicitud "
        f"asegurándose de cumplir con los requisitos indicados.\n\n"
        f"Atentamente,\n"
        f"Dirección de Obras Municipales\n"
        f"Ilustre Municipalidad de La Cisterna"
    )

    # Simulación de envío
    print("\n" + "=" * 60)
    print(f"[ENVIO CORREO] Destinatario: {email_destino}")
    print(f"Asunto: {asunto}")
    print(f"Cuerpo:\n{cuerpo}")
    print("=" * 60 + "\n")

    logger.info(f"Correo de rechazo enviado a {email_destino} para el folio {folio}")


async def enviar_correo_aprobacion(email_destino: str, folio: str) -> None:
    """Servicio simulado para enviar correo de aprobación exitosa."""
    asunto = f"Resolución de Trámite {folio} - APROBADO"
    cuerpo = (
        f"Estimado/a solicitante,\n\n"
        f"Le informamos que su trámite con folio {folio} ha superado "
        f"las etapas de revisión y ha sido aprobado.\n\n"
        f"Puede descargar su certificado o resolución ingresando al portal de seguimiento "
        f"con su número de folio.\n\n"
        f"Atentamente,\n"
        f"Dirección de Obras Municipales\n"
        f"Ilustre Municipalidad de La Cisterna"
    )

    print("\n" + "=" * 60)
    print(f"[ENVIO CORREO] Destinatario: {email_destino}")
    print(f"Asunto: {asunto}")
    print(f"Cuerpo:\n{cuerpo}")
    print("=" * 60 + "\n")

    logger.info(f"Correo de aprobación enviado a {email_destino} para el folio {folio}")


async def enviar_correo_derivacion(
    email_destino: str,
    nombre_funcionario: str,
    folio: str,
    tipo_tramite: str,
    fase_nombre: str,
    derivado_por: str,
    motivo: str = "",
) -> None:
    """Envía notificación por correo cuando se asigna o deriva un trámite a un funcionario."""
    asunto = f"Asignación de Expediente {folio} - {tipo_tramite}"
    cuerpo = (
        f"Estimado/a {nombre_funcionario},\n\n"
        f"Se le ha derivado/asignado el expediente con folio {folio} ({tipo_tramite}).\n\n"
        f"Etapa actual: {fase_nombre}\n"
        f"Derivado por: {derivado_por}\n"
    )
    if motivo:
        cuerpo += f"Instrucciones/Motivo: {motivo}\n\n"
    else:
        cuerpo += "\n"
    cuerpo += (
        "Por favor ingrese a la Intranet de Funcionarios para revisar los antecedentes y continuar el trámite.\n\n"
        "Dirección de Obras Municipales\n"
        "Ilustre Municipalidad de La Cisterna"
    )

    print("\n" + "=" * 60)
    print(f"[ENVIO CORREO A FUNCIONARIO] Destinatario: {email_destino}")
    print(f"Asunto: {asunto}")
    print(f"Cuerpo:\n{cuerpo}")
    print("=" * 60 + "\n")

    logger.info(f"Correo de asignación enviado a {email_destino} para el folio {folio}")
