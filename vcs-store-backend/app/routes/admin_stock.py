from fastapi import APIRouter, Depends, Query

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_admin

router = APIRouter(prefix="/api/admin/stock-bajo", tags=["admin-stock"])


@router.get("")
async def stock_bajo(
    umbral: int = Query(10, ge=1),
    admin: dict = Depends(verificar_admin),
):
    productos_resp = (
        supabase_admin.table("productos")
        .select("id, nombre, stock, imagen_url")
        .lt("stock", umbral)
        .order("stock")
        .execute()
    )
    productos = productos_resp.data or []

    variantes_resp = (
        supabase_admin.table("variantes_producto")
        .select("*, productos!left(nombre)")
        .lt("stock", umbral)
        .order("stock")
        .execute()
    )
    variantes = variantes_resp.data or []
    for v in variantes:
        v["productos_nombre"] = v.get("productos", {}).get("nombre", "") if v.get("productos") else ""
        v.pop("productos", None)

    return {
        "total_count": len(productos) + len(variantes),
        "productos": productos,
        "variantes": variantes,
    }
