from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import verificar_usuario_google
from app.core.supabase_client import supabase_admin

router = APIRouter(prefix="/api/carrito", tags=["carrito"])


class CarritoAddItem(BaseModel):
    producto_id: int
    cantidad: int


class CarritoUpdateItem(BaseModel):
    cantidad: int


@router.get("")
async def listar_carrito(
    usuario: dict = Depends(verificar_usuario_google),
):
    resp = (
        supabase_admin.table("carrito")
        .select("*, productos!left(id, nombre, precio, imagen_url, stock)")
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
    producto_resp = (
        supabase_admin.table("productos")
        .select("id, stock")
        .eq("id", body.producto_id)
        .single()
        .execute()
    )
    if not producto_resp.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    existing = (
        supabase_admin.table("carrito")
        .select("id, cantidad")
        .eq("user_id", usuario["user_id"])
        .eq("producto_id", body.producto_id)
        .maybe_single()
        .execute()
    )

    if existing.data:
        nueva_cantidad = existing.data["cantidad"] + body.cantidad
        resp = (
            supabase_admin.table("carrito")
            .update({"cantidad": nueva_cantidad, "updated_at": "now()"})
            .eq("id", existing.data["id"])
            .execute()
        )
        return resp.data[0]
    else:
        resp = (
            supabase_admin.table("carrito")
            .insert({
                "user_id": usuario["user_id"],
                "producto_id": body.producto_id,
                "cantidad": body.cantidad,
            })
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
        .update({"cantidad": body.cantidad, "updated_at": "now()"})
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
