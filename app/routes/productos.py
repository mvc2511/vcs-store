from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_admin
from app.schemas.producto import ProductoCreate

router = APIRouter(prefix="/api/productos", tags=["productos"])


@router.post("", status_code=201)
async def crear_producto(
    producto: ProductoCreate,
    admin: dict = Depends(verificar_admin),
):
    data = {
        "nombre": producto.nombre,
        "descripcion": producto.descripcion,
        "precio": producto.precio,
        "stock": producto.stock,
        "imagen_url": producto.imagen_url,
    }
    if producto.categoria_id is not None:
        data["categoria_id"] = producto.categoria_id

    resp = supabase_admin.table("productos").insert(data).execute()

    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear el producto")

    return resp.data[0]
