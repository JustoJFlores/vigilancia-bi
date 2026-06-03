# app/services/predicciones.py

import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from app.core.database import query_to_df


def _cargar_datos() -> pd.DataFrame:
    sql = """
        SELECT
            f.severidad, f.cantidad_eventos, f.fue_capturado,
            t.fecha, t.hora, t.dia_semana, t.turno, t.es_feriado, t.mes,
            z.id_zona, z.nombre_sector, z.nivel_riesgo,
            z.latitud, z.longitud,
            d.categoria, d.nivel_violencia
        FROM FACT_DELITO f
        JOIN DIM_TIEMPO      t ON f.id_tiempo = t.id_tiempo
        JOIN DIM_ZONA        z ON f.id_zona   = z.id_zona
        JOIN DIM_TIPO_DELITO d ON f.id_tipo   = d.id_tipo
    """
    return query_to_df(sql)


# ── CLUSTERING K-MEANS ───────────────────────────────────────────────────────

def clustering_zonas() -> list:
    df = _cargar_datos()

    zona_df = df.groupby(
        ["id_zona", "nombre_sector", "latitud", "longitud"]
    ).agg(
        total_delitos   = ("severidad",       "count"),
        severidad_media = ("severidad",       "mean"),
        violencia_media = ("nivel_violencia", "mean"),
        hora_pico       = ("hora",            lambda x: int(x.mode()[0])),
    ).reset_index()

    features = zona_df[["total_delitos", "severidad_media", "violencia_media"]].values
    n_clusters = min(3, len(zona_df))
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    zona_df["cluster"] = kmeans.fit_predict(features)

    cluster_sev = zona_df.groupby("cluster")["severidad_media"].mean()
    orden = cluster_sev.sort_values().index.tolist()
    etiquetas_map = {
        orden[0]: "Riesgo Bajo",
        orden[1]: "Riesgo Medio" if len(orden) > 2 else "Riesgo Alto",
    }
    if len(orden) > 2:
        etiquetas_map[orden[2]] = "Riesgo Alto"

    zona_df["nivel_cluster"]    = zona_df["cluster"].map(etiquetas_map)
    zona_df["severidad_media"]  = zona_df["severidad_media"].round(2)
    zona_df["violencia_media"]  = zona_df["violencia_media"].round(2)

    return zona_df.to_dict(orient="records")


# ── PREDICCIÓN HORARIA ───────────────────────────────────────────────────────

def prediccion_horarios() -> list:
    df = _cargar_datos()

    # Normalizar fecha para contar días únicos por franja.
    df["fecha"] = pd.to_datetime(df["fecha"], errors="coerce").dt.date

    horario = df.groupby(["dia_semana", "hora", "turno"]).agg(
        total             = ("severidad",       "count"),
        severidad_media   = ("severidad",       "mean"),
        violencia_media   = ("nivel_violencia", "mean"),
        dias_con_incidente= ("fecha",           "nunique"),
    ).reset_index()

    # Peso relativo: participación de cada franja dentro del total del historial.
    total_global = horario["total"].sum()
    horario["peso_relativo_pct"] = ((horario["total"] / total_global) * 100).round(2)

    # Probabilidad real (empírica): P(ocurra >= 1 delito en esa franja | día de semana).
    # Se suaviza con Laplace para evitar 0%/100% extremos en historiales pequeños.
    dias_por_dia = (
        df[["dia_semana", "fecha"]]
        .dropna()
        .drop_duplicates()
        .groupby("dia_semana")["fecha"]
        .nunique()
        .rename("dias_observados_dia")
        .reset_index()
    )

    horario = horario.merge(dias_por_dia, on="dia_semana", how="left")
    horario["dias_observados_dia"] = horario["dias_observados_dia"].fillna(0)

    horario["probabilidad_real_pct"] = (
        ((horario["dias_con_incidente"] + 1) / (horario["dias_observados_dia"] + 2)) * 100
    ).round(2)

    # Compatibilidad con clientes existentes.
    horario["probabilidad_pct"] = horario["probabilidad_real_pct"]

    p75 = horario["probabilidad_real_pct"].quantile(0.75)
    p50 = horario["probabilidad_real_pct"].quantile(0.50)

    def alerta(p):
        if p >= p75: return "ALTO"
        if p >= p50: return "MEDIO"
        return "BAJO"

    horario["nivel_alerta"]    = horario["probabilidad_real_pct"].apply(alerta)
    horario["severidad_media"] = horario["severidad_media"].round(2)
    horario["violencia_media"] = horario["violencia_media"].round(2)

    # Añadir la próxima fecha calendario para cada día de la semana
    weekday_map = {
        "Lunes": 0, "Martes": 1, "Miércoles": 2,
        "Jueves": 3, "Viernes": 4, "Sábado": 5, "Domingo": 6
    }

    def next_date_iso(dia):
        today = pd.Timestamp.now().date()
        target = weekday_map.get(dia, None)
        if target is None:
            return None
        days_ahead = (target - today.weekday() + 7) % 7
        fecha_obj = today + pd.Timedelta(days=days_ahead)
        return fecha_obj.isoformat()

    horario["fecha"] = horario["dia_semana"].apply(next_date_iso)

    return horario.sort_values("probabilidad_real_pct", ascending=False).to_dict(orient="records")


