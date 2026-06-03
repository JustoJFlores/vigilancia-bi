# generar_datos.py
# Ejecutar: python generar_datos.py
# Genera ~10,000 registros en FACT_DELITO con patrones realistas

import random
import pyodbc
from datetime import date, timedelta
from app.core.database import get_connection_string

random.seed(42)

conn   = pyodbc.connect(get_connection_string())
cursor = conn.cursor()

print("Conectado a SQL Server.")

# ─────────────────────────────────────────────
# PASO 1 — Limpiar tablas en orden correcto
# ─────────────────────────────────────────────
print("Limpiando tablas...")
for tabla in [
    "FACT_DELITO",
    "DIM_CAMARA","DIM_ZONA","DIM_TIEMPO","DIM_TIPO_DELITO"
]:
    cursor.execute(f"DELETE FROM {tabla}")
for tabla in ["DIM_ZONA","DIM_CAMARA","DIM_TIPO_DELITO","FACT_DELITO"]:
    cursor.execute(f"DBCC CHECKIDENT ('{tabla}', RESEED, 0)")
conn.commit()
print("Tablas vaciadas.")

# ─────────────────────────────────────────────
# PASO 2 — DIM_TIPO_DELITO
# ─────────────────────────────────────────────
tipos_delito = [
    ("Robo con violencia a transeúnte", "Patrimonial",   4, 1),
    ("Robo de vehículo",                "Patrimonial",   3, 1),
    ("Robo a negocio",                  "Patrimonial",   3, 1),
    ("Asalto en transporte público",    "Patrimonial",   4, 1),
    ("Vandalismo / Daños",              "Daños",         1, 0),
    ("Riña o disturbio",                "Personal",      3, 0),
    ("Venta de drogas",                 "Narcomenudeo",  2, 0),
    ("Acoso y hostigamiento",           "Personal",      2, 0),
    ("Robo a casa habitación",          "Patrimonial",   3, 0),
    ("Homicidio",                       "Personal",      5, 1),
    ("Fraude y extorsión",              "Económico",     2, 0),
    ("Secuestro express",               "Personal",      5, 1),
]
cursor.executemany(
    "INSERT INTO DIM_TIPO_DELITO (descripcion,categoria,nivel_violencia,requiere_arma) VALUES (?,?,?,?)",
    tipos_delito
)
conn.commit()
print(f"DIM_TIPO_DELITO: {len(tipos_delito)} tipos insertados.")

# ─────────────────────────────────────────────
# PASO 3 — DIM_ZONA
# ─────────────────────────────────────────────
zonas = [
    ("Centro Histórico", "Centro",              "Puebla",             19.0414,-98.2063, 4,"Centro"),
    ("Analco",           "Analco",              "Puebla",             19.0390,-98.2010, 5,"Residencial"),
    ("San Baltazar",     "San Baltazar Campeche","Puebla",            19.0100,-98.1900, 5,"Residencial"),
    ("La Paz",           "La Paz",              "Puebla",             19.0450,-98.1850, 3,"Residencial"),
    ("El Carmen",        "El Carmen",           "Puebla",             19.0500,-98.2100, 3,"Comercial"),
    ("Cholula",          "San Andrés Cholula",  "San Andrés Cholula", 19.0632,-98.3063, 2,"Residencial"),
    ("CAPU",             "CAPU",                "Puebla",             19.0780,-98.2250, 4,"Comercial"),
    ("Xonaca",           "Xonaca",              "Puebla",             19.0620,-98.1920, 4,"Residencial"),
    ("Zona Industrial",  "Parque Industrial",   "Cuautlancingo",      19.0900,-98.2800, 3,"Industrial"),
    ("Huexotitla",       "Huexotitla",          "Puebla",             19.0230,-98.2380, 3,"Residencial"),
    ("Angelópolis",      "Reserva Territorial", "Puebla",             19.0050,-98.2430, 2,"Comercial"),
    ("San Manuel",       "San Manuel",          "Puebla",             19.0710,-98.1840, 4,"Residencial"),
    ("La Libertad",      "La Libertad",         "Puebla",             19.0560,-98.1760, 5,"Residencial"),
    ("Amalucan",         "Amalucan",            "Puebla",             19.0830,-98.1700, 4,"Residencial"),
    ("Las Animas",       "Las Animas",          "Puebla",             19.0160,-98.2550, 3,"Comercial"),
]
cursor.executemany(
    """INSERT INTO DIM_ZONA
       (nombre_sector,colonia,municipio,latitud,longitud,nivel_riesgo,tipo_zona)
       VALUES (?,?,?,?,?,?,?)""",
    zonas
)
conn.commit()
print(f"DIM_ZONA: {len(zonas)} zonas insertadas.")

