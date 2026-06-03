// frontend/src/store/useDashboardStore.js
import { create } from 'zustand'

const PERMISSIONS = {
  administrador: ['*'],
  analista: ['dashboard', 'predicciones', 'cubos', 'zonas', 'mapa'],
  operador: ['dashboard', 'camaras', 'horarios', 'mapa', 'zonas'],
}

const normalizeRole = (role) => String(role || '').trim().toLowerCase()
const THEME_STORAGE_KEY = 'sibvp_theme'

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark'

  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme

  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

const useDashboardStore = create((set, get) => ({
  // Auth
  token:    localStorage.getItem('sibvp_token') || null,
  usuario:  JSON.parse(localStorage.getItem('sibvp_usuario') || 'null'),
  theme:    getInitialTheme(),

  // Datos cubos
  zonasRiesgo: [], horarios: [], densidad: [],
  camaras: [], prediccion: [], clustering: [], resumen: null,

  // UI
  loading: false, error: null, paginaActual: 'dashboard',

  // Auth actions
  login: (token, usuario) => {
    localStorage.setItem('sibvp_token', token)
    const normalizedUser = usuario ? { ...usuario, rol: normalizeRole(usuario.rol) } : usuario
    localStorage.setItem('sibvp_usuario', JSON.stringify(normalizedUser))
    set({ token, usuario: normalizedUser })
  },
  logout: () => {
    localStorage.removeItem('sibvp_token')
    localStorage.removeItem('sibvp_usuario')
    set({ token: null, usuario: null, paginaActual: 'dashboard',
          zonasRiesgo: [], horarios: [], camaras: [], clustering: [], resumen: null })
  },

  // Permissions helper
  canAccess: (pageId) => {
    const rol = normalizeRole(get().usuario?.rol)
    if (!rol) return false
    if (rol === 'administrador') return true
    const allowed = PERMISSIONS[rol] || []
    return allowed.includes(pageId)
  },

  // Data setters
  setZonasRiesgo:  (d) => set({ zonasRiesgo: d }),
  setHorarios:     (d) => set({ horarios: d }),
  setDensidad:     (d) => set({ densidad: d }),
  setCamaras:      (d) => set({ camaras: d }),
  setPrediccion:   (d) => set({ prediccion: d }),
  setClustering:   (d) => set({ clustering: d }),
  setResumen:      (d) => set({ resumen: d }),
  setLoading:      (v) => set({ loading: v }),
  setError:        (e) => set({ error: e }),
  setPagina:       (p) => set({ paginaActual: p }),
  setTheme: (theme) => {
    const nextTheme = theme === 'light' ? 'light' : 'dark'
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    set({ theme: nextTheme })
  },
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    set({ theme: nextTheme })
  },
}))

export default useDashboardStore