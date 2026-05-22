from fastapi import APIRouter, Depends
from app.core.security import verificar_admin
from app.core.supabase_client import supabase_admin

router = APIRouter(prefix="/api/admin/productos", tags=["admin_productos"])


@router.get("")
async def listar_productos_admin(admin: dict = Depends(verificar_admin)):
    resp = (
        supabase_admin.table("productos")
        .select("*, categorias(nombre)")
        .order("id")
        .execute()
    )
    products = resp.data or []
    for producto in products:
        producto_id = producto.get("id")
        variantes_resp = (
            supabase_admin.table("variantes_producto")
            .select("stock")
            .eq("producto_id", producto_id)
            .execute()
        )
        variantes = variantes_resp.data or []
        producto["has_variants"] = len(variantes) > 0
        if producto["has_variants"]:
            producto["stock_real"] = sum(v.get("stock", 0) for v in variantes)
        else:
            producto["stock_real"] = producto.get("stock", 0)
    return {"data": products}
