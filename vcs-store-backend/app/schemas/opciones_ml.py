from pydantic import BaseModel
from typing import Optional


class OpcionMlCreate(BaseModel):
    categoria_id: int
    ml: int
    orden: int = 0


class OpcionMlUpdate(BaseModel):
    ml: Optional[int] = None
    orden: Optional[int] = None


class OpcionMlOut(BaseModel):
    id: int
    categoria_id: int
    ml: int
    orden: int
    creado_en: Optional[str] = None
