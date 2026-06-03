// frontend/src/pages/MapaCalor.jsx
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Popup, Marker, Tooltip, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { AlertCircle, Camera, TrendingUp, Flame, Shield, Map as MapIcon, Eye, Zap, Activity } from 'lucide-react'
import useDashboardStore from '../store/useDashboardStore'
import { getCuboZonasRiesgo, getClusteringZonas, getCuboCamaras } from '../services/api'

const riesgoColor = {
  'ZONA ROJA':     '#f43f5e',
  'ZONA NARANJA':  '#f59e0b',
  'ZONA AMARILLA': '#22d3ee',
}

const clusterBorde = {
  'Riesgo Alto':  '#f43f5e',
  'Riesgo Medio': '#f59e0b',
  'Riesgo Bajo':  '#22d3ee',
}

// Icono SVG mejorado para cámaras
const iconoCamara = (activa) => L.divIcon({
  className: '',
  html: `<div style="
    width:14px; height:14px;
    background:${activa ? '#22d3ee' : '#f43f5e'};
    border:2.5px solid ${activa ? '#0891b2' : '#991b1b'};
    border-radius:50%;
    box-shadow: 0 0 8px ${activa ? '#22d3ee99' : '#f43f5e99'}, 0 0 16px ${activa ? '#22d3ee44' : '#f43f5e44'};
  "></div>`,
  iconAnchor: [7, 7],
})

// Componente StatCard
const StatCard = ({ icon: Icon, label, value, unit = '', color = 'cyan', trend = '' }) => {
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/5 border-cyan-500/20',
    rose: 'text-rose-400 bg-rose-500/5 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/5 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/5 border-purple-500/20',
    blue: 'text-blue-400 bg-blue-500/5 border-blue-500/20',
  }
  
  return (
    <div className={`bg-slate-900/40 border rounded-lg p-3 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
        <Icon className="w-4 h-4 opacity-40" />
      </div>
      <p className="text-xl font-bold flex items-baseline gap-1">
        {value}
        {unit && <span className="text-xs text-slate-400">{unit}</span>}
      </p>
      {trend && <p className="text-[9px] text-slate-400 mt-1">{trend}</p>}
    </div>
  )
}

// Mini sparkline SVG (small inline chart, no deps)
const Sparkline = ({ values = [], color = '#22d3ee', width = 120, height = 28 }) => {
  if (!values || values.length === 0) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  const step = width / Math.max(1, values.length - 1)
  const points = values.map((v, i) => `${i * step},${height - ((v - min) / range) * height}`).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Componente para renderizar el mapa de calor
function HeatmapComponent({ zonas, blurLevel, coreOpacity, spreadRadius }) {
  const map = useMap()
  
  useEffect(() => {
    if (!map || !zonas || zonas.length === 0) return

    const maxIncidentes = Math.max(...zonas.map(z => z.total_incidentes), 1)
    const heatData = zonas.map(z => [
      z.latitud,
      z.longitud,
      z.total_incidentes / maxIncidentes,
    ])

    const heatLayer = L.heatLayer(heatData, {
      radius: spreadRadius,
      blur: blurLevel,
      maxZoom: 17,
      minOpacity: coreOpacity,
      gradient: {
        0.1: '#1e3a8a',
        0.35: '#0369a1',
        0.55: '#22d3ee',
        0.78: '#fbbf24',
        1.0: '#f43f5e',
      },
    }).addTo(map)
    
    return () => {
      map.removeLayer(heatLayer)
    }
  }, [map, zonas, blurLevel, coreOpacity, spreadRadius])
  
  return null
}

export default function MapaCalor() {
  const { zonasRiesgo, clustering, camaras, setZonasRiesgo, setClustering, setCamaras } = useDashboardStore()
  const [loading, setLoading] = useState(false)
  const [vistaActiva, setVistaActiva] = useState('zonas') // 'zonas' | 'camaras'
  
  useEffect(() => {
    async function cargar() {
      setLoading(true)
      try {
        const [z, c, cam] = await Promise.all([
          getCuboZonasRiesgo(),
          getClusteringZonas(),
          getCuboCamaras(),
        ])
        setZonasRiesgo(z.data.datos)
        setClustering(c.data.datos)
        setCamaras(cam.data.datos)
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    cargar()
  }, [])

  const zonasMapa = zonasRiesgo.map(z => ({
    ...z,
    cluster: clustering.find(c => c.nombre_sector === z.nombre_sector)?.nivel_cluster || 'Riesgo Bajo'
  }))

  const centro = [19.042, -98.206]

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MapIcon className="w-6 h-6 text-cyan-400" />
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-100">Análisis Geográfico</h2>
            <p className="text-sm text-slate-400">Visualización especializada de zonas de riesgo y cobertura de cámaras</p>
          </div>
        </div>

        {/* Tabs de vista */}
        <div className="flex gap-2">
          {[
            { id: 'zonas', label: 'Zonas de Riesgo', icon: Flame },
            { id: 'camaras', label: 'Cobertura de Cámaras', icon: Camera },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setVistaActiva(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all
                ${vistaActiva === id
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                  : 'border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600'}`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* VISTA 1: ZONAS DE RIESGO */}
      {vistaActiva === 'zonas' && <VistaZonas zonasMapa={zonasMapa} loading={loading} centro={centro} />}

      {/* VISTA 2: COBERTURA DE CÁMARAS */}
      {vistaActiva === 'camaras' && <VistaCamaras camaras={camaras} zonasMapa={zonasMapa} loading={loading} centro={centro} />}
    </div>
  )
}

