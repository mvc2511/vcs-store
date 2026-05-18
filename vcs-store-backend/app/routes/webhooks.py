import stripe
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.supabase_client import supabase_admin

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])

stripe.api_key = settings.STRIPE_SECRET_KEY


@router.post("/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing stripe-signature header")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    match event.type:
        case "checkout.session.completed":
            session = event.data.object
            user_id = session.metadata.get("user_id") if session.metadata else None
            stripe_session_id = session.id
            total_cents = session.amount_total or 0

            orden = (
                supabase_admin.table("ordenes")
                .insert({
                    "user_id": user_id,
                    "stripe_session_id": stripe_session_id,
                    "total_cents": total_cents,
                    "status": "completada",
                })
                .execute()
            )

            line_items = stripe.checkout.Session.list_line_items(stripe_session_id)
            detalles = []
            for item in line_items:
                detalles.append({
                    "orden_id": orden.data[0]["id"],
                    "product_name": item.description,
                    "price_cents": item.amount_subtotal or 0,
                    "quantity": item.quantity,
                })

            supabase_admin.table("detalles_orden").insert(detalles).execute()

        case "checkout.session.expired":
            print(f"Sesión expirada: {event.data.object.id}")

    return JSONResponse(status_code=200, content={"received": True})
