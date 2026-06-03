# app/core/security.py
import hashlib
import hmac
from datetime import datetime, timedelta
import bcrypt
from jose import JWTError, jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

SECRET_KEY     = "sibvp-vigilancia-puebla-2026-clave-secreta-jwt"
ALGORITHM      = "HS256"
EXPIRE_MINUTES = 60

bearer = HTTPBearer()


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    if hashed.startswith("$2a$") or hashed.startswith("$2b$") or hashed.startswith("$2y$"):
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

    if len(hashed) == 64:
        return hmac.compare_digest(hashlib.sha256(plain.encode()).hexdigest(), hashed)

    return False


def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
) -> dict:
    return decode_token(credentials.credentials)


def require_role(*roles):
    def dependency(user: dict = Depends(get_current_user)):
        if user.get("rol") not in roles:
            raise HTTPException(
                status_code=403,
                detail="Acceso no autorizado para este rol"
            )
        return user
    return dependency