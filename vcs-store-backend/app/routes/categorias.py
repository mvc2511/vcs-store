from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_anon, supabase_admin

router = APIRouter(prefix="/api/categorias", tags=["categorias"])


class CategoriaCreate(BaseModel):
    nombre: str


class CategoriaUpdate(BaseModel):
    nombre: str


@router.get("")
async def listar_categorias(con_productos: Optional[bool] = Query(False)):
    if con_productos:
        prod_cats = supabase_anon.table("productos").select("categoria_id").not_.is_("categoria_id", "null").execute()
        cat_ids = list({p["categoria_id"] for p in prod_cats.data if p["categoria_id"] is not None})
        if not cat_ids:
            return []
        resp = supabase_anon.table("categorias").select("id, nombre").in_("id", cat_ids).order("id").execute()
    else:
        resp = supabase_anon.table("categorias").select("id, nombre").order("id").execute()
    return resp.data


@router.post("", status_code=201)
async def crear_categoria(
    body: CategoriaCreate,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("categorias").insert({"nombre": body.nombre}).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear la categoría")
    return resp.data[0]


@router.put("/{categoria_id}")
async def actualizar_categoria(
    categoria_id: int,
    body: CategoriaUpdate,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("categorias").update({"nombre": body.nombre}).eq("id", categoria_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return resp.data[0]


@router.delete("/{categoria_id}", status_code=204)
async def eliminar_categoria(
    categoria_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("categorias").delete().eq("id", categoria_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
