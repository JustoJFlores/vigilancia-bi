// frontend/src/pages/Predicciones.jsx
import { useEffect, useState, useMemo } from 'react'
import { 
  BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
  CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts'
import { AlertCircle, TrendingUp, Shield, Clock, MapPin, Zap, Target, Filter, Download, RefreshCw, Info } from 'lucide-react'
import useDashboardStore from '../store/useDashboardStore'
import { formatDateDDMMYYYY } from '../utils/date'
import { getPrediccionSiguiente, getClusteringZonas, getPrediccionHorarios } from '../services/api'
import { exportarCSV } from '../services/exportar'

// ── COMPONENTE REUTILIZABLE: TARJETA DE MÉTRICA ───────────────────────────

const StatCard = ({ icon: Icon, label, value, unit = '', trend, color = 'cyan', tooltip = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  
  const colorClasses = {
    cyan: 'text-cyan-400 bg-cyan-500/5 border-cyan-500/20',
    rose: 'text-rose-400 bg-rose-500/5 border-rose-500/20',
    amber: 'text-amber-400 bg-amber-500/5 border-amber-500/20',
    purple: 'text-purple-400 bg-purple-500/5 border-purple-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20',
  }
  
  return (
    <div className={`bg-slate-900/40 border rounded-xl p-4 ${colorClasses[color]} hover:border-opacity-100 transition-all cursor-help relative group`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[11px] uppercase tracking-widest text-slate-500 mb-2">{label}</p>
          <p className="text-3xl font-bold flex items-baseline gap-1">
            {value}
            {unit && <span className="text-sm text-slate-400">{unit}</span>}
          </p>
          {trend && <p className="text-[10px] text-slate-400 mt-1">{trend}</p>}
        </div>
        <Icon className="w-5 h-5 opacity-40" />
      </div>
      {tooltip && (
        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 whitespace-nowrap">
          {tooltip}
        </div>
      )}
    </div>
  )
}

// ── COMPONENTE: CHIP DE ESTADO ────────────────────────────────────────────

const StatusChip = ({ nivel, icon: Icon }) => {
  const colorMap = {
    'CRÍTICO': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
    'ALTO': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40' },
    'MEDIO': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40' },
    'BAJO': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40' },
    'Riesgo Alto': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40' },
    'Riesgo Medio': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40' },
    'Riesgo Bajo': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40' },
  }
  
  const styles = colorMap[nivel] || colorMap['BAJO']
  
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${styles.bg} ${styles.text} border ${styles.border}`}>
      {Icon && <Icon className="w-3 h-3" />}
      {nivel}
    </span>
  )
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────

const chartContentStyle = (theme) => theme === 'dark'
  ? { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#e2e8f0' }
  : { background: '#ffffff', border: '1px solid rgba(2,6,23,0.06)', borderRadius: 8, color: '#0f172a' }

export default function Predicciones() {
  const { clustering, setClustering, theme } = useDashboardStore()
  const [siguiente, setSiguiente] = useState([])
  const [horariosPred, setHorariosPred] = useState([])
  const [loading, setLoading] = useState(false)
  const [filtroRiesgo, setFiltroRiesgo] = useState('todos')
  const [filtroTurno, setFiltroTurno] = useState('todos')
  const [sortBy, setSortBy] = useState('confianza')
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Cargar datos
  useEffect(() => {
    async function cargar() {
      setLoading(true)
      try {
        const [s, c, h] = await Promise.all([
          getPrediccionSiguiente(),
          getClusteringZonas(),
          getPrediccionHorarios(),
        ])
        setSiguiente(s.data.datos)
        setClustering(c.data.datos)
        setHorariosPred(h.data.datos.slice(0, 8))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    cargar()
  }, [])

  // Datos filtrados y ordenados
  const filteredData = useMemo(() => {
    let filtered = siguiente
    
    if (filtroRiesgo !== 'todos') {
      filtered = filtered.filter(p => {
        const zoneRisk = clustering.find(c => c.nombre_sector === p.zona_predicha)?.nivel_cluster
        return zoneRisk?.toLowerCase().includes(filtroRiesgo)
      })
    }
    
    return [...filtered].sort((a, b) => {
      if (sortBy === 'confianza') return b.confianza_pct - a.confianza_pct
      if (sortBy === 'zona') return a.zona_predicha.localeCompare(b.zona_predicha)
      return 0
    })
  }, [siguiente, filtroRiesgo, sortBy, clustering])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-slate-700 border-t-cyan-400 rounded-full mb-4" />
          <p className="text-cyan-400 text-sm font-medium">Ejecutando modelos de predicción IA...</p>
          <p className="text-slate-500 text-xs mt-2">Procesando K-Means, Random Forest y análisis bayesiano</p>
        </div>
      </div>
    )
  }

  const top5 = filteredData.slice(0, 5)
  const clusterColor = { 'Riesgo Alto': '#f43f5e', 'Riesgo Medio': '#f59e0b', 'Riesgo Bajo': '#22d3ee' }
  
  // Métricas de resumen
  const prediccionesAlto = siguiente.filter(p => clustering.find(c => c.nombre_sector === p.zona_predicha)?.nivel_cluster === 'Riesgo Alto').length
  const confianzaPromedio = Math.round(siguiente.reduce((a, b) => a + b.confianza_pct, 0) / siguiente.length)
  const zonasIdentificadas = new Set(siguiente.map(p => p.zona_predicha)).size
  const horariosAlerta = horariosPred.filter(h => h.nivel_alerta && ['CRÍTICO', 'ALTO'].includes(h.nivel_alerta)).length

  // Preparar datos para gráficos
  const distribucionHoraria = horariosPred.map(h => ({
    hora: `${h.dia_semana.slice(0, 3)} ${h.hora}h`,
    probabilidad: h.probabilidad_pct
  }))

  const dataSeveridad = [...clustering].sort((a, b) => b.severidad_media - a.severidad_media)

  const riesgoPorZona = Object.entries(
    clustering.reduce((acc, zone) => {
      acc[zone.nivel_cluster] = (acc[zone.nivel_cluster] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  return (
    <div className="p-6 space-y-6">
      {/* Header mejorado */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-7 h-7 text-cyan-400" />
            Predicciones IA Avanzadas
          </h2>
          <p className="text-sm text-slate-400">Análisis predictivo con K-Means, Random Forest y estadística bayesiana</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 hover:border-cyan-500/50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={AlertCircle}
          label="Predicciones Riesgo Alto"
          value={prediccionesAlto}
          color="rose"
          trend={`${Math.round(prediccionesAlto/siguiente.length*100)}% del total`}
          tooltip="Predicciones con riesgo clasificado como ALTO"
        />
        <StatCard 
          icon={TrendingUp}
          label="Confianza Promedio"
          value={confianzaPromedio}
          unit="%"
          color="amber"
          trend="Confiabilidad media de modelos"
          tooltip="Precisión promedio del Random Forest"
        />
        <StatCard 
          icon={MapPin}
          label="Zonas Identificadas"
          value={zonasIdentificadas}
          color="purple"
          trend={`De ${siguiente.length} predicciones`}
          tooltip="Cantidad de sectores únicos analizados"
        />
        <StatCard 
          icon={Clock}
          label="Franjas Críticas"
          value={horariosAlerta}
          unit="/8"
          color="rose"
          trend="Probabilidad > 75%"
          tooltip="Horas con mayor probabilidad de incidentes"
        />
      </div>

      {/* Controles de filtrado */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <select 
          value={filtroRiesgo}
          onChange={(e) => setFiltroRiesgo(e.target.value)}
          className="text-xs px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-300 cursor-pointer hover:border-cyan-500/50 transition-colors"
        >
          <option value="todos">Todos los riesgos</option>
          <option value="alto">Solo Riesgo Alto</option>
          <option value="medio">Solo Riesgo Medio</option>
          <option value="bajo">Solo Riesgo Bajo</option>
        </select>
        
        <select 
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="text-xs px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-slate-300 cursor-pointer hover:border-cyan-500/50 transition-colors"
        >
          <option value="confianza">Ordenar por Confianza</option>
          <option value="zona">Ordenar por Zona</option>
        </select>

        <button
          onClick={() => exportarCSV(siguiente.slice(0, 20), 'predicciones_top20')}
          className="ml-auto text-xs px-3 py-1.5 rounded border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-1"
        >
          <Download className="w-3 h-3" />
          Exportar CSV
        </button>
      </div>

      {/* Top 5 Predicciones destacadas */}
      <div className="bg-gradient-to-r from-rose-900/20 to-rose-900/5 border border-rose-500/20 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-semibold text-rose-300">Predicciones de Mayor Prioridad</h3>
          </div>
          <StatusChip nivel={top5.length > 0 ? 'CRÍTICO' : 'BAJO'} />
        </div>
        <div className="space-y-2">
          {top5.map((p, i) => {
            const zoneRisk = clustering.find(c => c.nombre_sector === p.zona_predicha)?.nivel_cluster || 'Desconocido'
            const riskColor = clusterColor[zoneRisk] || '#22d3ee'
            return (
              <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-lg p-3 hover:border-rose-500/40 transition-all">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex w-6 h-6 items-center justify-center bg-rose-500/20 text-rose-400 text-xs font-bold rounded-full">#{i+1}</span>
                  <span className="text-xs font-semibold text-slate-400">
                    {p.fecha ? `${formatDateDDMMYYYY(p.fecha)} • ` : ''}{p.dia_semana}
                  </span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs font-mono text-slate-300">{p.hora}:00</span>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-300">{p.turno}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span style={{ background: `${riskColor}20`, color: riskColor }} className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                      style={{ borderColor: `${riskColor}40` }}>
                      {p.zona_predicha}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500" style={{ width: `${p.confianza_pct}%` }} />
                    </div>
                    <span className="text-xs font-mono font-bold text-green-400 w-10 text-right">{p.confianza_pct}%</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Gráficos principales en 2x2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución horaria */}
        <div className="bg-slate-900/40 border border-blue-500/20 rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Distribución Temporal de Riesgo
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={distribucionHoraria}>
              <defs>
                <linearGradient id="colorHora" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="hora" tick={{ fill: '#64748b', fontSize: 10 }} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
              <Tooltip 
                contentStyle={chartContentStyle(theme)}
                wrapperStyle={chartContentStyle(theme)}
                formatter={(value) => [`${value}%`, 'Probabilidad']}
              />
              <Area type="monotone" dataKey="probabilidad" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHora)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Severidad por sector */}
        <div className="bg-slate-900/40 border border-purple-500/20 rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-purple-400 mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Severidad por Sector
          </h3>
          <ResponsiveContainer width="100%" height={240}>
              <BarChart data={dataSeveridad}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="nombre_sector" tick={{ fill: '#64748b', fontSize: 9 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip contentStyle={chartContentStyle(theme)} wrapperStyle={chartContentStyle(theme)} />
              <Bar dataKey="severidad_media" radius={[8,8,0,0]} name="Severidad media">
                {dataSeveridad.map((item, i) => (
                  <Cell key={i} fill={clusterColor[item.nivel_cluster] || '#22d3ee'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Análisis espacial */}
        <div className="bg-slate-900/40 border border-amber-500/20 rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Análisis Espacial de Riesgo
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={clustering.slice(0, 8)}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="nombre_sector" tick={{ fill: '#94a3b8', fontSize: 9 }} />
              <PolarRadiusAxis tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar name="Severidad" dataKey="severidad_media" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Clasificación de zonas */}
        <div className="bg-slate-900/40 border border-rose-500/20 rounded-xl p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-rose-400 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Clasificación de Zonas
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={riesgoPorZona}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riesgoPorZona.map((entry, i) => (
                  <Cell key={i} fill={Object.values(clusterColor)[i] || '#22d3ee'} />
                ))}
              </Pie>
              <Tooltip contentStyle={chartContentStyle(theme)} wrapperStyle={chartContentStyle(theme)} formatter={(value) => [`${value} zonas`, 'Cantidad']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla interactiva mejorada */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900/50 to-slate-900/20 flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-200">Listado Completo de Predicciones</p>
            <p className="text-xs text-slate-500 mt-1">Total de {filteredData.length} predicciones ({siguiente.length} sin filtrar)</p>
          </div>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-900/40 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider text-slate-400 font-semibold">#</th>
                <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Fecha/Hora</th>
                <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Turno</th>
                <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Zona Predicha</th>
                <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Nivel de Riesgo</th>
                <th className="px-5 py-3 text-left text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Confianza</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((p, i) => {
                const zoneRisk = clustering.find(c => c.nombre_sector === p.zona_predicha)?.nivel_cluster || 'Desconocido'
                const riskColor = clusterColor[zoneRisk] || '#22d3ee'
                return (
                  <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-900/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-slate-500">{i+1}</td>
                    <td className="px-5 py-3 text-slate-300">
                      <span className="font-medium">{p.dia_semana}</span>
                      <span className="text-slate-500 mx-1">•</span>
                      <span className="font-mono">{p.hora}:00</span>
                    </td>
                    <td className="px-5 py-3 text-slate-400">{p.turno}</td>
                    <td className="px-5 py-3 font-semibold text-cyan-400">{p.zona_predicha}</td>
                    <td className="px-5 py-3">
                      <StatusChip nivel={zoneRisk} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500" style={{ width: `${p.confianza_pct}%` }} />
                        </div>
                        <span className="font-mono font-bold text-green-400 w-10">{p.confianza_pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}