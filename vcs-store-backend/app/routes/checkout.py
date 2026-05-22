from datetime import datetime
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
    cupon_id: Optional[int] = None


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

    # Fetch wholesale prices for all items
    producto_ids = [item.producto_id for item in req.items]
    pm_resp = (
        supabase_admin.table("precios_mayoreo")
        .select("*")
        .in_("producto_id", producto_ids)
        .execute()
    )
    precios_mayoreo = pm_resp.data or []

    # Fetch categoria_id for each producto to match category-level wholesale
    cat_resp = (
        supabase_admin.table("productos")
        .select("id, categoria_id")
        .in_("id", producto_ids)
        .execute()
    )
    prod_cats = {p["id"]: p["categoria_id"] for p in (cat_resp.data or [])}
    categoria_ids = [c for c in prod_cats.values() if c is not None]
    if categoria_ids:
        pm_cat_resp = (
            supabase_admin.table("precios_mayoreo")
            .select("*")
            .in_("categoria_id", categoria_ids)
            .execute()
        )
        precios_mayoreo.extend(pm_cat_resp.data or [])

    def encontrar_mejor_precio_mayoreo(producto_id: int, categoria_id: Optional[int], cantidad: int) -> Optional[float]:
        mejor = None
        for pm in precios_mayoreo:
            if pm["producto_id"] == producto_id or (categoria_id and pm.get("categoria_id") == categoria_id):
                if cantidad >= pm["cantidad_minima"]:
                    if mejor is None or pm["precio_unitario"] < mejor:
                        mejor = pm["precio_unitario"]
        return mejor

    for item in req.items:
        prod = productos_bd[item.producto_id]
        precio_adicional = 0
        variante_text = ""
        if item.variante_id is not None:
            var_resp = (
                supabase_admin.table("variantes_producto")
                .select("precio_adicional, nombre_variante, tipo_variante, color")
                .eq("id", item.variante_id)
                .single()
                .execute()
            )
            if var_resp.data:
                precio_adicional = var_resp.data["precio_adicional"]
                partes = []
                if var_resp.data.get("nombre_variante"):
                    tipo = var_resp.data.get("tipo_variante", "talla")
                    if tipo == "volumen":
                        partes.append(var_resp.data["nombre_variante"])
                    else:
                        partes.append(f'Talla {var_resp.data["nombre_variante"]}')
                if var_resp.data.get("color"):
                    partes.append(var_resp.data["color"])
                variante_text = " — " + " / ".join(partes)
                variantes_info[item.producto_id] = {
                    "variante_text": variante_text,
                    "nombre_variante": var_resp.data.get("nombre_variante"),
                    "color": var_resp.data.get("color"),
                }

        precio_mayoreo = encontrar_mejor_precio_mayoreo(
            item.producto_id, prod_cats.get(item.producto_id), item.cantidad
        )
        if precio_mayoreo is not None:
            precio_total = precio_mayoreo
        else:
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

    descuento = 0.0
    cupon_aplicado_id = None
    if req.cupon_id is not None:
        cupon_resp = (
            supabase_admin.table("cupones")
            .select("*")
            .eq("id", req.cupon_id)
            .eq("activo", True)
            .single()
            .execute()
        )
        if cupon_resp.data:
            cupon = cupon_resp.data
            valido = True
            mensaje_error = None

            if cupon.get("fecha_expiracion"):
                try:
                    exp = datetime.fromisoformat(cupon["fecha_expiracion"].replace("Z", "+00:00"))
                    if exp < datetime.now(exp.tzinfo):
                        valido = False
                        mensaje_error = "Cupón expirado"
                except (ValueError, TypeError):
                    pass

            if valido and cupon.get("usos_maximos") is not None:
                if cupon.get("usos_actuales", 0) >= cupon["usos_maximos"]:
                    valido = False
                    mensaje_error = "Cupón agotado"

            if valido and cupon.get("minimo_compra", 0) > total:
                valido = False
                mensaje_error = "Mínimo de compra no alcanzado"

            if valido and (cupon.get("producto_id") or cupon.get("categoria_id")):
                match = False
                for item in req.items:
                    if cupon.get("producto_id") and item.producto_id == cupon["producto_id"]:
                        match = True
                        break
                    cat_id = prod_cats.get(item.producto_id)
                    if cupon.get("categoria_id") and cat_id == cupon["categoria_id"]:
                        match = True
                        break
                if not match:
                    valido = False
                    mensaje_error = "El cupón no aplica para los productos seleccionados"

            if valido:
                if cupon["tipo"] == "porcentaje":
                    descuento = round(total * cupon["valor"] / 100, 2)
                else:
                    descuento = min(cupon["valor"], total)
                cupon_aplicado_id = cupon["id"]

                supabase_admin.table("cupones").update({
                    "usos_actuales": cupon.get("usos_actuales", 0) + 1
                }).eq("id", cupon["id"]).execute()

    orden_resp = (
        supabase_admin.table("ordenes")
        .insert({
            "user_id": usuario["user_id"],
            "user_email": usuario.get("email"),
            "total": total,
            "descuento": descuento,
            "cupon_id": cupon_aplicado_id,
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