# ─────────────────────────────────────────────
# PASO 4 — DIM_CAMARA
# ─────────────────────────────────────────────
camaras = [
    ("CAM-001","Hikvision DS-2CD2T87G2","4K",  19.0416,-98.2061, 1,"Activa",      3000,1,"2025-01-10"),
    ("CAM-002","Dahua IPC-HFW5849H",   "4K",  19.0412,-98.2065, 1,"Activa",      2800,1,"2025-01-10"),
    ("CAM-003","Axis P3245-V",         "1080p",19.0392,-98.2008, 2,"Activa",      1800,0,"2024-06-15"),
    ("CAM-004","Axis P3245-V",         "1080p",19.0388,-98.2014, 2,"Inactiva",    1800,0,"2024-06-15"),
    ("CAM-005","Hikvision DS-2CD2T87G2","4K",  19.0102,-98.1902, 3,"Activa",      3000,1,"2025-02-20"),
    ("CAM-006","Bosch FLEXIDOME 5100i","1080p",19.0108,-98.1908, 3,"Activa",      2000,1,"2025-02-20"),
    ("CAM-007","Dahua IPC-HDW2849H",   "4K",  19.0452,-98.1848, 4,"Activa",      2500,0,"2024-11-05"),
    ("CAM-008","Hanwha QNV-8080R",     "4K",  19.0498,-98.2102, 5,"Activa",      3200,1,"2025-03-01"),
    ("CAM-009","Hikvision DS-2CD2T87G2","4K",  19.0782,-98.2248, 7,"Activa",      3000,1,"2025-01-25"),
    ("CAM-010","Axis Q6135-LE PTZ",    "4K",  19.0778,-98.2252, 7,"Mantenimiento",4000,1,"2025-01-25"),
    ("CAM-011","Hikvision DS-2CD2T47G2","4K",  19.0622,-98.1918, 8,"Activa",      2500,1,"2025-04-10"),
    ("CAM-012","Axis P3245-V",         "1080p",19.0618,-98.1924, 8,"Activa",      1800,0,"2025-04-10"),
    ("CAM-013","Dahua IPC-HFW5849H",   "4K",  19.0232,-98.2378,10,"Activa",      2800,1,"2025-05-01"),
    ("CAM-014","Hikvision DS-2CD2T87G2","4K",  19.0712,-98.1838,12,"Activa",      3000,1,"2025-03-15"),
    ("CAM-015","Axis P3245-V",         "1080p",19.0562,-98.1758,13,"Activa",      1800,0,"2025-02-10"),
    ("CAM-016","Bosch FLEXIDOME 5100i","1080p",19.0558,-98.1764,13,"Inactiva",    2000,0,"2025-02-10"),
    ("CAM-017","Hikvision DS-2CD2T47G2","4K",  19.0832,-98.1698,14,"Activa",      2500,1,"2025-04-20"),
    ("CAM-018","Hanwha QNV-8080R",     "4K",  19.0052,-98.2428,11,"Activa",      3200,1,"2025-05-10"),
    ("CAM-019","Dahua IPC-HDW2849H",   "4K",  19.0162,-98.2548,15,"Activa",      2500,0,"2025-03-20"),
    ("CAM-020","Axis Q6135-LE PTZ",    "4K",  19.0902,-98.2798, 9,"Activa",      4500,1,"2025-01-05"),
]
cursor.executemany(
    """INSERT INTO DIM_CAMARA
       (codigo_camara,modelo,resolucion,latitud,longitud,
        id_zona,estado_operativo,cobertura_m2,tiene_ia,fecha_instalacion)
       VALUES (?,?,?,?,?,?,?,?,?,?)""",
    camaras
)
conn.commit()
print(f"DIM_CAMARA: {len(camaras)} cámaras insertadas.")

# ─────────────────────────────────────────────
# PASO 5 — DIM_TIEMPO: todos los días 2024-01-01 a 2026-05-20
# ─────────────────────────────────────────────
print("Generando DIM_TIEMPO...")

