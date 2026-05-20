from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_admin
from app.schemas.variante import VarianteCreate, VarianteUpdate, VarianteGenerateRequest

router = APIRouter(prefix="/api/variantes", tags=["variantes"])


def _resolver_talla_id(talla_texto: str | None) -> int | None:
    if not talla_texto:
        return None
    resp = supabase_admin.table("tallas").select("id").eq("nombre", talla_texto.strip()).maybe_single().execute()
    return resp.data["id"] if resp.data else None


def _resolver_color_id(color_texto: str | None) -> int | None:
    if not color_texto:
        return None
    resp = supabase_admin.table("colores").select("id").eq("nombre", color_texto.strip()).maybe_single().execute()
    return resp.data["id"] if resp.data else None


def _enriquecer_con_ids(data: dict) -> dict:
    if "talla" in data and data.get("talla_id") is None:
        talla_id = _resolver_talla_id(data.get("talla"))
        if talla_id:
            data["talla_id"] = talla_id
    if "color" in data and data.get("color_id") is None:
        color_id = _resolver_color_id(data.get("color"))
        if color_id:
            data["color_id"] = color_id
    return data


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
    data = _enriquecer_con_ids(data)
    resp = supabase_admin.table("variantes_producto").insert(data).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear la variante")
    return resp.data[0]


@router.put("/{variante_id}")
async def actualizar_variante(
    variante_id: int,
    body: VarianteUpdate,
    admin: dict = Depends(verificar_admin),
):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    data = _enriquecer_con_ids(data)
    resp = supabase_admin.table("variantes_producto").update(data).eq("id", variante_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Variante no encontrada")
    return resp.data[0]


@router.delete("/{variante_id}", status_code=204)
async def eliminar_variante(
    variante_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("variantes_producto").delete().eq("id", variante_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Variante no encontrada")


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
                "talla": talla.strip(),
                "color": color.strip(),
                "stock": body.stock_default,
                "precio_adicional": body.precio_adicional_default,
            }
            data = _enriquecer_con_ids(data)
            resp = supabase_admin.table("variantes_producto").insert(data).execute()
            if resp.data:
                created.append(resp.data[0])
    return created
