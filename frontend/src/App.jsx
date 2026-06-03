// frontend/src/App.jsx
import Sidebar      from './components/layout/Sidebar'
import Login        from './pages/Login'
import Dashboard    from './pages/Dashboard'
import ZonasRiesgo  from './pages/ZonasRiesgo'
import Horarios     from './pages/Horarios'
import Camaras      from './pages/Camaras'
import Predicciones from './pages/Predicciones'
import MapaCalor    from './pages/MapaCalor'
import CubosPersonalizados from './pages/CubosPersonalizados'
import useDashboardStore from './store/useDashboardStore'
import { useEffect } from 'react'

export default function App() {
  const { token, paginaActual, canAccess, setPagina, theme } = useDashboardStore()

  useEffect(() => {
    if (token && !canAccess(paginaActual)) {
      setPagina('dashboard')
    }
  }, [token, paginaActual, canAccess, setPagina])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.documentElement.style.colorScheme = theme
  }, [theme])

  if (!token) return <Login />

  const paginas = {
    dashboard:    <Dashboard />,
    zonas:        <ZonasRiesgo />,
    horarios:     <Horarios />,
    camaras:      <Camaras />,
    predicciones: <Predicciones />,
    mapa:         <MapaCalor />,
    cubos:        <CubosPersonalizados />,
  }
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      {/* ml-56 = 224px, igual al ancho fijo del sidebar */}
      <main className="flex-1 ml-56 overflow-y-auto min-h-screen">
        {canAccess(paginaActual) ? (paginas[paginaActual] || <Dashboard />) : <Dashboard />}
      </main>
    </div>
  )
}