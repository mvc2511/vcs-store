from pydantic import BaseModel

import stripe
from fastapi import APIRouter, Depends, HTTPException

from app.core.config import settings
from app.core.security import verificar_usuario_google
from app.core.supabase_client import supabase_anon, supabase_admin
from app.schemas.orden import CheckoutRequest, CheckoutResponse

router = APIRouter(prefix="/api/checkout", tags=["checkout"])

stripe.api_key = settings.STRIPE_SECRET_KEY


class CODItem(BaseModel):
    producto_id: int
    cantidad: int


class CODRequest(BaseModel):
    items: list[CODItem]


@router.post("/cod", status_code=201)
async def crear_orden_cod(
    req: CODRequest,
    usuario: dict = Depends(verificar_usuario_google),
):
    ids = [item.producto_id for item in req.items]
    resp = (
        supabase_admin.table("productos")
        .select("id, nombre, precio")
        .in_("id", ids)
        .execute()
    )
    productos_bd = {p["id"]: p for p in resp.data}

    if len(productos_bd) != len(ids):
        raise HTTPException(
            status_code=400,
            detail="Uno o más productos no existen",
        )

    total = 0.0
    detalles = []
    for item in req.items:
        prod = productos_bd[item.producto_id]
        subtotal = prod["precio"] * item.cantidad
        total += subtotal
        detalles.append({
            "producto_id": prod["id"],
            "cantidad": item.cantidad,
            "precio_unitario": prod["precio"],
        })

    orden_resp = (
        supabase_admin.table("ordenes")
        .insert({
            "user_id": usuario["user_id"],
            "total": total,
            "estado": "pendiente",
        })
        .execute()
    )

    if not orden_resp.data:
        raise HTTPException(status_code=500, detail="Error al crear la orden")

    orden_id = orden_resp.data[0]["id"]

    for detalle in detalles:
        detalle["orden_id"] = orden_id
    supabase_admin.table("detalles_orden").insert(detalles).execute()

    return {"orden_id": orden_id, "total": total, "estado": "pendiente"}


@router.post("/create-session", response_model=CheckoutResponse)
async def create_checkout_session(
    req: CheckoutRequest,
    usuario: dict = Depends(verificar_usuario_google),
):
    try:
        ids = [item.product_id for item in req.items]

        resp = (
            supabase_anon.table("productos")
            .select("id, name, price_cents, image_url")
            .in_("id", ids)
            .execute()
        )

        productos_bd = {p["id"]: p for p in resp.data}
        if len(productos_bd) != len(ids):
            raise HTTPException(
                status_code=400,
                detail="Uno o más productos no existen en la base de datos",
            )

        line_items = []
        total_real = 0

        for item in req.items:
            prod = productos_bd[item.product_id]
            unit_amount = prod["price_cents"]
            total_real += unit_amount * item.quantity

            line_items.append(
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": prod["name"],
                            "images": [prod["image_url"]] if prod.get("image_url") else [],
                        },
                        "unit_amount": unit_amount,
                    },
                    "quantity": item.quantity,
                }
            )

        session = stripe.checkout.Session.create(
            line_items=line_items,
            mode="payment",
            success_url=req.success_url,
            cancel_url=req.cancel_url,
            metadata={"user_id": usuario["user_id"]},
        )

        return CheckoutResponse(
            session_id=session.id,
            url=session.url,
            total_cents=total_real,
        )

    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))
