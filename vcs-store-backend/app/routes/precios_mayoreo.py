from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from app.core.security import verificar_admin
from app.core.supabase_client import supabase_anon, supabase_admin

router = APIRouter(prefix="/api/precios-mayoreo", tags=["precios-mayoreo"])


class PrecioMayoreoCreate(BaseModel):
    producto_id: Optional[int] = None
    categoria_id: Optional[int] = None
    cantidad_minima: int
    precio_unitario: float


class PrecioMayoreoUpdate(BaseModel):
    cantidad_minima: Optional[int] = None
    precio_unitario: Optional[float] = None


@router.get("")
async def listar_precios_mayoreo(
    producto_id: Optional[int] = Query(None),
    categoria_id: Optional[int] = Query(None),
):
    query = supabase_admin.table("precios_mayoreo").select("*").order("cantidad_minima")
    if producto_id is not None:
        query = query.eq("producto_id", producto_id)
    if categoria_id is not None:
        query = query.eq("categoria_id", categoria_id)
    resp = query.execute()
    return resp.data


@router.post("", status_code=201)
async def crear_precio_mayoreo(
    body: PrecioMayoreoCreate,
    admin: dict = Depends(verificar_admin),
):
    if (body.producto_id is None) == (body.categoria_id is None):
        raise HTTPException(
            status_code=400,
            detail="Debe especificar exactamente uno de: producto_id o categoria_id",
        )
    resp = supabase_admin.table("precios_mayoreo").insert(body.model_dump(exclude_none=True)).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear el precio mayoreo")
    return resp.data[0]


@router.put("/{precio_id}")
async def actualizar_precio_mayoreo(
    precio_id: int,
    body: PrecioMayoreoUpdate,
    admin: dict = Depends(verificar_admin),
):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    resp = supabase_admin.table("precios_mayoreo").update(data).eq("id", precio_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Precio mayoreo no encontrado")
    return resp.data[0]


@router.delete("/{precio_id}", status_code=204)
async def eliminar_precio_mayoreo(
    precio_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("precios_mayoreo").delete().eq("id", precio_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Precio mayoreo no encontrado")