# ── RANDOM FOREST ────────────────────────────────────────────────────────────

def prediccion_zona_siguiente() -> list:
    df = _cargar_datos()

    # Encoders con todas las categorías posibles definidas explícitamente
    dias_posibles   = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"]
    turnos_posibles = ["Madrugada","Mañana","Tarde","Noche"]

    le_dia   = LabelEncoder().fit(dias_posibles)
    le_turno = LabelEncoder().fit(turnos_posibles)

    df["dia_encoded"]   = le_dia.transform(df["dia_semana"])
    df["turno_encoded"] = le_turno.transform(df["turno"])
    df["es_feriado"]    = df["es_feriado"].astype(int)

    X = df[["hora","dia_encoded","turno_encoded","es_feriado","mes"]].values
    y = df["id_zona"].values

    modelo = RandomForestClassifier(n_estimators=100, random_state=42)
    modelo.fit(X, y)

    # Mapa zona_id -> info
    zona_info_map = (
        df[["id_zona","nombre_sector","latitud","longitud"]]
        .drop_duplicates("id_zona")
        .set_index("id_zona")
        .to_dict(orient="index")
    )

    predicciones = []
    mes_actual = pd.Timestamp.now().month

    for dia in dias_posibles:
        for hora in range(24):
            if   hora < 6:  turno = "Madrugada"
            elif hora < 12: turno = "Mañana"
            elif hora < 18: turno = "Tarde"
            else:           turno = "Noche"

            fila = [[
                hora,
                int(le_dia.transform([dia])[0]),
                int(le_turno.transform([turno])[0]),
                0,
                mes_actual
            ]]

            probs     = modelo.predict_proba(fila)[0]
            zona_id   = int(modelo.predict(fila)[0])
            confianza = round(float(max(probs)) * 100, 2)
            info      = zona_info_map.get(zona_id, {})

            # Calcular la próxima fecha calendario para el día de la semana dado
            # Mapeo nombres a weekday numbers (0=Lunes .. 6=Domingo)
            weekday_map = {
                "Lunes": 0, "Martes": 1, "Miércoles": 2,
                "Jueves": 3, "Viernes": 4, "Sábado": 5, "Domingo": 6
            }
            today = pd.Timestamp.now().date()
            target_wd = weekday_map.get(dia, None)
            if target_wd is not None:
                days_ahead = (target_wd - today.weekday() + 7) % 7
                # Si es el mismo día, usar la fecha de hoy
                fecha_obj = today + pd.Timedelta(days=days_ahead)
                fecha_iso = fecha_obj.isoformat()
            else:
                fecha_iso = None

            predicciones.append({
                "dia_semana":    dia,
                "hora":          hora,
                "turno":         turno,
                "zona_predicha": info.get("nombre_sector", "Desconocida"),
                "latitud":       float(info.get("latitud", 0)),
                "longitud":      float(info.get("longitud", 0)),
                "confianza_pct": confianza,
                "fecha":         fecha_iso,
            })

    return sorted(predicciones, key=lambda x: x["confianza_pct"], reverse=True)[:20]


# ── RESUMEN EJECUTIVO ────────────────────────────────────────────────────────

def resumen_predicciones() -> dict:
    clusters  = clustering_zonas()
    horarios  = prediccion_horarios()
    siguiente = prediccion_zona_siguiente()

    zona_critica  = next((z for z in clusters if z["nivel_cluster"] == "Riesgo Alto"), None)
    horario_pico  = horarios[0] if horarios else None
    prox_delito   = siguiente[0] if siguiente else None

    return {
        "zona_mas_critica":          zona_critica,
        "horario_mas_riesgoso":      horario_pico,
        "proximo_delito_predicho":   prox_delito,
        "total_zonas_analizadas":    len(clusters),
        "total_patrones_horarios":   len(horarios),
    }


# --- AGREGAR AL FINAL DE app/services/predicciones.py ---

from sklearn.ensemble import RandomForestClassifier as RFC
from sklearn.metrics import f1_score, accuracy_score, classification_report
from sklearn.metrics import silhouette_score
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')


