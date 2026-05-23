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
    visible: Optional[bool] = True
    es_encargo: Optional[bool] = False
    dias_entrega: Optional[int] = 5


class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    precio: Optional[float] = None
    stock: Optional[int] = None
    imagen_url: Optional[str] = None
    categoria_id: Optional[int] = None
    visible: Optional[bool] = None
    es_encargo: Optional[bool] = None
    dias_entrega: Optional[int] = None


@router.get("")
async def listar_productos(
    search: Optional[str] = Query(None),
    categoria_id: Optional[int] = Query(None),
    por_encargo: Optional[bool] = Query(None),
    sort_by: Optional[str] = Query("id"),
    sort_order: Optional[str] = Query("desc"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    # Count query (without pagination)
    count_query = supabase_admin.table("productos").select("id", count="exact").eq("visible", True)
    # Data query
    data_query = supabase_admin.table("productos").select("*, categorias(nombre)").eq("visible", True)

    if search:
        count_query = count_query.ilike("nombre", f"%{search}%")
        data_query = data_query.ilike("nombre", f"%{search}%")
    if categoria_id:
        count_query = count_query.eq("categoria_id", categoria_id)
        data_query = data_query.eq("categoria_id", categoria_id)
    if por_encargo is not None:
        count_query = count_query.eq("es_encargo", por_encargo)
        data_query = data_query.eq("es_encargo", por_encargo)

    # Get total count
    count_resp = count_query.execute()
    total = count_resp.count if hasattr(count_resp, 'count') else 0

    # Validate sort
    allowed_sorts = {"id", "nombre", "precio", "stock", "creado_en"}
    if sort_by not in allowed_sorts:
        sort_by = "id"
    if sort_order not in ("asc", "desc"):
        sort_order = "desc"

    # Apply sort, limit, offset
    data_resp = (
        data_query
        .order(sort_by, desc=(sort_order == "desc"))
        .range(offset, offset + limit - 1)
        .execute()
    )

    # Enrich each product with has_variants and stock_real
    products = data_resp.data or []
    for producto in products:
        producto_id = producto.get("id")

        # Get variants for this product
        variantes_resp = (
            supabase_admin.table("variantes_producto")
            .select("stock")
            .eq("producto_id", producto_id)
            .execute()
        )
        variantes = variantes_resp.data or []

        # Compute has_variants
        producto["has_variants"] = len(variantes) > 0

        # Compute stock_real (sum of variant stocks if variants exist, else product stock)
        if producto["has_variants"]:
            producto["stock_real"] = sum(v.get("stock", 0) for v in variantes)
        else:
            producto["stock_real"] = producto.get("stock", 0)

    return {
        "data": products,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


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
    variantes = variantes_resp.data or []
    producto["variantes"] = variantes

    # Compute has_variants and stock_real
    producto["has_variants"] = len(variantes) > 0
    if producto["has_variants"]:
        producto["stock_real"] = sum(v.get("stock", 0) for v in variantes)
    else:
        producto["stock_real"] = producto.get("stock", 0)

    return producto


@router.post("", status_code=201)
async def crear_producto(
    producto: ProductoCreate,
    admin: dict = Depends(verificar_admin),
):
    data = producto.model_dump(exclude_none=True)
    if "visible" not in data:
        data["visible"] = True
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
