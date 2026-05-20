import logging
from typing import Optional

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)


def _enviar(destinatario: str, asunto: str, html: str) -> bool:
    if not settings.RESEND_API_KEY:
        logger.warning("RESEND_API_KEY no configurada, email no enviado")
        return False
    try:
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": f"{settings.EMAIL_FROM_NAME} <{settings.EMAIL_FROM}>",
            "to": [destinatario],
            "subject": asunto,
            "html": html,
        })
        logger.info("Email enviado a %s — asunto: %s", destinatario, asunto)
        return True
    except Exception as e:
        logger.error("Error al enviar email a %s: %s", destinatario, e)
        return False


def _template_base(body: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#F5F5F2;font-family:Inter,-apple-system,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F5F2;padding:32px 16px">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">
<tr><td style="padding:24px 0;text-align:center">
<img src="https://vyro.boutique/assets/logo.svg" alt="VYRO" height="28" style="border:0;display:block;margin:0 auto">
</td></tr>
<tr><td style="background-color:#ffffff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
{body}
</td></tr>
<tr><td style="padding:24px 0;text-align:center;color:#BFC3C9;font-size:12px;line-height:18px">
VYRO Boutique &mdash; Urban Curation for Modern Lifestyle<br>
<small style="color:#BFC3C9">Este es un correo automático, por favor no respondas a este mensaje.</small>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""


def email_orden_creada(
    destinatario: str,
    orden_id: int,
    total: float,
    estado: str,
    punto_entrega: str,
    fecha_entrega: Optional[str],
    hora_entrega: Optional[str],
    items: list[dict],
) -> bool:
    items_html = "".join(
        f'<tr><td style="padding:8px 0;border-bottom:1px solid #F5F5F2;font-size:14px;color:#111111">{i["nombre"]} x{i["cantidad"]}</td>'
        f'<td style="padding:8px 0;border-bottom:1px solid #F5F5F2;font-size:14px;color:#111111;text-align:right">${i["subtotal"]:.2f}</td></tr>'
        for i in items
    )
    entrega = f"{punto_entrega}"
    if fecha_entrega:
        entrega += f" &mdash; {fecha_entrega}"
    if hora_entrega:
        entrega += f" {hora_entrega}"

    body = f"""
<h1 style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:#111111;margin:0 0 8px;letter-spacing:0.5px">¡ORDEN CONFIRMADA!</h1>
<p style="font-size:14px;color:#6B7280;margin:0 0 24px;line-height:1.6">Gracias por tu compra. Hemos recibido tu orden y la estamos procesando.</p>

<div style="background-color:#F5F5F2;border-radius:8px;padding:16px;margin-bottom:24px">
<p style="font-size:12px;color:#6B7280;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px">N&uacute;mero de Orden</p>
<p style="font-size:20px;font-weight:700;color:#C6A969;margin:0;font-family:'Space Grotesk',sans-serif">#{orden_id}</p>
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px">
{items_html}
<tr><td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#111111">Total</td>
<td style="padding:12px 0 0;font-size:16px;font-weight:700;color:#C6A969;text-align:right">${total:.2f}</td></tr>
</table>

<div style="background-color:#F5F5F2;border-radius:8px;padding:16px;margin-bottom:24px">
<p style="font-size:12px;color:#6B7280;margin:0 0 4px;text-transform:uppercase;letter-spacing:0.5px">Entrega</p>
<p style="font-size:14px;color:#111111;margin:0">{entrega}</p>
</div>

<a href="https://vyro.boutique/mis-pedidos" style="display:inline-block;background-color:#111111;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600">VER MIS PEDIDOS</a>
"""
    return _enviar(destinatario, "Orden Confirmada — VYRO Boutique", _template_base(body))


def email_estado_actualizado(
    destinatario: str,
    orden_id: int,
    estado_anterior: str,
    estado_nuevo: str,
) -> bool:
    estados = ["pendiente", "confirmado", "preparando", "enviado", "entregado"]
    progreso = ""
    for i, e in enumerate(estados):
        completado = i <= estados.index(estado_nuevo) if estado_nuevo in estados else False
        color = "#10B981" if completado else "#D1D5DB"
        barra = "" if i == 0 else f'<div style="flex:1;height:2px;background:{color};margin:0 4px"></div>'
        progreso += f"""{barra}<div style="width:24px;height:24px;border-radius:50%;background:{color};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0"><span style="color:#ffffff;font-size:11px;font-weight:700">{i+1}</span></div>"""

    body = f"""
<h1 style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:#111111;margin:0 0 8px;letter-spacing:0.5px">ESTADO ACTUALIZADO</h1>
<p style="font-size:14px;color:#6B7280;margin:0 0 24px;line-height:1.6">Tu orden <strong>#{orden_id}</strong> ha cambiado de estado.</p>

<div style="background-color:#F5F5F2;border-radius:8px;padding:16px;margin-bottom:24px;text-align:center">
<p style="font-size:12px;color:#6B7280;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px">Progreso</p>
<div style="display:flex;align-items:center;justify-content:center;gap:0">{progreso}</div>
<p style="font-size:14px;font-weight:600;color:#111111;margin:12px 0 0;text-transform:capitalize">{estado_anterior} &rarr; <span style="color:#C6A969">{estado_nuevo}</span></p>
</div>

<a href="https://vyro.boutique/mis-pedidos" style="display:inline-block;background-color:#111111;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600">VER MIS PEDIDOS</a>
"""
    return _enviar(destinatario, f"Orden #{orden_id} — {estado_nuevo}", _template_base(body))


def email_orden_cancelada(
    destinatario: str,
    orden_id: int,
) -> bool:
    body = f"""
<h1 style="font-family:'Space Grotesk',sans-serif;font-size:22px;font-weight:700;color:#111111;margin:0 0 8px;letter-spacing:0.5px">ORDEN CANCELADA</h1>
<p style="font-size:14px;color:#6B7280;margin:0 0 24px;line-height:1.6">Tu orden <strong>#{orden_id}</strong> ha sido cancelada exitosamente.</p>

<div style="background-color:#FEF2F2;border-radius:8px;padding:16px;margin-bottom:24px;border-left:3px solid #EF4444">
<p style="font-size:14px;color:#111111;margin:0;line-height:1.6">Si no solicitaste esta cancelaci&oacute;n o tienes alguna duda, por favor cont&aacute;ctanos a trav&eacute;s de WhatsApp.</p>
</div>

<a href="https://wa.me/525522988742" style="display:inline-block;background-color:#25D366;color:#ffffff;text-decoration:none;padding:12px 32px;border-radius:6px;font-size:14px;font-weight:600">CONTACTAR POR WHATSAPP</a>
<p style="margin-top:16px"><a href="https://vyro.boutique" style="color:#C6A969;font-size:14px">Seguir Comprando &rarr;</a></p>
"""
    return _enviar(destinatario, f"Orden #{orden_id} Cancelada", _template_base(body))
