# app/services/cubos.py

import pandas as pd
from app.core.database import query_to_df


def _cargar_datos() -> pd.DataFrame:
    """
    Carga todas las tablas necesarias y las une en un solo DataFrame.
    Este es el 'universo de datos' sobre el que se construyen todos los cubos.
    """
    sql = """
        SELECT
            f.id_hecho,
            f.severidad,
            f.cantidad_eventos,
            f.detecto_ia,
            f.tiempo_respuesta_min,
            f.fue_capturado,
            f.latitud_evento,
            f.longitud_evento,
            -- Dimensión tiempo
            t.fecha,
            t.anio,
            t.mes,
            t.dia,
            t.hora,
            t.dia_semana,
            t.turno,
            t.trimestre,
            t.es_feriado,
            t.temporada,
            -- Dimensión zona
            z.id_zona,
            z.nombre_sector,
            z.colonia,
            z.municipio,
            z.latitud,
            z.longitud,
            z.nivel_riesgo,
            z.tipo_zona,
            -- Dimensión cámara
            c.id_camara,
            c.codigo_camara,
            c.modelo,
            c.estado_operativo,
            c.tiene_ia,
            c.cobertura_m2,
            -- Dimensión tipo delito
            d.id_tipo,
            d.descripcion   AS tipo_delito,
            d.categoria,
            d.nivel_violencia,
            d.requiere_arma
        FROM FACT_DELITO f
        JOIN DIM_TIEMPO      t ON f.id_tiempo = t.id_tiempo
        JOIN DIM_ZONA        z ON f.id_zona   = z.id_zona
        JOIN DIM_CAMARA      c ON f.id_camara = c.id_camara
        JOIN DIM_TIPO_DELITO d ON f.id_tipo   = d.id_tipo
    """
    return query_to_df(sql)


# ── CUBO 1 — Zonas con mayor riesgo ─────────────────────────────────────────

def cubo_zonas_riesgo() -> list:
    df = _cargar_datos()

    cubo = df.groupby(
        ["id_zona", "nombre_sector", "colonia", "nivel_riesgo",
         "latitud", "longitud", "tipo_zona"]
    ).agg(
        total_incidentes  = ("id_hecho",        "count"),
        total_eventos     = ("cantidad_eventos", "sum"),
        severidad_promedio= ("severidad",        "mean"),
        severidad_maxima  = ("severidad",        "max"),
        delitos_violentos = ("nivel_violencia",  lambda x: (x >= 3).sum()),
        capturados        = ("fue_capturado",    "sum"),
    ).reset_index()

    # Clasificación semáforo adaptativa: escala con la distribución real del cubo.
    # Con más datos, umbrales fijos pueden dejar la vista sin zonas rojas.
    p50_incidentes = cubo["total_incidentes"].quantile(0.50)
    p75_incidentes = cubo["total_incidentes"].quantile(0.75)
    p50_severidad  = cubo["severidad_promedio"].quantile(0.50)
    p75_severidad  = cubo["severidad_promedio"].quantile(0.75)

    def semaforo(row):
        if row["total_incidentes"] >= p75_incidentes and row["severidad_promedio"] >= p75_severidad:
            return "ZONA ROJA"
        elif row["total_incidentes"] >= p50_incidentes and row["severidad_promedio"] >= p50_severidad:
            return "ZONA NARANJA"
        return "ZONA AMARILLA"

    cubo["clasificacion"]      = cubo.apply(semaforo, axis=1)
    cubo["severidad_promedio"] = cubo["severidad_promedio"].round(2)

    return cubo.sort_values("total_incidentes", ascending=False).to_dict(orient="records")


# ── CUBO 2 — Horarios con mayor riesgo ──────────────────────────────────────

