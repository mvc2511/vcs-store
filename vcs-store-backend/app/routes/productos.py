from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_admin

router = APIRouter(prefix="/api/productos", tags=["productos"])


class ProductoCreate(BaseModel):
    nombre: str
    descripcion: str
    precio: float
    stock: int
    imagen_url: str
    categoria_id: Optional[int] = None


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    stock: Optional[int] = None
    imagen_url: Optional[str] = None
    categoria_id: Optional[int] = None


@router.get("")
async def listar_productos(search: Optional[str] = Query(None)):
    query = supabase_admin.table("productos").select("*, categorias(nombre)")
    if search:
        query = query.ilike("nombre", f"%{search}%")
    resp = query.order("id", desc=True).execute()
    return resp.data


@router.get("/{producto_id}")
async def obtener_producto(producto_id: int):
    resp = supabase_admin.table("productos").select("*, categorias(nombre)").eq("id", producto_id).single().execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    variantes_resp = (
        supabase_admin.table("variantes_producto")
        .select("*")
        .eq("producto_id", producto_id)
        .order("id")
        .execute()
    )
    producto = resp.data
    producto["variantes"] = variantes_resp.data or []
    return producto


@router.post("", status_code=201)
async def crear_producto(
    producto: ProductoCreate,
    admin: dict = Depends(verificar_admin),
):
    data = producto.model_dump(exclude_none=True)
    resp = supabase_admin.table("productos").insert(data).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear el producto")
    return resp.data[0]


@router.put("/{producto_id}")
async def actualizar_producto(
    producto_id: int,
    producto: ProductoUpdate,
    admin: dict = Depends(verificar_admin),
):
    data = producto.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")

    resp = supabase_admin.table("productos").update(data).eq("id", producto_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return resp.data[0]


@router.delete("/{producto_id}", status_code=204)
async def eliminar_producto(
    producto_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("productos").delete().eq("id", producto_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
