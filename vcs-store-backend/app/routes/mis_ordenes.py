from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verificar_usuario_google
from app.core.supabase_client import supabase_admin
from app.services.email import email_orden_cancelada

router = APIRouter(prefix="/api/mis-ordenes", tags=["mis-ordenes"])


@router.get("")
async def listar_mis_ordenes(
    usuario: dict = Depends(verificar_usuario_google),
):
    resp = (
        supabase_admin.table("ordenes")
        .select("*, puntos_entrega!left(nombre), detalles_orden(*, productos!left(nombre), variantes_producto!left(talla, color))")
        .eq("user_id", usuario["user_id"])
        .order("creado_en", desc=True)
        .execute()
    )
    return resp.data


@router.put("/{orden_id}/cancelar")
async def cancelar_orden(
    orden_id: int,
    usuario: dict = Depends(verificar_usuario_google),
):
    resp = (
        supabase_admin.table("ordenes")
        .select("id, estado, user_id, user_email")
        .eq("id", orden_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    orden = resp.data
    if orden["user_id"] != usuario["user_id"]:
        raise HTTPException(status_code=403, detail="No puedes cancelar una orden que no te pertenece")

    if orden["estado"] != "pendiente":
        raise HTTPException(status_code=400, detail="Solo se pueden cancelar órdenes en estado 'pendiente'")

    now_iso = datetime.now(timezone.utc).isoformat()
    update_resp = (
        supabase_admin.table("ordenes")
        .update({"estado": "cancelado", "updated_at": now_iso})
        .eq("id", orden_id)
        .execute()
    )

    user_email = orden.get("user_email") or usuario.get("email", "")
    if user_email:
        email_orden_cancelada(
            destinatario=user_email,
            orden_id=orden_id,
        )

    return update_resp.data[0]
