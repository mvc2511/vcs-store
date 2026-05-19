from fastapi import APIRouter

from app.core.supabase_client import supabase_admin

router = APIRouter(prefix="/api/puntos-entrega", tags=["puntos-entrega"])


@router.get("")
async def listar_puntos_entrega():
    resp = supabase_admin.table("puntos_entrega").select("id, nombre").order("id").execute()
    return resp.data
