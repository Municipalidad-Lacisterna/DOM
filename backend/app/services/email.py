import logging

logger = logging.getLogger(__name__)


async def enviar_correo_rechazo(email_destino: str, folio: str, motivo: str) -> None:
    """
    Servicio simulado de envío de correos.
    En producción, aquí se integra aiosmtplib, SendGrid, o AWS SES.
    """
    asunto = f"Resolución de Trámite {folio} - RECHAZADO"
    cuerpo = (
        f"Estimado/a vecino/a,\n\n"
        f"Le informamos que su trámite con folio {folio} ha sido RECHAZADO "
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
    print(f"📧 ENVIANDO CORREO A: {email_destino}")
    print(f"✉️  ASUNTO: {asunto}")
    print(f"📝 CUERPO:\n{cuerpo}")
    print("=" * 60 + "\n")

    logger.info(f"Correo de rechazo enviado a {email_destino} para el folio {folio}")
