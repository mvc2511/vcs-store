from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from app.core.security import verificar_usuario_google
from app.core.supabase_client import supabase_admin

router = APIRouter(prefix="/api/favoritos", tags=["favoritos"])


class FavoritoAdd(BaseModel):
    producto_id: int


@router.get("")
async def listar_favoritos(
    usuario: dict = Depends(verificar_usuario_google),
):
    resp = (
        supabase_admin.table("favoritos")
        .select("*, productos!left(id, nombre, precio, imagen_url, stock, descripcion, categoria_id, visible, categorias(nombre))")
        .eq("user_id", usuario["user_id"])
        .order("created_at", desc=True)
        .execute()
    )
    items = resp.data or []
    productos = []
    for item in items:
        prod = item.get("productos")
        if prod:
            prod["has_variants"] = False
            prod["stock_real"] = prod.get("stock", 0)
            prod["categoria"] = prod.get("categorias", {}).get("nombre", "") if prod.get("categorias") else ""
            # Compute stock_real from variants
            var_resp = supabase_admin.table("variantes_producto").select("stock").eq("producto_id", prod["id"]).execute()
            variantes = var_resp.data or []
            if variantes:
                prod["has_variants"] = True
                prod["stock_real"] = sum(v.get("stock", 0) for v in variantes)
            productos.append(prod)
    return productos


@router.post("", status_code=201)
async def agregar_favorito(
    body: FavoritoAdd,
    usuario: dict = Depends(verificar_usuario_google),
):
    existing = (
        supabase_admin.table("favoritos")
        .select("id")
        .eq("user_id", usuario["user_id"])
        .eq("producto_id", body.producto_id)
        .limit(1)
        .execute()
    )
    if existing and existing.data and len(existing.data) > 0:
        return {"id": existing.data[0]["id"]}

    resp = (
        supabase_admin.table("favoritos")
        .insert({"user_id": usuario["user_id"], "producto_id": body.producto_id})
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al agregar favorito")
    return {"id": resp.data[0]["id"]}


@router.delete("/{producto_id}", status_code=204)
async def eliminar_favorito(
    producto_id: int,
    usuario: dict = Depends(verificar_usuario_google),
):
    resp = (
        supabase_admin.table("favoritos")
        .delete()
        .eq("producto_id", producto_id)
        .eq("user_id", usuario["user_id"])
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Favorito no encontrado")


@router.get("/check")
async def check_favorito(
    producto_id: int = Query(...),
    usuario: dict = Depends(verificar_usuario_google),
):
    resp = (
        supabase_admin.table("favoritos")
        .select("id")
        .eq("user_id", usuario["user_id"])
        .eq("producto_id", producto_id)
        .limit(1)
        .execute()
    )
    if resp and resp.data and len(resp.data) > 0:
        return {"favorito": True, "id": resp.data[0]["id"]}
    return {"favorito": False, "id": None}