def cubo_horarios_riesgo() -> list:
    df = _cargar_datos()

    cubo = df.groupby(["dia_semana", "hora", "turno"]).agg(
        total_delitos     = ("id_hecho",        "count"),
        severidad_promedio= ("severidad",        "mean"),
        eventos_totales   = ("cantidad_eventos", "sum"),
        zonas_afectadas   = ("nombre_sector",    "nunique"),
    ).reset_index()

    # Probabilidad relativa por hora
    total = cubo["total_delitos"].sum()
    cubo["probabilidad_pct"] = ((cubo["total_delitos"] / total) * 100).round(2)
    cubo["severidad_promedio"] = cubo["severidad_promedio"].round(2)

    return cubo.sort_values("total_delitos", ascending=False).to_dict(orient="records")


# ── CUBO 3 — Densidad por zona y fecha ──────────────────────────────────────

def cubo_densidad_zona() -> list:
    df = _cargar_datos()

    cubo = df.groupby(
        ["nombre_sector", "latitud", "longitud", "fecha", "turno"]
    ).agg(
        incidentes        = ("id_hecho",        "count"),
        eventos           = ("cantidad_eventos", "sum"),
        calor_zona        = ("severidad",        "mean"),
        nivel_riesgo_max  = ("nivel_riesgo",     "max"),
    ).reset_index()

    def nivel_alerta(v):
        if v >= 8:   return "ALERTA ALTA"
        if v >= 5:   return "ALERTA MEDIA"
        return "NORMAL"

    cubo["calor_zona"]   = cubo["calor_zona"].round(2)
    cubo["nivel_alerta"] = cubo["calor_zona"].apply(nivel_alerta)
    cubo["fecha"]        = cubo["fecha"].astype(str)

    return cubo.sort_values(["fecha", "incidentes"], ascending=[False, False]).to_dict(orient="records")


# ── CUBO 4 — Predicción del próximo delito ───────────────────────────────────

def cubo_prediccion_proximo() -> list:
    df = _cargar_datos()

    cubo = df.groupby(
        ["dia_semana", "hora", "turno",
         "nombre_sector", "colonia", "latitud", "longitud", "tipo_delito"]
    ).agg(
        veces_ocurrido    = ("id_hecho",   "count"),
        severidad_promedio= ("severidad",  "mean"),
    ).reset_index()

    total = cubo["veces_ocurrido"].sum()
    cubo["probabilidad_pct"]   = ((cubo["veces_ocurrido"] / total) * 100).round(2)
    cubo["severidad_promedio"] = cubo["severidad_promedio"].round(2)
    cubo["ranking"]            = cubo["veces_ocurrido"].rank(
                                    method="dense", ascending=False
                                 ).astype(int)

    return cubo.sort_values("ranking").to_dict(orient="records")


# ── CUBO 5 — Estado y evaluación de cámaras ─────────────────────────────────

def cubo_estado_camaras() -> list:
    df = _cargar_datos()

    cubo = df.groupby(
        ["id_camara", "codigo_camara", "modelo", "estado_operativo",
         "tiene_ia", "cobertura_m2", "nombre_sector", "nivel_riesgo"]
    ).agg(
        incidentes_detectados = ("id_hecho",     "count"),
        detectados_por_ia     = ("detecto_ia",   "sum"),
        tiempo_resp_promedio  = ("tiempo_respuesta_min", "mean"),
        severidad_promedio    = ("severidad",    "mean"),
    ).reset_index()

    def recomendacion(row):
        if row["estado_operativo"] == "Inactiva":
            return "CRITICA — Reemplazar"
        if row["estado_operativo"] == "Mantenimiento":
            return "ATENCION — Revisar"
        if row["nivel_riesgo"] >= 4 and row["tiene_ia"] == 0:
            return "MEJORAR — Zona critica sin IA"
        return "NORMAL"

    cubo["accion_recomendada"]  = cubo.apply(recomendacion, axis=1)
    cubo["tiempo_resp_promedio"]= cubo["tiempo_resp_promedio"].round(2)
    cubo["severidad_promedio"]  = cubo["severidad_promedio"].round(2)
    cubo["detectados_por_ia"]   = cubo["detectados_por_ia"].astype(int)

    return cubo.sort_values(
        ["nivel_riesgo", "incidentes_detectados"], ascending=[False, False]
    ).to_dict(orient="records")