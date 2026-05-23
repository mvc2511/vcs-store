from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.security import verificar_usuario_google
from app.core.supabase_client import supabase_admin

router = APIRouter(prefix="/api", tags=["resenas"])


class ResenaCreate(BaseModel):
    puntuacion: int
    comentario: Optional[str] = None
    anonima: bool = False


class ResenaUpdate(BaseModel):
    puntuacion: Optional[int] = None
    comentario: Optional[str] = None
    anonima: Optional[bool] = None


class ResenaOut(BaseModel):
    id: int
    producto_id: int
    user_id: str
    puntuacion: int
    comentario: Optional[str] = None
    anonima: bool
    created_at: str
    nombre: Optional[str] = None


@router.get("/productos/{producto_id}/resenas")
async def listar_resenas(producto_id: int):
    resp = (
        supabase_admin.table("resenas")
        .select("*")
        .eq("producto_id", producto_id)
        .order("created_at", desc=True)
        .execute()
    )
    resenas = resp.data or []
    for r in resenas:
        if r.get("anonima"):
            r["nombre"] = "Anónimo"
        else:
            perfil = (
                supabase_admin.table("perfiles")
                .select("nombre")
                .eq("id", r["user_id"])
                .limit(1)
                .execute()
            )
            r["nombre"] = perfil.data[0]["nombre"] if perfil and perfil.data else "Anónimo"
    return resenas


@router.post("/productos/{producto_id}/resenas", status_code=201)
async def crear_resena(
    producto_id: int,
    body: ResenaCreate,
    usuario: dict = Depends(verificar_usuario_google),
):
    if body.puntuacion < 1 or body.puntuacion > 5:
        raise HTTPException(status_code=400, detail="La puntuación debe estar entre 1 y 5")

    existing = (
        supabase_admin.table("resenas")
        .select("id")
        .eq("producto_id", producto_id)
        .eq("user_id", usuario["user_id"])
        .limit(1)
        .execute()
    )
    if existing.data and len(existing.data) > 0:
        raise HTTPException(status_code=400, detail="Ya has reseñado este producto")

    ordenes_resp = (
        supabase_admin.table("ordenes")
        .select("id")
        .eq("user_id", usuario["user_id"])
        .in_("estado", ["entregado", "enviado", "confirmado", "preparando"])
        .execute()
    )
    ordenes = ordenes_resp.data or []
    if not ordenes:
        raise HTTPException(status_code=403, detail="Debes comprar este producto para reseñarlo")

    orden_ids = [o["id"] for o in ordenes]
    detalles_resp = (
        supabase_admin.table("detalles_orden")
        .select("id")
        .in_("orden_id", orden_ids)
        .eq("producto_id", producto_id)
        .limit(1)
        .execute()
    )
    if not detalles_resp.data:
        raise HTTPException(status_code=403, detail="Debes comprar este producto para reseñarlo")

    resp = (
        supabase_admin.table("resenas")
        .insert({
            "producto_id": producto_id,
            "user_id": usuario["user_id"],
            "puntuacion": body.puntuacion,
            "comentario": body.comentario,
            "anonima": body.anonima,
        })
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear la reseña")
    return resp.data[0]


@router.put("/resenas/{resena_id}")
async def actualizar_resena(
    resena_id: int,
    body: ResenaUpdate,
    usuario: dict = Depends(verificar_usuario_google),
):
    resp = (
        supabase_admin.table("resenas")
        .select("id, user_id")
        .eq("id", resena_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    if resp.data["user_id"] != usuario["user_id"]:
        raise HTTPException(status_code=403, detail="No puedes editar una reseña que no te pertenece")

    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")

    if "puntuacion" in data and (data["puntuacion"] < 1 or data["puntuacion"] > 5):
        raise HTTPException(status_code=400, detail="La puntuación debe estar entre 1 y 5")

    update_resp = (
        supabase_admin.table("resenas")
        .update(data)
        .eq("id", resena_id)
        .execute()
    )
    return update_resp.data[0]


@router.delete("/resenas/{resena_id}", status_code=204)
async def eliminar_resena(
    resena_id: int,
    usuario: dict = Depends(verificar_usuario_google),
):
    resp = (
        supabase_admin.table("resenas")
        .select("id, user_id")
        .eq("id", resena_id)
        .single()
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Reseña no encontrada")
    if resp.data["user_id"] != usuario["user_id"]:
        raise HTTPException(status_code=403, detail="No puedes eliminar una reseña que no te pertenece")

    supabase_admin.table("resenas").delete().eq("id", resena_id).execute()


@router.get("/productos/{producto_id}/resenas/mi-resena")
async def mi_resena(
    producto_id: int,
    usuario: dict = Depends(verificar_usuario_google),
):
    resp = (
        supabase_admin.table("resenas")
        .select("*")
        .eq("producto_id", producto_id)
        .eq("user_id", usuario["user_id"])
        .limit(1)
        .execute()
    )
    if resp and resp.data and len(resp.data) > 0:
        return resp.data[0]
    return None


@router.get("/productos/{producto_id}/can-review")
async def puede_resenar(
    producto_id: int,
    usuario: dict = Depends(verificar_usuario_google),
):
    existing = (
        supabase_admin.table("resenas")
        .select("id")
        .eq("producto_id", producto_id)
        .eq("user_id", usuario["user_id"])
        .limit(1)
        .execute()
    )
    ya_reseno = len(existing.data or []) > 0

    ordenes = (
        supabase_admin.table("ordenes")
        .select("id")
        .eq("user_id", usuario["user_id"])
        .in_("estado", ["entregado", "enviado", "confirmado", "preparando"])
        .execute()
    )
    orden_ids = [o["id"] for o in (ordenes.data or [])]
    ha_comprado = False
    if orden_ids:
        detalles = (
            supabase_admin.table("detalles_orden")
            .select("id")
            .in_("orden_id", orden_ids)
            .eq("producto_id", producto_id)
            .limit(1)
            .execute()
        )
        ha_comprado = len(detalles.data or []) > 0

    return {"can_review": not ya_reseno and ha_comprado, "ya_reseno": ya_reseno, "ha_comprado": ha_comprado}
