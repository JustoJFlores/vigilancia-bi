# app/api/auth.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.core.database import query_to_df
from app.core.security import hash_password, verify_password, create_token

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


DEMO_USERS = {
    "admin": {
        "id_usuario": 1,
        "username": "admin",
        "nombre": "Administrador",
        "rol": "Administrador",
        "password_hash": hash_password("admin123"),
    },
    "analista": {
        "id_usuario": 2,
        "username": "analista",
        "nombre": "Analista",
        "rol": "Analista",
        "password_hash": hash_password("analista123"),
    },
    "operador": {
        "id_usuario": 3,
        "username": "operador",
        "nombre": "Operador",
        "rol": "Operador",
        "password_hash": hash_password("operador123"),
    },
}


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def login(req: LoginRequest):
    df = query_to_df(
        f"SELECT * FROM DIM_USUARIO WHERE username='{req.username}' AND activo=1"
    )

    user = None
    if not df.empty:
        candidate = df.iloc[0]
        if verify_password(req.password, str(candidate["password_hash"])):
            user = candidate

    if user is None:
        demo_user = DEMO_USERS.get(req.username)
        if not demo_user or not verify_password(req.password, demo_user["password_hash"]):
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        user = demo_user

    token = create_token({
        "sub":        str(user["id_usuario"]),
        "username":   str(user["username"]),
        "nombre":     str(user["nombre"]),
        "rol":        str(user["rol"]),
    })

    return {
        "access_token": token,
        "token_type":   "bearer",
        "usuario": {
            "id":       int(user["id_usuario"]),
            "username": str(user["username"]),
            "nombre":   str(user["nombre"]),
            "rol":      str(user["rol"]),
        }
    }


@router.get("/me")
def get_me(user: dict = __import__('fastapi').Depends(
    __import__('app.core.security', fromlist=['get_current_user']).get_current_user
)):
    return user