def get_turno(hora):
    if hora < 6:   return "Madrugada"
    if hora < 12:  return "Mañana"
    if hora < 18:  return "Tarde"
    return "Noche"

def get_dia_semana(d):
    return ["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"][d.weekday()]

def get_temporada(mes, dia):
    if mes == 12 or (mes == 1 and dia <= 6):  return "AñoNuevo"
    if mes in (6,7,8):                         return "Verano"
    if mes == 12 and dia >= 16:                return "Navidad"
    return "Normal"

feriados = {
    (1,1),(2,5),(3,21),(5,1),(5,5),(9,16),(11,2),(11,20),(12,12),(12,25)
}

fecha_inicio = date(2024, 1, 1)
fecha_fin    = date(2026, 5, 20)

# Solo generamos registros por hora para horas clave (reduce volumen pero cubre patrones)
horas_clave = [0, 2, 6, 8, 10, 12, 14, 16, 18, 20, 22, 23]

tiempos = []
d = fecha_inicio
while d <= fecha_fin:
    for h in horas_clave:
        id_t    = int(f"{d.year}{d.month:02d}{d.day:02d}{h:02d}")
        semana  = d.isocalendar()[1]
        trimestre = (d.month - 1) // 3 + 1
        feriado = 1 if (d.month, d.day) in feriados else 0
        tiempos.append((
            id_t, d.isoformat(), d.year, d.month, d.day, h,
            get_dia_semana(d), get_turno(h),
            semana, trimestre, feriado,
            get_temporada(d.month, d.day)
        ))
    d += timedelta(days=1)

# Insertar en lotes de 500
# Insertar en lotes de 500
batch = 500

for i in range(0, len(tiempos), batch):
    lote = []

    for t in tiempos[i:i+batch]:
        lote.append((
            t[0],  # id_tiempo
            t[1],  # fecha
            t[2],  # anio
            t[3],  # mes
            t[4],  # dia
            t[5],  # hora
            t[6],  # dia_semana
            t[7],  # turno
            t[9],  # trimestre
            t[10], # es_feriado
            t[11], # temporada
        ))

    cursor.executemany(
        """
        INSERT INTO DIM_TIEMPO
        (
            id_tiempo,
            fecha,
            anio,
            mes,
            dia,
            hora,
            dia_semana,
            turno,
            trimestre,
            es_feriado,
            temporada
        )
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """,
        lote
    )

conn.commit()
print(f"DIM_TIEMPO: {len(tiempos):,} registros insertados.")

# ─────────────────────────────────────────────
# PASO 6 — FACT_DELITO con patrones realistas
# ─────────────────────────────────────────────
print("Generando FACT_DELITO (~10,000 registros)...")

# Probabilidades por zona (nivel_riesgo define peso)
zona_pesos = {
    1:  8,   # Centro Histórico  riesgo 4
    2: 15,   # Analco            riesgo 5  ← zona caliente
    3: 12,   # San Baltazar      riesgo 5  ← zona caliente
    4:  6,   # La Paz            riesgo 3
    5:  5,   # El Carmen         riesgo 3
    6:  2,   # Cholula           riesgo 2
    7:  9,   # CAPU              riesgo 4
    8:  8,   # Xonaca            riesgo 4
    9:  4,   # Zona Industrial   riesgo 3
   10:  5,   # Huexotitla        riesgo 3
   11:  2,   # Angelópolis       riesgo 2
   12:  8,   # San Manuel        riesgo 4
   13: 14,   # La Libertad       riesgo 5  ← zona caliente
   14:  8,   # Amalucan          riesgo 4
   15:  4,   # Las Animas        riesgo 3
}

# Probabilidades por hora (más delitos en noche/madrugada)
hora_pesos = {
    0: 14, 2: 10, 6: 3, 8: 4, 10: 4,
   12:  5, 14: 6, 16: 7, 18: 9, 20: 11, 22: 14, 23: 13
}

# Probabilidades por tipo de delito (robo más frecuente)
tipo_pesos = {
    1: 22,  # Robo con violencia
    2: 15,  # Robo vehículo
    3: 12,  # Robo negocio
    4: 10,  # Asalto transporte
    5:  8,  # Vandalismo
    6:  9,  # Riña
    7:  7,  # Drogas
    8:  5,  # Acoso
    9:  6,  # Robo casa
   10:  2,  # Homicidio
   11:  3,  # Fraude
   12:  1,  # Secuestro
}

