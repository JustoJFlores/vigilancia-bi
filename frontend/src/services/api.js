// frontend/src/services/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000,
})

// Adjuntar token automáticamente
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sibvp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Cubos
export const getCuboZonasRiesgo     = () => api.get('/api/cubos/zonas-riesgo')
export const getCuboHorarios        = () => api.get('/api/cubos/horarios-riesgo')
export const getCuboDensidad        = () => api.get('/api/cubos/densidad-zona')
export const getCuboPrediccion      = () => api.get('/api/cubos/prediccion-proximo')
export const getCuboCamaras         = () => api.get('/api/cubos/estado-camaras')

// Predicciones
export const getClusteringZonas     = () => api.get('/api/predicciones/clustering-zonas')
export const getPrediccionHorarios  = () => api.get('/api/predicciones/horarios-riesgo')
export const getPrediccionSiguiente = () => api.get('/api/predicciones/zona-siguiente')
export const getResumenPredicciones = () => api.get('/api/predicciones/resumen')
export const getMetricasModelos     = () => api.get('/api/predicciones/metricas')
export const postClasificacionAmenaza = (data) => api.post('/api/predicciones/clasificacion/amenaza', data)

// Auth
export const postLogin = (username, password) =>
  api.post('/api/auth/login', { username, password })

export default api