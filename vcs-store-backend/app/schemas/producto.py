from pydantic import BaseModel


class ProductoCreate(BaseModel):
    nombre: str
    descripcion: str
    precio: float
    stock: int
    imagen_url: str
    categoria_id: int | None = None
