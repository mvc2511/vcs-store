from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_admin

router = APIRouter(prefix="/api/productos", tags=["producto_imagenes"])


class ProductoImagenCreate(BaseModel):
    url: str
    color_id: Optional[int] = None
    orden: Optional[int] = None


class ProductoImagenUpdate(BaseModel):
    color_id: Optional[int] = None
    orden: Optional[int] = None


class ReordenarImagen(BaseModel):
    id: int
    orden: int


@router.post("/{producto_id}/imagenes", status_code=201)
async def crear_imagen(
    producto_id: int,
    imagen: ProductoImagenCreate,
    admin: dict = Depends(verificar_admin),
):
    # Verify product exists
    prod = supabase_admin.table("productos").select("id").eq("id", producto_id).execute()
    if not prod.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Auto-assign order if not provided
    if imagen.orden is None:
        max_ord = (
            supabase_admin.table("producto_imagenes")
            .select("orden")
            .eq("producto_id", producto_id)
            .order("orden", desc=True)
            .limit(1)
            .execute()
        )
        next_orden = (max_ord.data[0]["orden"] + 1) if max_ord.data else 0
    else:
        next_orden = imagen.orden

    data = {"producto_id": producto_id, "url": imagen.url, "orden": next_orden}
    if imagen.color_id is not None:
        data["color_id"] = imagen.color_id

    resp = supabase_admin.table("producto_imagenes").insert(data).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear la imagen")
    return resp.data[0]


@router.put("/{producto_id}/imagenes/{imagen_id}")
async def actualizar_imagen(
    producto_id: int,
    imagen_id: int,
    imagen: ProductoImagenUpdate,
    admin: dict = Depends(verificar_admin),
):
    data = imagen.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")

    resp = (
        supabase_admin.table("producto_imagenes")
        .update(data)
        .eq("id", imagen_id)
        .eq("producto_id", producto_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")
    return resp.data[0]


@router.delete("/{producto_id}/imagenes/{imagen_id}", status_code=204)
async def eliminar_imagen(
    producto_id: int,
    imagen_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = (
        supabase_admin.table("producto_imagenes")
        .delete()
        .eq("id", imagen_id)
        .eq("producto_id", producto_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Imagen no encontrada")


@router.put("/{producto_id}/imagenes/reordenar")
async def reordenar_imagenes(
    producto_id: int,
    ordenes: list[ReordenarImagen],
    admin: dict = Depends(verificar_admin),
):
    updated = []
    for item in ordenes:
        resp = (
            supabase_admin.table("producto_imagenes")
            .update({"orden": item.orden})
            .eq("id", item.id)
            .eq("producto_id", producto_id)
            .execute()
        )
        if resp.data:
            updated.append(resp.data[0])
    return updated
