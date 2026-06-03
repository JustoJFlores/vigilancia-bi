// frontend/src/pages/Dashboard.jsx
import { useEffect, useState } from 'react'
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts'
import useDashboardStore from '../store/useDashboardStore'
import { formatDateDDMMYYYY } from '../utils/date'
import { getCuboZonasRiesgo, getCuboHorarios, getCuboCamaras, getResumenPredicciones } from '../services/api'
import KPICard from '../components/layout/KPICard'

const chartTooltipStyle = (theme) => theme === 'dark'
  ? {
      background: '#0f172a',
      border: '1px solid rgba(148, 163, 184, 0.2)',
      borderRadius: 16,
      color: '#e2e8f0',
      boxShadow: '0 24px 60px rgba(2, 6, 23, 0.45)',
    }
  : {
      background: '#ffffff',
      border: '1px solid rgba(203, 213, 225, 0.9)',
      borderRadius: 16,
      color: '#0f172a',
      boxShadow: '0 20px 45px rgba(15, 23, 42, 0.12)',
    }

function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/65 p-5 shadow-2xl shadow-slate-950/25 backdrop-blur-sm ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.10),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.10),_transparent_30%)]" />
      <div className="relative mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">{title}</p>
          {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
        </div>
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

export default function Dashboard() {
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null)
  const {
    zonasRiesgo, horarios, camaras, resumen,
    setZonasRiesgo, setHorarios, setCamaras, setResumen,
    loading, setLoading, theme
  } = useDashboardStore()

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      try {
        const [z, h, c, r] = await Promise.all([
          getCuboZonasRiesgo(),
          getCuboHorarios(),
          getCuboCamaras(),
          getResumenPredicciones(),
        ])
        setZonasRiesgo(z.data.datos)
        setHorarios(h.data.datos)
        setCamaras(c.data.datos)
        setResumen(r.data)
        setUltimaActualizacion(new Date().toLocaleTimeString('es-MX'))
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    if (!zonasRiesgo.length) cargar()
  }, [])

  // Expose a re-fetch function for the Refresh button
  async function refrescarDatos() {
    setLoading(true)
    try {
      const [z, h, c, r] = await Promise.all([
        getCuboZonasRiesgo(),
        getCuboHorarios(),
        getCuboCamaras(),
        getResumenPredicciones(),
      ])
      setZonasRiesgo(z.data.datos)
      setHorarios(h.data.datos)
      setCamaras(c.data.datos)
      setResumen(r.data)
      setUltimaActualizacion(new Date().toLocaleTimeString('es-MX'))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div className="flex-1 flex items-center justify-center">
      <p className="text-cyan-400 animate-pulse text-sm tracking-widest">Cargando datos...</p>
    </div>
  )

  const totalIncidentes  = zonasRiesgo.reduce((s, z) => s + z.total_incidentes, 0)
  const camarasActivas   = camaras.filter(c => c.estado_operativo === 'Activa').length
  const camarasCriticas  = camaras.filter(c => c.accion_recomendada !== 'NORMAL').length
  const zonasCriticas    = zonasRiesgo.filter(z => z.clasificacion === 'ZONA ROJA').length
  const horariosTop      = horarios.slice(0, 10)
  const maxIncidentes    = Math.max(...zonasRiesgo.map(z => z.total_incidentes), 0)
  const maxSeveridad     = Math.max(...zonasRiesgo.map(z => z.severidad_promedio), 0)
  const confianzaPct     = resumen?.proximo_delito_predicho?.confianza_pct ?? 0

  return (
    <div className="relative min-h-full overflow-hidden p-6 lg:p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.10),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.10),_transparent_24%),linear-gradient(180deg,_rgba(15,23,42,0.35),_transparent_55%)]" />
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(6,182,212,0.12),_transparent_35%,_rgba(168,85,247,0.08))]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-cyan-300">
              Centro de monitoreo
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-100 lg:text-3xl">Panel general</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Resumen en tiempo real del sistema de vigilancia con foco en riesgo, severidad y proyección de alertas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {ultimaActualizacion && (
              <span className="rounded-full border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-[10px] uppercase tracking-[0.3em] text-slate-400">
                Actualizado {ultimaActualizacion}
              </span>
            )}
            <button
              onClick={() => { refrescarDatos() }}
              disabled={loading}
              className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.25em] text-cyan-200 transition-colors hover:bg-cyan-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Refrescar datos
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KPICard label="Total incidentes"  value={totalIncidentes}  sub="Registrados en el sistema"    color="red"    />
        <KPICard label="Zonas críticas"    value={zonasCriticas}    sub="Clasificación ZONA ROJA"      color="yellow" />
        <KPICard label="Cámaras activas"   value={`${camarasActivas}/${camaras.length}`} sub="En línea ahora" color="green"  />
        <KPICard label="Requieren atención" value={camarasCriticas} sub="Cámaras con alertas"          color="purple" />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

        {/* Incidentes por zona */}
        <ChartCard
          title="Incidentes por zona"
          subtitle="Distribución comparativa de los puntos con mayor actividad"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={zonasRiesgo} layout="vertical" margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="4 4" horizontal={false} />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                domain={[0, maxIncidentes || 'dataMax']}
              />
              <YAxis
                dataKey="nombre_sector"
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                width={128}
              />
              <Tooltip contentStyle={chartTooltipStyle(theme)} wrapperStyle={chartTooltipStyle(theme)} cursor={{ fill: 'rgba(14, 165, 233, 0.06)' }} />
              <Bar dataKey="total_incidentes" radius={[0, 14, 14, 0]} barSize={16}>
                {zonasRiesgo.map((_, index) => (
                  <Cell
                    key={`incidentes-${index}`}
                    fill={index % 2 === 0 ? '#06b6d4' : '#38bdf8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Severidad promedio por zona */}
        <ChartCard
          title="Severidad promedio por zona"
          subtitle="Intensidad media de riesgo para priorizar atención"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={zonasRiesgo} margin={{ top: 8, right: 12, left: 4, bottom: 8 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="nombre_sector"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
              />
              <YAxis
                domain={[0, Math.max(10, Math.ceil(maxSeveridad))]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip contentStyle={chartTooltipStyle(theme)} wrapperStyle={chartTooltipStyle(theme)} cursor={{ fill: 'rgba(244, 63, 94, 0.06)' }} />
              <Bar dataKey="severidad_promedio" radius={[14, 14, 0, 0]} barSize={24}>
                {zonasRiesgo.map((zona, index) => {
                  const base = zona.severidad_promedio >= 7 ? '#fb7185' : zona.severidad_promedio >= 4 ? '#f59e0b' : '#a78bfa'
                  return <Cell key={`severidad-${index}`} fill={base} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Probabilidad por horario */}
        <ChartCard
          title="Probabilidad por horario"
          subtitle="Top 10 ventanas con mayor probabilidad de incidencia"
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={horariosTop} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="probabilidadFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey={(d) => `${d.dia_semana} ${d.hora}h`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#cbd5e1', fontSize: 10 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip contentStyle={chartTooltipStyle(theme)} wrapperStyle={chartTooltipStyle(theme)} cursor={{ stroke: 'rgba(167, 139, 250, 0.18)', strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="probabilidad_pct"
                stroke="#a78bfa"
                strokeWidth={3}
                fill="url(#probabilidadFill)"
                dot={{ fill: '#e9d5ff', stroke: '#a78bfa', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>

      {/* Predicción resumida */}
      {resumen?.proximo_delito_predicho && (
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-slate-950/70 p-5 shadow-2xl shadow-slate-950/25 backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.16),_transparent_28%),linear-gradient(135deg,_rgba(245,158,11,0.10),_transparent_60%)]" />
          <div className="relative mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-amber-300/80">Predicción IA</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-100">Próximo evento de riesgo</h3>
            </div>
            <div className="rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
              Confianza {confianzaPct}%
            </div>
          </div>
          <div className="relative grid gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Zona predicha</p>
              <p className="mt-2 text-sm font-semibold text-amber-300">{resumen.proximo_delito_predicho.zona_predicha}</p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 md:col-span-2">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Día y hora</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">
                {resumen.proximo_delito_predicho.fecha ? (
                  <>{formatDateDDMMYYYY(resumen.proximo_delito_predicho.fecha)} · {resumen.proximo_delito_predicho.dia_semana} · {resumen.proximo_delito_predicho.hora}:00</>
                ) : (
                  <>{resumen.proximo_delito_predicho.dia_semana} · {resumen.proximo_delito_predicho.hora}:00</>
                )}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Turno</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">{resumen.proximo_delito_predicho.turno}</p>
            </div>
          </div>
          <div className="relative mt-5">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-slate-500">
              <span>Confianza del modelo</span>
              <span>{confianzaPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 transition-all duration-500"
                style={{ width: `${Math.min(confianzaPct, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}