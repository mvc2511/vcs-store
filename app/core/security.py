from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError

from app.core.config import settings

security = HTTPBearer()


def verificar_usuario_google(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """
    Valida el JWT de Google/Supabase y extrae la identidad del usuario.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated",
        )

        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token inválido: No se encontró el ID de usuario",
            )

        return {"user_id": user_id, "email": payload.get("email")}

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado. Acceso denegado.",
        )
