from pydantic import BaseModel
from typing import Optional

import stripe
from fastapi import APIRouter, Depends, HTTPException

from app.core.config import settings
from app.core.security import verificar_usuario_google
from app.core.supabase_client import supabase_anon, supabase_admin
from app.services.email import email_orden_creada
from app.schemas.orden import CheckoutRequest, CheckoutResponse

router = APIRouter(prefix="/api/checkout", tags=["checkout"])

stripe.api_key = settings.STRIPE_SECRET_KEY


class CODItem(BaseModel):
    producto_id: int
    cantidad: int
    variante_id: Optional[int] = None


class CODRequest(BaseModel):
    items: list[CODItem]
    punto_entrega_id: int
    telefono_contacto: str
    fecha_entrega: Optional[str] = None
    hora_entrega: Optional[str] = None


@router.post("/cod", status_code=201)
async def crear_orden_cod(
    req: CODRequest,
    usuario: dict = Depends(verificar_usuario_google),
):
    ids = [item.producto_id for item in req.items]
    resp = (
        supabase_admin.table("productos")
        .select("id, nombre, precio, stock")
        .in_("id", ids)
        .execute()
    )
    productos_bd = {p["id"]: p for p in resp.data}

    if len(productos_bd) != len(ids):
        raise HTTPException(
            status_code=400,
            detail="Uno o más productos no existen",
        )

    for item in req.items:
        prod = productos_bd[item.producto_id]
        if item.variante_id is not None:
            var_resp = (
                supabase_admin.table("variantes_producto")
                .select("stock, precio_adicional")
                .eq("id", item.variante_id)
                .single()
                .execute()
            )
            if not var_resp.data:
                raise HTTPException(status_code=400, detail=f"Variante no encontrada para '{prod['nombre']}'")
            if var_resp.data["stock"] < item.cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente para variante de '{prod['nombre']}'. Disponible: {var_resp.data['stock']}",
                )
        else:
            if prod["stock"] < item.cantidad:
                raise HTTPException(
                    status_code=400,
                    detail=f"Stock insuficiente para '{prod['nombre']}'. Disponible: {prod['stock']}",
                )

    total = 0.0
    detalles = []
    variantes_info = {}
    for item in req.items:
        prod = productos_bd[item.producto_id]
        precio_adicional = 0
        variante_text = ""
        if item.variante_id is not None:
            var_resp = (
                supabase_admin.table("variantes_producto")
                .select("precio_adicional, talla, color")
                .eq("id", item.variante_id)
                .single()
                .execute()
            )
            if var_resp.data:
                precio_adicional = var_resp.data["precio_adicional"]
                partes = []
                if var_resp.data.get("talla"):
                    partes.append(f'Talla {var_resp.data["talla"]}')
                if var_resp.data.get("color"):
                    partes.append(var_resp.data["color"])
                variante_text = " — " + " / ".join(partes)
                variantes_info[item.producto_id] = {
                    "variante_text": variante_text,
                    "talla": var_resp.data.get("talla"),
                    "color": var_resp.data.get("color"),
                }
        precio_total = prod["precio"] + precio_adicional
        subtotal = precio_total * item.cantidad
        total += subtotal
        detalle = {
            "producto_id": prod["id"],
            "cantidad": item.cantidad,
            "precio_unitario": precio_total,
        }
        if item.variante_id is not None:
            detalle["variante_id"] = item.variante_id
        detalles.append(detalle)

    orden_resp = (
        supabase_admin.table("ordenes")
        .insert({
            "user_id": usuario["user_id"],
            "user_email": usuario.get("email"),
            "total": total,
            "estado": "pendiente",
            "punto_entrega_id": req.punto_entrega_id,
            "telefono_contacto": req.telefono_contacto,
            "fecha_entrega": req.fecha_entrega,
            "hora_entrega": req.hora_entrega,
        })
        .execute()
    )

    if not orden_resp.data:
        raise HTTPException(status_code=500, detail="Error al crear la orden")

    orden_id = orden_resp.data[0]["id"]

    for item in req.items:
        if item.variante_id is not None:
            var_resp = (
                supabase_admin.table("variantes_producto")
                .select("stock")
                .eq("id", item.variante_id)
                .single()
                .execute()
            )
            if var_resp.data:
                supabase_admin.table("variantes_producto").update({
                    "stock": var_resp.data["stock"] - item.cantidad
                }).eq("id", item.variante_id).execute()
        else:
            supabase_admin.table("productos").update({
                "stock": productos_bd[item.producto_id]["stock"] - item.cantidad
            }).eq("id", item.producto_id).execute()

    for detalle in detalles:
        detalle["orden_id"] = orden_id
    supabase_admin.table("detalles_orden").insert(detalles).execute()

    punto_resp = (
        supabase_admin.table("puntos_entrega")
        .select("nombre")
        .eq("id", req.punto_entrega_id)
        .single()
        .execute()
    )
    punto_nombre = punto_resp.data["nombre"] if punto_resp.data else ""

    email_items = []
    for item, det in zip(req.items, detalles):
        prod = productos_bd[item.producto_id]
        nombre_item = prod["nombre"] + variantes_info.get(item.producto_id, {}).get("variante_text", "")
        email_items.append({
            "nombre": nombre_item,
            "cantidad": det["cantidad"],
            "subtotal": det["precio_unitario"] * det["cantidad"],
        })
    if usuario.get("email"):
        email_orden_creada(
            destinatario=usuario["email"],
            orden_id=orden_id,
            total=total,
            estado="pendiente",
            punto_entrega=punto_nombre,
            fecha_entrega=req.fecha_entrega,
            hora_entrega=req.hora_entrega,
            items=email_items,
        )

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
