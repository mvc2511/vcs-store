from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.core.security import verificar_admin, verificar_usuario_google
from app.core.supabase_client import supabase_admin

router = APIRouter(prefix="/api/cupones", tags=["cupones"])


class CuponCreate(BaseModel):
    codigo: str
    tipo: str
    valor: float
    minimo_compra: float = 0
    usos_maximos: Optional[int] = None
    fecha_expiracion: Optional[str] = None
    activo: bool = True
    producto_id: Optional[int] = None
    categoria_id: Optional[int] = None


class CuponUpdate(BaseModel):
    codigo: Optional[str] = None
    tipo: Optional[str] = None
    valor: Optional[float] = None
    minimo_compra: Optional[float] = None
    usos_maximos: Optional[int] = None
    fecha_expiracion: Optional[str] = None
    activo: Optional[bool] = None
    producto_id: Optional[int] = None
    categoria_id: Optional[int] = None


class ValidarCuponRequest(BaseModel):
    codigo: str
    total: float
    items: list[dict]


@router.get("")
async def listar_cupones(admin: dict = Depends(verificar_admin)):
    resp = supabase_admin.table("cupones").select("*").order("id").execute()
    return resp.data


@router.post("", status_code=201)
async def crear_cupon(
    body: CuponCreate,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("cupones").insert(body.model_dump(exclude_none=True)).execute()
    if not resp.data:
        raise HTTPException(status_code=500, detail="Error al crear el cupón")
    return resp.data[0]


@router.put("/{cupon_id}")
async def actualizar_cupon(
    cupon_id: int,
    body: CuponUpdate,
    admin: dict = Depends(verificar_admin),
):
    data = body.model_dump(exclude_none=True)
    if not data:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar")
    resp = supabase_admin.table("cupones").update(data).eq("id", cupon_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")
    return resp.data[0]


@router.delete("/{cupon_id}", status_code=204)
async def eliminar_cupon(
    cupon_id: int,
    admin: dict = Depends(verificar_admin),
):
    resp = supabase_admin.table("cupones").delete().eq("id", cupon_id).execute()
    if not resp.data:
        raise HTTPException(status_code=404, detail="Cupón no encontrado")


@router.post("/validar")
async def validar_cupon(
    req: ValidarCuponRequest,
    usuario: dict = Depends(verificar_usuario_google),
):
    cupon_resp = (
        supabase_admin.table("cupones")
        .select("*")
        .eq("codigo", req.codigo)
        .eq("activo", True)
        .single()
        .execute()
    )
    if not cupon_resp.data:
        return {"valido": False, "mensaje": "Cupón no encontrado"}

    cupon = cupon_resp.data

    if cupon.get("fecha_expiracion"):
        try:
            exp = datetime.fromisoformat(cupon["fecha_expiracion"].replace("Z", "+00:00"))
            if exp < datetime.now(exp.tzinfo):
                return {"valido": False, "mensaje": "Cupón expirado"}
        except (ValueError, TypeError):
            pass

    usos_maximos = cupon.get("usos_maximos")
    usos_actuales = cupon.get("usos_actuales", 0)
    if usos_maximos is not None and usos_actuales >= usos_maximos:
        return {"valido": False, "mensaje": "Cupón agotado"}

    if cupon.get("minimo_compra", 0) > req.total:
        return {"valido": False, "mensaje": "Mínimo de compra no alcanzado"}

    if cupon.get("producto_id") or cupon.get("categoria_id"):
        match = False
        for item in req.items:
            if cupon.get("producto_id") and item.get("producto_id") == cupon["producto_id"]:
                match = True
                break
            if cupon.get("categoria_id") and item.get("categoria_id") == cupon["categoria_id"]:
                match = True
                break
        if not match:
            return {"valido": False, "mensaje": "El cupón no aplica para los productos seleccionados"}

    if cupon["tipo"] == "porcentaje":
        descuento = round(req.total * float(cupon["valor"]) / 100, 2)
    else:
        descuento = min(float(cupon["valor"]), req.total)

    return {
        "valido": True,
        "descuento": descuento,
        "cupon_id": cupon["id"],
        "codigo": cupon["codigo"],
        "tipo": cupon["tipo"],
        "valor": float(cupon["valor"]),
        "mensaje": "Cupón aplicado",
    }
