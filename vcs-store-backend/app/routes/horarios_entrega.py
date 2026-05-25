from pydantic import BaseModel
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException

from app.core.security import verificar_admin
from app.core.supabase_client import supabase_anon, supabase_admin

router = APIRouter(prefix="/api/horarios-entrega", tags=["horarios-entrega"])


class HorarioCreate(BaseModel):
    dia_semana: int
    hora_inicio: str
    hora_fin: str
    activo: Optional[bool] = True


class HorarioUpdate(BaseModel):
    dia_semana: Optional[int] = None
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None
    activo: Optional[bool] = None


@router.get("")
async def listar_horarios():
    resp = supabase_anon.table("horarios_entrega").select("*").order("dia_semana").order("hora_inicio").execute()
    return resp.data


@router.post("", status_code=201)
async def crear_horario(
    body: HorarioCreate,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("horarios_entrega").insert(body.model_dump(exclude_none=True)).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear el horario")
    return resp.data[0]


@router.put("/{horario_id}")
async def actualizar_horario(
    horario_id: int,
    body: HorarioUpdate,
    admin: dict = Depends(verificar_admin),
):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    resp = supabase_admin.table("horarios_entrega").update(data).eq("id", horario_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
    return resp.data[0]


@router.delete("/{horario_id}", status_code=204)
async def eliminar_horario(
    horario_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("horarios_entrega").delete().eq("id", horario_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Horario no encontrado")
