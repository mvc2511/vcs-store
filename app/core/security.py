import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings
from app.core.supabase_client import supabase_admin

security = HTTPBearer()


def verificar_usuario_google(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "apikey": settings.SUPABASE_ANON_KEY,
        }
        with httpx.Client() as client:
            resp = client.get(
                f"{settings.SUPABASE_URL}/auth/v1/user",
                headers=headers,
                timeout=10,
            )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido o expirado",
            )
        user_data = resp.json()
        return {"user_id": user_data["id"], "email": user_data.get("email")}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado. Acceso denegado.",
        )


def verificar_admin(
    usuario: dict = Depends(verificar_usuario_google),
) -> dict:
    user_id = usuario["user_id"]
    resp = supabase_admin.table("perfiles").select("rol").eq("id", user_id).execute()
    perfiles = resp.data
    if not perfiles or perfiles[0].get("rol") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: se requiere rol de administrador",
        )
    return usuario
