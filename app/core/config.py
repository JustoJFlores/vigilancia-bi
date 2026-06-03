# app/core/config.py

import os

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None


if load_dotenv is not None:
    load_dotenv()


def _get_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


class Settings:
    SQL_SERVER = os.getenv("SQL_SERVER", "DESKTOP-DRO9NN0")
    SQL_DATABASE = os.getenv("SQL_DATABASE", "VigilanciaDW")
    SQL_DRIVER = os.getenv("SQL_DRIVER", "ODBC Driver 17 for SQL Server")
    SQL_TRUSTED = _get_bool("SQL_TRUSTED", True)
    SQL_USER = os.getenv("SQL_USER", "")
    SQL_PASSWORD = os.getenv("SQL_PASSWORD", "")

    SECRET_KEY = os.getenv(
        "SECRET_KEY",
        "sibvp-vigilancia-puebla-2026-clave-secreta-jwt"
    )

    APP_NAME = "Sistema BI - Vigilancia Inteligente"
    VERSION = "1.0.0"


settings = Settings()