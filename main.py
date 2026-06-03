# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.cubos        import router as cubos_router
from app.api.predicciones import router as pred_router
from app.api.auth         import router as auth_router
from app.services.predicciones import resumen_predicciones, metricas_modelos
from datetime import datetime

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/docs",
    description="SIBVP — Sistema de Inteligencia de Negocios para Vigilancia Predictiva"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(cubos_router)
app.include_router(pred_router)


@app.on_event("startup")
def warm_prediction_caches():
    try:
        resumen_predicciones()
        metricas_modelos()
    except Exception:
        pass


@app.get("/")
def root():
    return {
        "sistema":  settings.APP_NAME,
        "version":  settings.VERSION,
        "estado":   "operativo",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/test-db")
def test_database():
    from app.core.database import query_to_df
    try:
        df = query_to_df("SELECT COUNT(*) AS total FROM FACT_DELITO")
        return {"conexion": "exitosa", "registros_fact_delito": int(df["total"][0])}
    except Exception as e:
        return {"conexion": "fallida", "error": str(e)}


@app.get("/api/estado")
def estado_sistema():
    from app.core.database import query_to_df
    try:
        df = query_to_df("""
            SELECT
                (SELECT COUNT(*) FROM FACT_DELITO)     AS total_hechos,
                (SELECT COUNT(*) FROM DIM_ZONA)        AS total_zonas,
                (SELECT COUNT(*) FROM DIM_CAMARA)      AS total_camaras,
                (SELECT COUNT(*) FROM DIM_TIPO_DELITO) AS total_tipos,
                (SELECT COUNT(*) FROM DIM_USUARIO)     AS total_usuarios
        """)
        return {
            "estado":        "operativo",
            "timestamp":     datetime.now().isoformat(),
            "base_de_datos": "conectada",
            "registros":     df.to_dict(orient="records")[0]
        }
    except Exception as e:
        return {"estado": "error", "detalle": str(e)}