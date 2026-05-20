from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_admin
from app.services.email import email_estado_actualizado

router = APIRouter(prefix="/api/admin/ordenes", tags=["admin-ordenes"])


class EstadoUpdate(BaseModel):
    estado: str


class OrdenUpdate(BaseModel):
    fecha_entrega: Optional[str] = None
    hora_entrega: Optional[str] = None


@router.get("")
async def listar_ordenes(
    admin: dict = Depends(verificar_admin),
    estado: Optional[str] = Query(None),
):
    query = (
        supabase_admin.table("ordenes")
        .select("*, puntos_entrega!left(nombre), detalles_orden(*, productos!left(nombre))")
        .order("creado_en", desc=True)
    )
    if estado:
        query = query.eq("estado", estado)
    resp = query.execute()
    return resp.data


@router.get("/{orden_id}")
async def obtener_orden(
    orden_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = (
        supabase_admin.table("ordenes")
        .select("*, puntos_entrega!left(nombre), detalles_orden(*, productos!left(nombre))")
        .eq("id", orden_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return resp.data


@router.put("/{orden_id}/estado")
async def actualizar_estado_orden(
    orden_id: int,
    body: EstadoUpdate,
    admin: dict = Depends(verificar_admin),
):
    valid_states = {"pendiente", "confirmado", "preparando", "enviado", "entregado", "cancelado"}
    if body.estado not in valid_states:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Válidos: {', '.join(sorted(valid_states))}")

    orden_resp = (
        supabase_admin.table("ordenes")
        .select("user_email, estado")
        .eq("id", orden_id)
        .single()
        .execute()
    )
    if not orden_resp.data:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    estado_anterior = orden_resp.data["estado"]
    user_email = orden_resp.data.get("user_email", "")

    now_iso = datetime.now(timezone.utc).isoformat()
    resp = (
        supabase_admin.table("ordenes")
        .update({"estado": body.estado, "updated_at": now_iso})
        .eq("id", orden_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    if user_email:
        email_estado_actualizado(
            destinatario=user_email,
            orden_id=orden_id,
            estado_anterior=estado_anterior,
            estado_nuevo=body.estado,
        )

    return resp.data[0]


@router.put("/{orden_id}")
async def actualizar_orden(
    orden_id: int,
    body: OrdenUpdate,
    admin: dict = Depends(verificar_admin),
):
    update_data = {}
    if body.fecha_entrega is not None:
        update_data["fecha_entrega"] = body.fecha_entrega
    if body.hora_entrega is not None:
        update_data["hora_entrega"] = body.hora_entrega
    if not update_data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")

    now_iso = datetime.now(timezone.utc).isoformat()
    update_data["updated_at"] = now_iso

    resp = (
        supabase_admin.table("ordenes")
        .update(update_data)
        .eq("id", orden_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return resp.data[0]
