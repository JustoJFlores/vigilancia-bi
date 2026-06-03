# app/api/predicciones.py  — versión completa
from fastapi import APIRouter, Query
from pydantic import BaseModel
from app.services.predicciones import (
    clustering_zonas,
    prediccion_horarios,
    prediccion_zona_siguiente,
    resumen_predicciones,
    clasificar_amenaza,
    metricas_modelos,
)

router = APIRouter(prefix="/api/predicciones", tags=["Predicciones IA"])


@router.get("/clustering-zonas")
def get_clustering():
    return {"modelo": "K-Means", "datos": clustering_zonas()}


@router.get("/horarios-riesgo")
def get_horarios():
    return {"modelo": "Estadístico", "datos": prediccion_horarios()}


@router.get("/zona-siguiente")
def get_zona_siguiente():
    return {"modelo": "Random Forest", "datos": prediccion_zona_siguiente()}


@router.get("/resumen")
def get_resumen():
    return resumen_predicciones()


@router.get("/metricas")
def get_metricas():
    return metricas_modelos()


class ClasificacionRequest(BaseModel):
    hora:         int
    dia_semana:   str
    zona_id:      int
    nivel_riesgo: int
    es_feriado:   int = 0


@router.post("/clasificacion/amenaza")
def post_clasificacion(req: ClasificacionRequest):
    return clasificar_amenaza(
        hora=req.hora,
        dia_semana=req.dia_semana,
        zona_id=req.zona_id,
        nivel_riesgo=req.nivel_riesgo,
        es_feriado=req.es_feriado,
    )