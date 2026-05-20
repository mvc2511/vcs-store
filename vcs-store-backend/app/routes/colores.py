from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_anon, supabase_admin

router = APIRouter(prefix="/api/colores", tags=["colores"])


class ColorCreate(BaseModel):
    nombre: str
    hex: Optional[str] = None


class ColorUpdate(BaseModel):
    nombre: Optional[str] = None
    hex: Optional[str] = None


@router.get("")
async def listar_colores():
    resp = supabase_anon.table("colores").select("*").order("id").execute()
    return resp.data


@router.post("", status_code=201)
async def crear_color(
    body: ColorCreate,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("colores").insert(body.model_dump(exclude_none=True)).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear el color")
    return resp.data[0]


@router.put("/{color_id}")
async def actualizar_color(
    color_id: int,
    body: ColorUpdate,
    admin: dict = Depends(verificar_admin),
):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    resp = supabase_admin.table("colores").update(data).eq("id", color_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Color no encontrado")
    return resp.data[0]


@router.delete("/{color_id}", status_code=204)
async def eliminar_color(
    color_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("colores").delete().eq("id", color_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Color no encontrado")
