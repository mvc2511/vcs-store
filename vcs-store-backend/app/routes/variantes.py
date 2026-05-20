from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_admin
from app.schemas.variante import VarianteCreate, VarianteUpdate, VarianteGenerateRequest

router = APIRouter(prefix="/api/variantes", tags=["variantes"])


@router.get("/producto/{producto_id}")
async def listar_variantes(producto_id: int):
    resp = (
        supabase_admin.table("variantes_producto")
        .select("*")
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
    resp = (
        supabase_admin.table("variantes_producto")
        .insert(body.model_dump(exclude_none=True))
        .execute()
    )
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
    resp = (
        supabase_admin.table("variantes_producto")
        .update(data)
        .eq("id", variante_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Variante no encontrada")
    return resp.data[0]


@router.delete("/{variante_id}", status_code=204)
async def eliminar_variante(
    variante_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = (
        supabase_admin.table("variantes_producto")
        .delete()
        .eq("id", variante_id)
        .execute()
    )
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
            resp = (
                supabase_admin.table("variantes_producto")
                .insert(data)
                .execute()
            )
            if resp.data:
                created.append(resp.data[0])
    return created
