# app/core/database.py

import pandas as pd
import pyodbc
from app.core.config import settings


def get_connection_string() -> str:
    """Construye el string de conexión según la configuración."""
    if settings.SQL_TRUSTED:
        return (
            f"DRIVER={{{settings.SQL_DRIVER}}};"
            f"SERVER={settings.SQL_SERVER};"
            f"DATABASE={settings.SQL_DATABASE};"
            f"Trusted_Connection=yes;"
        )
    else:
        return (
            f"DRIVER={{{settings.SQL_DRIVER}}};"
            f"SERVER={settings.SQL_SERVER};"
            f"DATABASE={settings.SQL_DATABASE};"
            f"UID={settings.SQL_USER};"
            f"PWD={settings.SQL_PASSWORD};"
        )


def get_connection():
    """Retorna una conexión activa a SQL Server."""
    conn_str = get_connection_string()
    return pyodbc.connect(conn_str)


def query_to_df(sql: str) -> pd.DataFrame:
    """
    Ejecuta una consulta SQL y retorna un DataFrame de Pandas.
    Esta función es el puente entre SQL Server y el motor de cubos.
    """
    conn = get_connection()
    try:
        df = pd.read_sql(sql, conn)
        return df
    finally:
        conn.close()