def _tipos_amenaza():
    """Mapea id_tipo a nombre de amenaza."""
    return {
        1: 'Robo con violencia',
        2: 'Robo de vehículo',
        3: 'Robo a negocio',
        4: 'Asalto en transporte',
        5: 'Vandalismo',
        6: 'Riña / Disturbio',
        7: 'Narcomenudeo',
        8: 'Acoso',
        9: 'Robo a casa',
        10: 'Homicidio',
    }


def clasificar_amenaza(hora: int, dia_semana: str, zona_id: int,
                       nivel_riesgo: int, es_feriado: int = 0) -> dict:
    """
    Random Forest: clasifica el tipo de amenaza dado un conjunto
    de condiciones observadas. Uso desde formulario en frontend.
    """
    df = _cargar_datos()

    dias = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"]
    le_dia = LabelEncoder().fit(dias)

    df["dia_enc"] = le_dia.transform(df["dia_semana"])
    df["es_feriado"] = df["es_feriado"].astype(int)

    X = df[["hora","dia_enc","es_feriado","nivel_riesgo","id_zona"]].values
    y = df["id_tipo"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
        if len(set(y)) > 1 else None
    )

    modelo = RFC(n_estimators=100, random_state=42, class_weight='balanced')
    modelo.fit(X_train, y_train)

    # Métricas del modelo
    y_pred  = modelo.predict(X_test)
    acc     = round(accuracy_score(y_test, y_pred) * 100, 2)
    f1      = round(f1_score(y_test, y_pred, average='weighted',
                             zero_division=0) * 100, 2)

    # Clasificar entrada del usuario
    try:
        dia_enc_val = int(le_dia.transform([dia_semana])[0])
    except Exception:
        dia_enc_val = 0

    entrada = [[hora, dia_enc_val, es_feriado, nivel_riesgo, zona_id]]
    tipo_id  = int(modelo.predict(entrada)[0])
    probs    = modelo.predict_proba(entrada)[0]
    clases   = modelo.classes_

    tipos_map = _tipos_amenaza()

    # Top 5 probabilidades
    prob_clases = sorted(
        [{"tipo_id": int(c), "tipo": tipos_map.get(int(c), f"Tipo {c}"),
          "probabilidad_pct": round(float(p) * 100, 2)}
         for c, p in zip(clases, probs)],
        key=lambda x: x["probabilidad_pct"], reverse=True
    )[:5]

    return {
        "amenaza_predicha":      tipos_map.get(tipo_id, f"Tipo {tipo_id}"),
        "tipo_id":               tipo_id,
        "confianza_pct":         round(float(max(probs)) * 100, 2),
        "distribucion_clases":   prob_clases,
        "metricas_modelo": {
            "accuracy_pct": acc,
            "f1_score_pct": f1,
            "n_registros_entrenamiento": len(X_train),
        }
    }


def metricas_modelos() -> dict:
    """Retorna métricas actualizadas de ambos modelos."""
    df = _cargar_datos()

    # K-Means Silhouette
    zona_df = df.groupby("id_zona").agg(
        total=("severidad","count"),
        sev=("severidad","mean"),
        viol=("nivel_violencia","mean")
    ).reset_index()

    features = zona_df[["total","sev","viol"]].values
    n = min(3, len(zona_df))
    km = KMeans(n_clusters=n, random_state=42, n_init=10)
    labels = km.fit_predict(features)
    sil = round(float(silhouette_score(features, labels)), 4) if n > 1 else 0.0

    # Random Forest F1
    dias = ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"]
    le   = LabelEncoder().fit(dias)
    df["dia_enc"]    = le.transform(df["dia_semana"])
    df["es_feriado"] = df["es_feriado"].astype(int)

    X = df[["hora","dia_enc","es_feriado","nivel_riesgo","id_zona"]].values
    y = df["id_tipo"].values

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, random_state=42,
        stratify=y if len(set(y)) > 1 else None
    )
    rf = RFC(n_estimators=100, random_state=42, class_weight='balanced')
    rf.fit(X_tr, y_tr)
    y_pred = rf.predict(X_te)

    return {
        "kmeans": {
            "silhouette_score":  sil,
            "n_clusters":        n,
            "n_zonas":           len(zona_df),
            "estado":            "✓ OK" if sil >= 0.40 else "⚠ Mejorar",
        },
        "random_forest": {
            "accuracy_pct":  round(accuracy_score(y_te, y_pred) * 100, 2),
            "f1_score_pct":  round(f1_score(y_te, y_pred, average='weighted', zero_division=0) * 100, 2),
            "n_estimators":  100,
            "n_train":       len(X_tr),
            "n_test":        len(X_te),
            "estado":        "✓ OK" if f1_score(y_te, y_pred, average='weighted', zero_division=0) >= 0.70 else "⚠ Mejorar",
        }
    }