# Sistema de BI — Vigilancia Inteligente

Sistema de Business Intelligence para análisis predictivo de zonas delictivas en Puebla, México.

## Qué incluye

- Backend en FastAPI para exponer cubos, predicciones y autenticación.
- Frontend en React + Vite para visualización del dashboard.
- Conexión a SQL Server para leer el Data Warehouse del proyecto.

## Tecnologías

- **Base de datos:** SQL Server
- **Backend:** Python, FastAPI, Pandas, NumPy, scikit-learn, pyodbc
- **Frontend:** React, Vite, Tailwind CSS, Recharts, Leaflet

## Requisitos previos

- Python 3.11 o superior.
- Node.js 18 o superior.
- SQL Server accesible desde la máquina donde vayas a ejecutar el proyecto.
- ODBC Driver 17 for SQL Server instalado en Windows.

## Configuración inicial

1. Copia el archivo [.env.example](.env.example) a `.env` en la raíz del proyecto.
2. Copia el archivo [frontend/.env.example](frontend/.env.example) a `frontend/.env` si quieres cambiar la URL de la API.
3. Ajusta estos valores en `.env`:
	- `SQL_SERVER`
	- `SQL_DATABASE`
	- `SQL_DRIVER`
	- `SQL_TRUSTED`
	- `SQL_USER`
	- `SQL_PASSWORD`
	- `SECRET_KEY`
4. Si usas autenticación de Windows, deja `SQL_TRUSTED=true` y no llenes usuario ni contraseña.
5. Si usas autenticación SQL Server, pon `SQL_TRUSTED=false` y completa `SQL_USER` y `SQL_PASSWORD`.

## Instalación

### Backend

```bash
cd vigilancia-bi
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend

```bash
cd vigilancia-bi/frontend
npm install
```

## Cómo ejecutar

### 1. Inicia el backend

```bash
cd vigilancia-bi
venv\Scripts\activate
uvicorn main:app --reload
```

### 2. Inicia el frontend

```bash
cd vigilancia-bi/frontend
npm run dev
```

## Verificación rápida

- Dashboard: http://localhost:5173
- API docs: http://localhost:8000/docs
- Prueba de conexión a la base de datos: http://localhost:8000/test-db

## Antes de subir a Git

- No subas `.env`, `frontend/.env`, `venv/` ni `node_modules/`.
- Revisa que no queden credenciales reales en `app/core/config.py`.
- Ejecuta `git status` antes de hacer el commit para confirmar qué archivos se van a subir.

## Estructura de archivos de configuración

- [.env.example](.env.example): variables del backend.
- [frontend/.env.example](frontend/.env.example): variables del frontend.