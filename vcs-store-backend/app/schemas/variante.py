from pydantic import BaseModel
from typing import Optional


class VarianteCreate(BaseModel):
    producto_id: int
    nombre_variante: Optional[str] = None
    tipo_variante: Optional[str] = None
    color: Optional[str] = None
    talla_id: Optional[int] = None
    color_id: Optional[int] = None
    stock: int = 0
    precio: Optional[float] = None
    imagen_url: Optional[str] = None


class VarianteUpdate(BaseModel):
    nombre_variante: Optional[str] = None
    tipo_variante: Optional[str] = None
    color: Optional[str] = None
    talla_id: Optional[int] = None
    color_id: Optional[int] = None
    stock: Optional[int] = None
    precio: Optional[float] = None
    imagen_url: Optional[str] = None


class VarianteOut(BaseModel):
    id: int
    producto_id: int
    nombre_variante: Optional[str] = None
    tipo_variante: Optional[str] = None
    color: Optional[str] = None
    talla_id: Optional[int] = None
    color_id: Optional[int] = None
    stock: int
    precio: Optional[float] = None
    imagen_url: Optional[str] = None


class VarianteGenerateRequest(BaseModel):
    producto_id: int
    tallas: list[str]
    colores: list[str]
    stock_default: int = 0
    precio_default: Optional[float] = None
