from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_anon, supabase_admin

router = APIRouter(prefix="/api/tallas", tags=["tallas"])


class TallaCreate(BaseModel):
    nombre: str
    orden: Optional[int] = 0


class TallaUpdate(BaseModel):
    nombre: Optional[str] = None
    orden: Optional[int] = None


@router.get("")
async def listar_tallas():
    resp = supabase_anon.table("tallas").select("*").order("orden").execute()
    return resp.data


@router.post("", status_code=201)
async def crear_talla(
    body: TallaCreate,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("tallas").insert(body.model_dump(exclude_none=True)).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear la talla")
    return resp.data[0]


@router.put("/{talla_id}")
async def actualizar_talla(
    talla_id: int,
    body: TallaUpdate,
    admin: dict = Depends(verificar_admin),
):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    resp = supabase_admin.table("tallas").update(data).eq("id", talla_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Talla no encontrada")
    return resp.data[0]


@router.delete("/{talla_id}", status_code=204)
async def eliminar_talla(
    talla_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("tallas").delete().eq("id", talla_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Talla no encontrada")
