from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_admin

router = APIRouter(prefix="/api/puntos-entrega", tags=["puntos-entrega"])


class PuntoEntregaCreate(BaseModel):
    nombre: str


class PuntoEntregaUpdate(BaseModel):
    nombre: str


@router.get("")
async def listar_puntos_entrega():
    resp = supabase_admin.table("puntos_entrega").select("id, nombre").order("id").execute()
    return resp.data


@router.post("", status_code=201)
async def crear_punto_entrega(
    body: PuntoEntregaCreate,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("puntos_entrega").insert({"nombre": body.nombre}).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear el punto de entrega")
    return resp.data[0]


@router.put("/{punto_id}")
async def actualizar_punto_entrega(
    punto_id: int,
    body: PuntoEntregaUpdate,
    admin: dict = Depends(verificar_admin),
):
    resp = (
        supabase_admin.table("puntos_entrega")
        .update({"nombre": body.nombre})
        .eq("id", punto_id)
        .execute()
    )
    if not resp.data:
        raise HTTPException(status_code=404, detail="Punto de entrega no encontrado")
    return resp.data[0]


@router.delete("/{punto_id}", status_code=204)
async def eliminar_punto_entrega(
    punto_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("puntos_entrega").delete().eq("id", punto_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Punto de entrega no encontrado")
