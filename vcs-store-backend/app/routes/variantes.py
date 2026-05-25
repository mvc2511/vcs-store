from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_admin
from app.schemas.variante import VarianteCreate, VarianteUpdate, VarianteGenerateRequest

router = APIRouter(prefix="/api/variantes", tags=["variantes"])


async def recalcular_stock_producto(producto_id: int):
    """Recalcula productos.stock como SUM de variantes_producto.stock"""
    variantes_resp = (
        supabase_admin.table("variantes_producto")
        .select("stock")
        .eq("producto_id", producto_id)
        .execute()
    )
    variantes = variantes_resp.data or []

    if variantes:
        total_stock = sum(v.get("stock", 0) for v in variantes)
    else:
        total_stock = 0

    supabase_admin.table("productos").update({
        "stock": total_stock
    }).eq("id", producto_id).execute()


def _resolver_talla_id(talla_texto: str | None) -> int | None:
    if not talla_texto:
        return None
    resp = supabase_admin.table("tallas").select("id").eq("nombre", talla_texto.strip()).execute()
    if resp and resp.data and len(resp.data) > 0:
        return resp.data[0]["id"]
    return None


def _resolver_color_id(color_texto: str | None) -> int | None:
    if not color_texto:
        return None
    resp = supabase_admin.table("colores").select("id").eq("nombre", color_texto.strip()).execute()
    if resp and resp.data and len(resp.data) > 0:
        return resp.data[0]["id"]
    return None


def _enriquecer_con_ids(data: dict) -> dict:
    if "nombre_variante" in data and data.get("talla_id") is None:
        talla_id = _resolver_talla_id(data.get("nombre_variante"))
        if talla_id:
            data["talla_id"] = talla_id
    if "color" in data and data.get("color_id") is None:
        color_id = _resolver_color_id(data.get("color"))
        if color_id:
            data["color_id"] = color_id
    return data


def _detectar_tipo_variante(producto_id: int) -> str:
    """Detecta tipo_variante basado en opciones_ml de la categoría"""
    resp = (
        supabase_admin.table("productos")
        .select("categoria_id")
        .eq("id", producto_id)
        .single()
        .execute()
    )
    if resp.data and resp.data.get("categoria_id"):
        cat_id = resp.data["categoria_id"]
        try:
            ml_resp = (
                supabase_admin.table("opciones_ml")
                .select("id")
                .eq("categoria_id", cat_id)
                .limit(1)
                .execute()
            )
            if ml_resp.data and len(ml_resp.data) > 0:
                return "volumen"
        except Exception:
            pass
    return "talla"


@router.get("/producto/{producto_id}")
async def listar_variantes(producto_id: int):
    resp = (
        supabase_admin.table("variantes_producto")
        .select("*, tallas!left(nombre, orden), colores!left(nombre, hex)")
        .eq("producto_id", producto_id)
        .order("id")
        .execute()
    )
    return resp.data


@router.post("", status_code=201)
async def crear_variante(
    body: VarianteCreate,
    admin: dict = Depends(verificar_admin),
):
    data = body.model_dump(exclude_none=True)

    # Auto-detect tipo_variante if not provided
    if "tipo_variante" not in data:
        data["tipo_variante"] = _detectar_tipo_variante(body.producto_id)

    data = _enriquecer_con_ids(data)
    resp = supabase_admin.table("variantes_producto").insert(data).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear la variante")

    # Recalculate product stock
    await recalcular_stock_producto(body.producto_id)

    return resp.data[0]


@router.put("/{variante_id}")
async def actualizar_variante(
    variante_id: int,
    body: VarianteUpdate,
    admin: dict = Depends(verificar_admin),
):
    # Get the variante to know which producto to recalculate
    variante_actual = (
        supabase_admin.table("variantes_producto")
        .select("producto_id")
        .eq("id", variante_id)
        .single()
        .execute()
    )
    if not variante_actual.data:
        raise HTTPException(status_code=404, detail="Variante no encontrada")

    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    data = _enriquecer_con_ids(data)
    resp = supabase_admin.table("variantes_producto").update(data).eq("id", variante_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Variante no encontrada")

    # Recalculate product stock
    await recalcular_stock_producto(variante_actual.data["producto_id"])

    return resp.data[0]


@router.delete("/{variante_id}", status_code=204)
async def eliminar_variante(
    variante_id: int,
    admin: dict = Depends(verificar_admin),
):
    # Get the variante to know which producto to recalculate
    variante_a_eliminar = (
        supabase_admin.table("variantes_producto")
        .select("producto_id")
        .eq("id", variante_id)
        .single()
        .execute()
    )
    if not variante_a_eliminar.data:
        raise HTTPException(status_code=404, detail="Variante no encontrada")

    resp = supabase_admin.table("variantes_producto").delete().eq("id", variante_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Variante no encontrada")

    # Recalculate product stock
    await recalcular_stock_producto(variante_a_eliminar.data["producto_id"])


@router.post("/generate", status_code=201)
async def generar_variantes(
    body: VarianteGenerateRequest,
    admin: dict = Depends(verificar_admin),
):
    created = []
    for talla in body.tallas:
        for color in body.colores:
            data = {
                "producto_id": body.producto_id,
                "nombre_variante": talla.strip(),
                "color": color.strip(),
                "stock": body.stock_default,
                "precio": body.precio_default,
            }
            # Auto-detect tipo_variante
            data["tipo_variante"] = _detectar_tipo_variante(body.producto_id)
            data = _enriquecer_con_ids(data)
            resp = supabase_admin.table("variantes_producto").insert(data).execute()
            if resp.data:
                created.append(resp.data[0])

    # Recalculate product stock once after all variants are created
    await recalcular_stock_producto(body.producto_id)

    return created
