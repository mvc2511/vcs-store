from pydantic import BaseModel


class CarritoItem(BaseModel):
    """Ítem que envía Angular — SOLO product_id y quantity, el precio lo pone el servidor"""
    product_id: str
    quantity: int


class CheckoutRequest(BaseModel):
    items: list[CarritoItem]
    success_url: str
    cancel_url: str


class CheckoutResponse(BaseModel):
    session_id: str
    url: str | None = None
    total_cents: int
