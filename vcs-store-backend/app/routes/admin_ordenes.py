from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_admin

router = APIRouter(prefix="/api/admin/ordenes", tags=["admin-ordenes"])


class EstadoUpdate(BaseModel):
    estado: str


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

    now_iso = datetime.now(timezone.utc).isoformat()
    resp = (
        supabase_admin.table("ordenes")
        .update({"estado": body.estado, "updated_at": now_iso})
        .eq("id", orden_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return resp.data[0]
