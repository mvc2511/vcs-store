from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from postgrest.exceptions import APIError

from app.core.security import verificar_usuario_google
from app.core.supabase_client import supabase_admin

router = APIRouter(prefix="/api/carrito", tags=["carrito"])


class CarritoAddItem(BaseModel):
    producto_id: int
    cantidad: int
    variante_id: int | None = None


class CarritoUpdateItem(BaseModel):
    cantidad: int


@router.get("")
async def listar_carrito(
    usuario: dict = Depends(verificar_usuario_google),
):
    resp = (
        supabase_admin.table("carrito")
        .select("*, productos!left(id, nombre, precio, imagen_url, stock), variantes_producto!left(*)")
        .eq("user_id", usuario["user_id"])
        .order("created_at")
        .execute()
    )
    return resp.data


@router.post("", status_code=201)
async def agregar_al_carrito(
    body: CarritoAddItem,
    usuario: dict = Depends(verificar_usuario_google),
):
    try:
        producto_resp = (
            supabase_admin.table("productos")
            .select("id, stock")
            .eq("id", body.producto_id)
            .single()
            .execute()
        )
    except APIError:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # NEW VALIDATION: Check if product has variants and require variante_id
    if body.variante_id is None:
        variantes_resp = (
            supabase_admin.table("variantes_producto")
            .select("id", count="exact")
            .eq("producto_id", body.producto_id)
            .execute()
        )
        has_variants = variantes_resp.count > 0 if hasattr(variantes_resp, 'count') else len(variantes_resp.data or []) > 0
        
        if has_variants:
            raise HTTPException(
                status_code=400,
                detail="Este producto tiene variantes (talla, color, ml, etc). Debe especificar una variante."
            )

    query = (
        supabase_admin.table("carrito")
        .select("id, cantidad")
        .eq("user_id", usuario["user_id"])
        .eq("producto_id", body.producto_id)
    )
    if body.variante_id is not None:
        query = query.eq("variante_id", body.variante_id)
    else:
        query = query.is_("variante_id", "null")
    existing = query.maybe_single().execute()

    if existing is not None and existing.data:
        nueva_cantidad = existing.data["cantidad"] + body.cantidad
        resp = (
            supabase_admin.table("carrito")
            .update({"cantidad": nueva_cantidad, "updated_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", existing.data["id"])
            .execute()
        )
        return resp.data[0]
    else:
        insert_data = {
            "user_id": usuario["user_id"],
            "producto_id": body.producto_id,
            "cantidad": body.cantidad,
        }
        if body.variante_id is not None:
            insert_data["variante_id"] = body.variante_id
        resp = (
            supabase_admin.table("carrito")
            .insert(insert_data)
            .execute()
        )
        if not resp.data:
            raise HTTPException(status_code=500, detail="Error al agregar al carrito")
        return resp.data[0]


@router.put("/{item_id}")
async def actualizar_cantidad(
    item_id: int,
    body: CarritoUpdateItem,
    usuario: dict = Depends(verificar_usuario_google),
):
    resp = (
        supabase_admin.table("carrito")
        .update({"cantidad": body.cantidad, "updated_at": datetime.now(timezone.utc).isoformat()})
        .eq("id", item_id)
        .eq("user_id", usuario["user_id"])
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Item no encontrado en tu carrito")
    return resp.data[0]


@router.delete("/{item_id}", status_code=204)
async def eliminar_del_carrito(
    item_id: int,
    usuario: dict = Depends(verificar_usuario_google),
):
    resp = (
        supabase_admin.table("carrito")
        .delete()
        .eq("id", item_id)
        .eq("user_id", usuario["user_id"])
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Item no encontrado en tu carrito")


@router.delete("", status_code=204)
async def vaciar_carrito(
    usuario: dict = Depends(verificar_usuario_google),
):
    supabase_admin.table("carrito").delete().eq("user_id", usuario["user_id"]).execute()
