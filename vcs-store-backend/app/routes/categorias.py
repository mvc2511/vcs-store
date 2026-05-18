from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_anon, supabase_admin

router = APIRouter(prefix="/api/categorias", tags=["categorias"])


class CategoriaCreate(BaseModel):
    nombre: str


@router.get("")
async def listar_categorias():
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


@router.delete("/{categoria_id}", status_code=204)
async def eliminar_categoria(
    categoria_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("categorias").delete().eq("id", categoria_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
