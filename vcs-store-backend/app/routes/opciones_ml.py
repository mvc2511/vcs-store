from fastapi import APIRouter, Depends, HTTPException, Query

from typing import Optional

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_admin
from app.schemas.opciones_ml import OpcionMlCreate, OpcionMlUpdate

router = APIRouter(prefix="/api/opciones-ml", tags=["opciones-ml"])


@router.get("")
async def listar_opciones_ml(
    categoria_id: Optional[int] = Query(None),
):
    try:
        query = supabase_admin.table("opciones_ml").select("*, categorias!left(nombre)").order("orden")
        if categoria_id:
            query = query.eq("categoria_id", categoria_id)
        resp = query.execute()
        return resp.data
    except Exception:
        return []


@router.get("/{categoria_id}")
async def listar_opciones_ml_por_categoria(categoria_id: int):
    try:
        resp = (
            supabase_admin.table("opciones_ml")
            .select("ml, orden")
            .eq("categoria_id", categoria_id)
            .order("orden")
            .execute()
        )
        return resp.data
    except Exception:
        return []


@router.post("", status_code=201)
async def crear_opcion_ml(
    body: OpcionMlCreate,
    admin: dict = Depends(verificar_admin),
):
    data = body.model_dump()
    resp = supabase_admin.table("opciones_ml").insert(data).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear la opción de ml")
    return resp.data[0]


@router.put("/{opcion_id}")
async def actualizar_opcion_ml(
    opcion_id: int,
    body: OpcionMlUpdate,
    admin: dict = Depends(verificar_admin),
):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    resp = supabase_admin.table("opciones_ml").update(data).eq("id", opcion_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Opción de ml no encontrada")
    return resp.data[0]


@router.delete("/{opcion_id}", status_code=204)
async def eliminar_opcion_ml(
    opcion_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("opciones_ml").delete().eq("id", opcion_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Opción de ml no encontrada")