# Cámaras por zona
camaras_zona = {
    1:[1,2], 2:[3,4], 3:[5,6], 4:[7], 5:[8],
    6:[], 7:[9,10], 8:[11,12], 9:[20], 10:[13],
    11:[18], 12:[14], 13:[15,16], 14:[17], 15:[19]
}

def weighted_choice(peso_dict):
    poblacion = list(peso_dict.keys())
    pesos     = list(peso_dict.values())
    return random.choices(poblacion, weights=pesos, k=1)[0]

def jitter(coord, rango=0.005):
    return round(coord + random.uniform(-rango, rango), 7)

# Nivel de severidad según zona y hora
def calc_severidad(zona_id, hora, tipo_id):
    base = zonas[zona_id-1][5]          # nivel_riesgo de la zona (1-5)
    factor_noche = 1.4 if hora in (0,2,22,23) else 1.0
    factor_tipo  = 1.5 if tipo_id in (1,4,10,12) else 1.0
    sev = int(base * factor_noche * factor_tipo * random.uniform(0.8, 1.2))
    return max(1, min(10, sev))

# Tiempo de respuesta (zonas más alejadas o de noche tardan más)
def calc_respuesta(zona_id, hora):
    base = random.randint(5, 20)
    if hora in (0, 2, 3):  base += random.randint(5, 15)
    if zona_id in (3, 9, 13, 14): base += random.randint(3, 8)
    return base

# Generar IDs de DIM_TIEMPO disponibles
tiempo_ids = [t[0] for t in tiempos]

TARGET = 3000
hechos = []

for _ in range(TARGET):
    zona_id  = weighted_choice(zona_pesos)
    hora     = weighted_choice(hora_pesos)
    tipo_id  = weighted_choice(tipo_pesos)

    # Elegir un id_tiempo que coincida con la hora seleccionada
    candidatos = [t for t in tiempo_ids if int(str(t)[-2:]) == hora]
    if not candidatos:
        candidatos = tiempo_ids
    id_tiempo = random.choice(candidatos)

    # Cámara de la zona (si no hay, asignar la más cercana)
    cams = camaras_zona.get(zona_id, [])
    if not cams:
        cams = [random.randint(1, 20)]
    id_camara = random.choice(cams)

    sev         = calc_severidad(zona_id, hora, tipo_id)
    cant_ev     = random.choices([1,2,3,4], weights=[60,25,10,5])[0]
    detecto_ia  = 1 if (id_camara in [1,2,5,6,8,9,11,13,14,17,18,20]
                        and random.random() > 0.15) else 0
    t_resp      = calc_respuesta(zona_id, hora)
    capturado   = 1 if (random.random() < 0.18 and sev < 9) else 0

    lat_zona = zonas[zona_id-1][3]
    lon_zona = zonas[zona_id-1][4]

    hechos.append((
        id_tiempo, zona_id, id_camara, tipo_id,
        sev, cant_ev, detecto_ia, t_resp, capturado,
        jitter(lat_zona), jitter(lon_zona)
    ))

# Insertar en lotes de 500
print(f"Insertando {len(hechos):,} hechos en lotes de 500...")
for i in range(0, len(hechos), 500):
    cursor.executemany(
        """INSERT INTO FACT_DELITO
           (id_tiempo,id_zona,id_camara,id_tipo,
            severidad,cantidad_eventos,detecto_ia,tiempo_respuesta_min,
            fue_capturado,latitud_evento,longitud_evento)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
        hechos[i:i+500]
    )
    conn.commit()
    pct = min(100, int((i+500)/TARGET*100))
    print(f"  {min(i+500,TARGET):,}/{TARGET:,} registros ({pct}%)", end="\r")

print()
conn.commit()
conn.close()

print("\n✓ COMPLETADO. Resumen:")
print(f"  DIM_TIEMPO:      {len(tiempos):,} registros")
print(f"  DIM_ZONA:        {len(zonas)} zonas")
print(f"  DIM_CAMARA:      {len(camaras)} cámaras")
print(f"  DIM_TIPO_DELITO: {len(tipos_delito)} tipos")
print(f"  FACT_DELITO:     {len(hechos):,} hechos")
print("\nEjecuta en SQL Server para verificar:")
print("  SELECT COUNT(*) FROM FACT_DELITO")