// ============================================================
// VISTA 1: ZONAS DE RIESGO
// ============================================================
function VistaZonas({ zonasMapa, loading, centro }) {
  const [filtroRiesgo, setFiltroRiesgo] = useState('todos')
  const [blurLevel, setBlurLevel] = useState(34)
  const [coreOpacity, setCoreOpacity] = useState(0.42)
  const [spreadRadius, setSpreadRadius] = useState(50)
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  )

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const zonasFiltradas = filtroRiesgo === 'todos' 
    ? zonasMapa 
    : zonasMapa.filter(z => {
        if (filtroRiesgo === 'rojo') return z.clasificacion === 'ZONA ROJA'
        if (filtroRiesgo === 'naranja') return z.clasificacion === 'ZONA NARANJA'
        if (filtroRiesgo === 'amarillo') return z.clasificacion === 'ZONA AMARILLA'
        return true
      })

  // Estadísticas específicas para zonas
  const totalZonas = zonasMapa.length
  const zonasRojas = zonasMapa.filter(z => z.clasificacion === 'ZONA ROJA').length
  const zonasNaranja = zonasMapa.filter(z => z.clasificacion === 'ZONA NARANJA').length
  const zonasAmarilla = zonasMapa.filter(z => z.clasificacion === 'ZONA AMARILLA').length
  const totalIncidentes = zonasMapa.reduce((a, b) => a + b.total_incidentes, 0)
  const severidadPromedio = (zonasMapa.reduce((a, b) => a + b.severidad_promedio, 0) / totalZonas).toFixed(1)
  const violentosTotal = zonasMapa.reduce((a, b) => a + b.delitos_violentos, 0)

  return (
    <div className="space-y-4">
      {/* KPIs específicos para zonas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard 
          icon={AlertCircle}
          label="Zona Roja"
          value={zonasRojas}
          color="rose"
          trend={`${Math.round(zonasRojas/totalZonas*100)}%`}
        />
        <StatCard 
          icon={Flame}
          label="Zona Naranja"
          value={zonasNaranja}
          color="amber"
          trend={`${Math.round(zonasNaranja/totalZonas*100)}%`}
        />
        <StatCard 
          icon={Eye}
          label="Zona Amarilla"
          value={zonasAmarilla}
          color="blue"
          trend={`${Math.round(zonasAmarilla/totalZonas*100)}%`}
        />
        <StatCard 
          icon={TrendingUp}
          label="Total Incidentes"
          value={totalIncidentes}
          color="cyan"
          trend={`${Math.round(totalIncidentes/totalZonas)} prom.`}
        />
        <StatCard 
          icon={Flame}
          label="Delitos Violentos"
          value={violentosTotal}
          color="rose"
          trend="Totales"
        />
        <StatCard 
          icon={Shield}
          label="Severidad Promedio"
          value={severidadPromedio}
          color="purple"
          trend="Por zona"
        />
      </div>

      {/* Filtro y leyenda */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Filtrar por:</span>
            <select 
              value={filtroRiesgo}
              onChange={(e) => setFiltroRiesgo(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 cursor-pointer hover:border-slate-600"
            >
              <option value="todos">Todas las zonas</option>
              <option value="rojo">🔴 Zona Roja</option>
              <option value="naranja">🟠 Zona Naranja</option>
              <option value="amarillo">🔵 Zona Amarilla</option>
            </select>
          </div>
          <p className="text-xs text-slate-400">{zonasFiltradas.length} zonas mostradas</p>
        </div>

        {/* Leyenda con gradiente de intensidad */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 space-y-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Mapa de Calor - Intensidad de Incidentes</p>
            <div className="flex items-center gap-2 h-8 rounded overflow-hidden border border-slate-700">
              <div className="flex-1 h-full" style={{
                background: 'linear-gradient(to right, #1e3a8a, #0369a1, #22d3ee, #fbbf24, #f43f5e)'
              }} />
              <div className="px-2 text-[10px] text-slate-400 min-w-fit">Baja → Alta</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-700">
            <label className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Glow</span>
                <span>{blurLevel}</span>
              </div>
              <input
                type="range"
                min="18"
                max="55"
                step="1"
                value={blurLevel}
                onChange={(e) => setBlurLevel(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </label>
            <label className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Nucleo</span>
                <span>{coreOpacity.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.18"
                max="0.75"
                step="0.01"
                value={coreOpacity}
                onChange={(e) => setCoreOpacity(Number(e.target.value))}
                className="w-full accent-rose-400"
              />
            </label>
            <label className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Expansion</span>
                <span>{spreadRadius}</span>
              </div>
              <input
                type="range"
                min="24"
                max="72"
                step="1"
                value={spreadRadius}
                onChange={(e) => setSpreadRadius(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </label>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-700">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Clasificación</p>
              <div className="space-y-1.5">
                {Object.entries(riesgoColor).map(([label, color]) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Cluster IA</p>
              <div className="space-y-1.5">
                {Object.entries(clusterBorde).map(([label, color]) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className="w-3 h-1 rounded-full" style={{ background: color }} />
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa con Heatmap */}
      <div className="rounded-lg overflow-hidden border border-slate-800" style={{ height: '500px' }}>
        {loading ? (
          <div className="h-full flex items-center justify-center bg-slate-900/60">
            <p className="text-cyan-400 animate-pulse text-sm">Cargando mapa de calor...</p>
          </div>
        ) : (
          <MapContainer center={centro} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            <HeatmapComponent
              zonas={zonasFiltradas}
              blurLevel={blurLevel}
              coreOpacity={coreOpacity}
              spreadRadius={spreadRadius}
            />
            {zonasFiltradas.map((z, i) => (
              <CircleMarker
                key={`heat-tooltip-${i}`}
                center={[z.latitud, z.longitud]}
                radius={Math.max(16, Math.min(30, z.total_incidentes * 2.2))}
                pathOptions={{
                  fillOpacity: 0,
                  opacity: 0,
                  weight: 0,
                }}
              >
                <Tooltip direction="top" offset={[0, -8]} sticky opacity={0.97}>
                  <div className="text-xs leading-tight">
                    <p className="font-semibold text-slate-100">{z.nombre_sector}</p>
                    <p className="text-slate-300">{z.clasificacion}</p>
                    <p className="text-cyan-300">Incidentes: {z.total_incidentes}</p>
                    {!isMobile && <p className="text-amber-300">Severidad: {z.severidad_promedio}</p>}
                  </div>
                </Tooltip>
                <Popup maxWidth={320}>
                  <div className="flex" style={{ minWidth: 220 }}>
                    <div style={{ width: 6, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, background: riesgoColor[z.clasificacion] }} />
                    <div className="bg-slate-900/70 text-slate-200 p-3 rounded-r-lg w-full">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-100 truncate">{z.nombre_sector}</h4>
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: riesgoColor[z.clasificacion], color: '#071025' }}>{z.clasificacion}</span>
                      </div>

                      <div className="mt-2 text-xs text-slate-400 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[11px] text-slate-400">Incidentes</p>
                          <p className="text-sm font-bold text-cyan-300">{z.total_incidentes}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400">Delitos violentos</p>
                          <p className="text-sm font-bold text-rose-300">{z.delitos_violentos}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400">Capturados</p>
                          <p className="text-sm font-bold text-emerald-300">{z.capturados}</p>
                        </div>
                        <div>
                          <p className="text-[11px] text-slate-400">Severidad</p>
                          <p className="text-sm font-bold text-amber-300">{z.severidad_promedio}</p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-[11px] text-slate-400 mb-1">Severidad (visual)</p>
                        <div className="w-full bg-slate-800 h-2 rounded overflow-hidden">
                          <div style={{ width: `${Math.min(100, (z.severidad_promedio || 0) * 12)}%`, background: riesgoColor[z.clasificacion], height: '100%' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Grid de zonas */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Detalle de Zonas Filtradas ({zonasFiltradas.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {zonasFiltradas.map((z, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded p-3 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-200">{z.nombre_sector}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: riesgoColor[z.clasificacion] }} />
                    <span className="text-[10px] text-slate-400">{z.clasificacion}</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/50 text-xs">
                <div>
                  <p className="text-slate-500 mb-0.5">Incidentes</p>
                  <p className="font-bold text-cyan-400">{z.total_incidentes}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Severidad</p>
                  <p className="font-bold text-amber-400">{z.severidad_promedio}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Violentos</p>
                  <p className="font-bold text-rose-400">{z.delitos_violentos}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Capturados</p>
                  <p className="font-bold text-emerald-400">{z.capturados}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// VISTA 2: COBERTURA DE CÁMARAS
// ============================================================
function VistaCamaras({ camaras, zonasMapa, loading, centro }) {
  const [filtroEstado, setFiltroEstado] = useState('todas')

  const iconoCameraLocal = (activa) => L.divIcon({
    className: '',
    html: `<div style="
      width:16px; height:16px;
      background:${activa ? '#22d3ee' : '#f43f5e'};
      border:2.5px solid ${activa ? '#0891b2' : '#991b1b'};
      border-radius:50%;
      box-shadow: 0 0 8px ${activa ? '#22d3ee99' : '#f43f5e99'}, 0 0 16px ${activa ? '#22d3ee44' : '#f43f5e44'};
    "></div>`,
    iconAnchor: [8, 8],
  })

  const camarasFiltradas = filtroEstado === 'todas'
    ? camaras
    : camaras.filter(c => {
        if (filtroEstado === 'activas') return c.estado_operativo === 'Activa'
        if (filtroEstado === 'inactivas') return c.estado_operativo === 'Inactiva'
        return true
      })

  // Estadísticas específicas para cámaras
  const camarasActivas = camaras.filter(c => c.estado_operativo === 'Activa').length
  const camarasInactivas = camaras.filter(c => c.estado_operativo === 'Inactiva').length
  const camarasConIA = camaras.filter(c => c.tiene_ia).length
  const totalIncidentesDetectados = camaras.reduce((a, b) => a + b.incidentes_detectados, 0)
  const tiempoRespPromedio = (camaras.reduce((a, b) => a + b.tiempo_resp_promedio, 0) / camaras.length).toFixed(1)
  const cobertura = Math.round(camarasActivas / camaras.length * 100)

  return (
    <div className="space-y-4">
      {/* KPIs específicos para cámaras */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard 
          icon={Eye}
          label="Cámaras Activas"
          value={camarasActivas}
          unit={`/${camaras.length}`}
          color="cyan"
          trend={`${cobertura}% cobertura`}
        />
        <StatCard 
          icon={Activity}
          label="Cámaras Inactivas"
          value={camarasInactivas}
          color="rose"
          trend={`${100-cobertura}%`}
        />
        <StatCard 
          icon={Zap}
          label="Con IA Activa"
          value={camarasConIA}
          color="purple"
          trend={`${Math.round(camarasConIA/camaras.length*100)}%`}
        />
        <StatCard 
          icon={AlertCircle}
          label="Incidentes Detectados"
          value={totalIncidentesDetectados}
          color="amber"
          trend="Totales"
        />
        <StatCard 
          icon={TrendingUp}
          label="T. Respuesta Promedio"
          value={tiempoRespPromedio}
          unit="min"
          color="blue"
          trend="Por cámara"
        />
        <StatCard 
          icon={Camera}
          label="Total de Cámaras"
          value={camaras.length}
          color="cyan"
          trend="En el sistema"
        />
      </div>

      {/* Filtro y leyenda */}
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider">Filtrar por:</span>
            <select 
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-300 cursor-pointer hover:border-slate-600"
            >
              <option value="todas">Todas las cámaras</option>
              <option value="activas">✓ Activas</option>
              <option value="inactivas">✗ Inactivas</option>
            </select>
          </div>
          <p className="text-xs text-slate-400">{camarasFiltradas.length} cámaras mostradas</p>
        </div>

        {/* Leyenda */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Estado</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg" style={{boxShadow: '0 0 8px #22d3ee'}} />
                <span className="text-xs text-slate-400">Activa</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg" style={{boxShadow: '0 0 8px #f43f5e'}} />
                <span className="text-xs text-slate-400">Inactiva</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Recomendación</p>
            <div className="space-y-1.5 text-xs text-slate-400">
              <p>🟢 NORMAL - Operativa</p>
              <p>🟡 REVISAR - Mantenimiento</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa solo con cámaras */}
      <div className="rounded-lg overflow-hidden border border-slate-800" style={{ height: '500px' }}>
        {loading ? (
          <div className="h-full flex items-center justify-center bg-slate-900/60">
            <p className="text-cyan-400 animate-pulse text-sm">Cargando cámaras...</p>
          </div>
        ) : (
          <MapContainer center={centro} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; CARTO'
            />
            {camarasFiltradas.map((cam, i) => {
              const zona = zonasMapa.find(z => z.nombre_sector === cam.nombre_sector)
              if (!zona) return null
              const lat = zona.latitud + (Math.random() * 0.003 - 0.0015)
              const lng = zona.longitud + (Math.random() * 0.003 - 0.0015)
              
              return (
                <Marker
                  key={`cam-${i}`}
                  position={[lat, lng]}
                  icon={iconoCameraLocal(cam.estado_operativo === 'Activa')}
                >
                  <Tooltip sticky offset={[0, -15]} direction="top">
                    <div className="text-xs font-semibold">
                      📷 {cam.codigo_camara}
                    </div>
                  </Tooltip>
                  <Popup maxWidth={280}>
                      <div className="flex" style={{ minWidth: 220 }}>
                        <div style={{ width: 6, borderTopLeftRadius: 8, borderBottomLeftRadius: 8, background: cam.estado_operativo === 'Activa' ? '#22d3ee' : '#f43f5e' }} />
                        <div className="bg-slate-900/70 text-slate-200 p-3 rounded-r-lg w-full">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-100 mb-0">📷 {cam.codigo_camara}</p>
                              <p className="text-[11px] text-slate-400">{cam.modelo}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-[11px] font-semibold px-2 py-1 rounded-full" style={{ background: cam.estado_operativo === 'Activa' ? '#022c40' : '#3b0b0b', color: cam.estado_operativo === 'Activa' ? '#22d3ee' : '#f43f5e' }}>
                                {cam.estado_operativo}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-1">{cam.tiene_ia ? 'IA: ✓' : 'IA: ✗'}</div>
                            </div>
                          </div>

                          <div className="mt-3 text-xs text-slate-400 grid grid-cols-2 gap-2">
                            <div>
                              <p className="text-[11px] text-slate-400">Sector</p>
                              <p className="text-sm font-bold text-cyan-300">{cam.nombre_sector}</p>
                            </div>
                            <div>
                              <p className="text-[11px] text-slate-400">Incidentes</p>
                              <p className="text-sm font-bold text-amber-400">{cam.incidentes_detectados}</p>
                            </div>
                            <div>
                              <p className="text-[11px] text-slate-400">Respuesta</p>
                              <p className="text-sm font-bold text-blue-400">{cam.tiempo_resp_promedio}m</p>
                            </div>
                            <div>
                              <p className="text-[11px] text-slate-400">Acción</p>
                              <p className="text-sm font-bold" style={{ color: cam.accion_recomendada === 'NORMAL' ? '#22d3ee' : '#f59e0b' }}>{cam.accion_recomendada}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        )}
      </div>

      {/* Grid de cámaras */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Detalle de Cámaras Filtradas ({camarasFiltradas.length})</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {camarasFiltradas.map((cam, i) => (
            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded p-3 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-slate-200">{cam.codigo_camara}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: cam.estado_operativo === 'Activa' ? '#22d3ee' : '#f43f5e' }} />
                    <span className="text-[10px] text-slate-400">{cam.estado_operativo}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1">{cam.modelo}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/50 text-xs">
                <div>
                  <p className="text-slate-500 mb-0.5">Sector</p>
                  <p className="font-bold text-cyan-400 text-[10px]">{cam.nombre_sector}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">IA</p>
                  <p className="font-bold text-purple-400">{cam.tiene_ia ? '✓' : '✗'}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Incidentes</p>
                  <p className="font-bold text-amber-400">{cam.incidentes_detectados}</p>
                </div>
                <div>
                  <p className="text-slate-500 mb-0.5">Respuesta</p>
                  <p className="font-bold text-blue-400">{cam.tiempo_resp_promedio}m</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/50">
                <p className="text-[9px] text-slate-500 mb-1">Acción</p>
                <p className="text-[10px] font-bold" style={{color: cam.accion_recomendada === 'NORMAL' ? '#22d3ee' : '#f59e0b'}}>
                  {cam.accion_recomendada}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
