# app/api/cubos.py

from fastapi import APIRouter
from app.services.cubos import (
    cubo_zonas_riesgo,
    cubo_horarios_riesgo,
    cubo_densidad_zona,
    cubo_prediccion_proximo,
    cubo_estado_camaras,
)

router = APIRouter(prefix="/api/cubos", tags=["Cubos OLAP"])


@router.get("/zonas-riesgo")
def get_zonas_riesgo():
    return {"cubo": "Zonas con mayor riesgo", "datos": cubo_zonas_riesgo()}


@router.get("/horarios-riesgo")
def get_horarios_riesgo():
    return {"cubo": "Horarios con mayor riesgo", "datos": cubo_horarios_riesgo()}


@router.get("/densidad-zona")
def get_densidad_zona():
    return {"cubo": "Densidad de delitos por zona", "datos": cubo_densidad_zona()}


@router.get("/prediccion-proximo")
def get_prediccion_proximo():
    return {"cubo": "Predicción próximo delito", "datos": cubo_prediccion_proximo()}


@router.get("/estado-camaras")
def get_estado_camaras():
    return {"cubo": "Estado y evaluación de cámaras", "datos": cubo_estado_camaras()}