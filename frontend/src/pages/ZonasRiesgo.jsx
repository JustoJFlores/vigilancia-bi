// frontend/src/pages/ZonasRiesgo.jsx
import { useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, AreaChart, Area } from 'recharts'
import useDashboardStore from '../store/useDashboardStore'
import { getCuboZonasRiesgo, getClusteringZonas } from '../services/api'
import { exportarCSV } from '../services/exportar'

const badgeColor = {
  'ZONA ROJA':    'bg-red-500/20 text-red-400 border-red-500/30',
  'ZONA NARANJA': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'ZONA AMARILLA':'bg-green-500/20 text-green-400 border-green-500/30',
}

const clusterColor = {
  'Riesgo Alto':  'bg-red-500/20 text-red-400',
  'Riesgo Medio': 'bg-yellow-500/20 text-yellow-400',
  'Riesgo Bajo':  'bg-green-500/20 text-green-400',
}

const chartTooltipStyle = {
  background: '#0f172a',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: 16,
  color: '#e2e8f0',
  boxShadow: '0 24px 60px rgba(2, 6, 23, 0.45)',
}

function PanelCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/70 p-5 shadow-2xl shadow-slate-950/25 backdrop-blur-sm ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.10),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.08),_transparent_30%)]" />
      <div className="relative mb-4">
        <p className="text-[10px] uppercase tracking-[0.35em] text-slate-500">{title}</p>
        {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

function StatCard({ label, value, sub, tone = 'cyan' }) {
  const tones = {
    cyan: 'from-cyan-500/20 via-cyan-500/5 to-transparent text-cyan-300 border-cyan-500/20',
    red: 'from-red-500/20 via-red-500/5 to-transparent text-red-300 border-red-500/20',
    yellow: 'from-amber-500/20 via-amber-500/5 to-transparent text-amber-300 border-amber-500/20',
    green: 'from-emerald-500/20 via-emerald-500/5 to-transparent text-emerald-300 border-emerald-500/20',
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-slate-950/60 p-5 shadow-lg shadow-slate-950/20 backdrop-blur-sm ${tones[tone]}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${tones[tone].split(' ')[0]} opacity-80`} />
      <div className="relative">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{label}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-100">{value}</p>
        <p className="mt-2 text-xs leading-5 text-slate-500">{sub}</p>
      </div>
    </div>
  )
}

export default function ZonasRiesgo() {
  const { zonasRiesgo, clustering, setZonasRiesgo, setClustering, loading, setLoading } = useDashboardStore()

    useEffect(() => {
    async function cargar() {
        setLoading(true)
        try {
        const [z, c] = await Promise.all([getCuboZonasRiesgo(), getClusteringZonas()])
        setZonasRiesgo(z.data.datos)
        setClustering(c.data.datos)
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }
    // Siempre cargar ambos al entrar a esta página
    cargar()
    }, [])

  if (loading) return <div className="flex-1 flex items-center justify-center p-12"><p className="text-cyan-400 animate-pulse text-sm tracking-[0.3em] uppercase">Cargando datos...</p></div>

  const totalIncidentes = zonasRiesgo.reduce((sum, zona) => sum + zona.total_incidentes, 0)
  const totalViolentos = zonasRiesgo.reduce((sum, zona) => sum + zona.delitos_violentos, 0)
  const totalCapturados = zonasRiesgo.reduce((sum, zona) => sum + zona.capturados, 0)
  const zonasCriticas = zonasRiesgo.filter(z => z.clasificacion === 'ZONA ROJA').length
  const avgSeveridad = zonasRiesgo.length ? (zonasRiesgo.reduce((sum, zona) => sum + Number(zona.severidad_promedio || 0), 0) / zonasRiesgo.length).toFixed(2) : '0.00'
  const topZona = [...zonasRiesgo].sort((a, b) => b.total_incidentes - a.total_incidentes)[0]

  return (
    <div className="relative min-h-full overflow-hidden p-6 lg:p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.10),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.10),_transparent_24%),linear-gradient(180deg,_rgba(15,23,42,0.35),_transparent_55%)]" />

      <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(6,182,212,0.12),_transparent_35%,_rgba(168,85,247,0.08))]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-cyan-300">
              Análisis territorial
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-100 lg:text-3xl">Zonas de riesgo</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Ranking de sectores, comparación de severidad y lectura rápida del clustering K-Means para priorizar intervención.
            </p>
          </div>
          <button
            onClick={() => exportarCSV(zonasRiesgo, 'zonas_riesgo')}
            className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.25em] text-cyan-200 transition-colors hover:bg-cyan-500/20 hover:text-white"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard label="Zonas analizadas" value={zonasRiesgo.length} sub="Sectores con datos consolidados" tone="cyan" />
        <StatCard label="Incidentes totales" value={totalIncidentes} sub="Suma general de eventos" tone="red" />
        <StatCard label="Severidad media" value={avgSeveridad} sub="Promedio por sector" tone="yellow" />
        <StatCard label="Zonas críticas" value={zonasCriticas} sub="Clasificación ZONA ROJA" tone="green" />
        <StatCard label="Capturas" value={totalCapturados} sub="Personas o incidentes capturados" tone="cyan" />
      </div>

      {topZona && (
        <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-slate-950/70 p-5 shadow-2xl shadow-slate-950/25 backdrop-blur-sm">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(248,113,113,0.16),_transparent_28%),linear-gradient(135deg,_rgba(248,113,113,0.10),_transparent_60%)]" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-red-300/80">Zona dominante</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-100">{topZona.nombre_sector}</h3>
              <p className="mt-1 text-sm text-slate-400">{topZona.colonia}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Incidentes</p>
                <p className="mt-2 text-lg font-semibold text-cyan-300">{topZona.total_incidentes}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Severidad</p>
                <p className="mt-2 text-lg font-semibold text-amber-300">{topZona.severidad_promedio}</p>
              </div>
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Clasificación</p>
                <p className="mt-2 text-sm font-semibold text-slate-100">{topZona.clasificacion}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard
          title="Delitos violentos vs capturados"
          subtitle="Comparativa por sector para ver equilibrio entre incidencia y respuesta"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={zonasRiesgo} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="nombre_sector" axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={chartTooltipStyle} wrapperStyle={chartTooltipStyle} />
              <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
              <Bar dataKey="delitos_violentos" fill="#fb7185" radius={[10, 10, 0, 0]} name="Violentos" barSize={18} />
              <Bar dataKey="capturados" fill="#22d3ee" radius={[10, 10, 0, 0]} name="Capturados" barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </PanelCard>

        <PanelCard
          title="Severidad por zona"
          subtitle="Intensidad del riesgo y priorización visual"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={zonasRiesgo} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="severityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="nombre_sector" axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={chartTooltipStyle} wrapperStyle={chartTooltipStyle} />
              <Area type="monotone" dataKey="severidad_promedio" stroke="#f97316" strokeWidth={3} fill="url(#severityFill)" dot={{ fill: '#fdba74', stroke: '#f97316', strokeWidth: 2, r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </PanelCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard
          title="Ranking de zonas por incidentes"
          subtitle="Orden visual rápido para inspección operativa"
          className="xl:col-span-1"
        >
          <div className="overflow-hidden rounded-2xl border border-slate-800/70">
            <table className="w-full text-sm">
              <thead className="bg-slate-900/80">
                <tr className="border-b border-slate-800">
                  {['Sector','Colonia','Incidentes','Severidad prom.','Delitos violentos','Capturados','Clasificación'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-[0.25em] text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zonasRiesgo.map((z, i) => (
                  <tr key={i} className="border-b border-slate-800/50 bg-slate-950/40 transition-colors hover:bg-slate-800/20">
                    <td className="px-4 py-3 font-medium text-slate-100">{z.nombre_sector}</td>
                    <td className="px-4 py-3 text-slate-400">{z.colonia}</td>
                    <td className="px-4 py-3 font-mono text-cyan-300">{z.total_incidentes}</td>
                    <td className="px-4 py-3 font-mono text-orange-300">{z.severidad_promedio}</td>
                    <td className="px-4 py-3 font-mono text-rose-300">{z.delitos_violentos}</td>
                    <td className="px-4 py-3 font-mono text-emerald-300">{z.capturados}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${badgeColor[z.clasificacion]}`}>
                        {z.clasificacion}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelCard>

        <PanelCard
          title="Clustering K-Means"
          subtitle="Nivel de riesgo y hora pico por sector"
          className="xl:col-span-1"
        >
          {clustering.length === 0 ? (
            <p className="rounded-2xl border border-slate-800/70 bg-slate-900/70 py-10 text-center text-xs tracking-[0.25em] text-slate-500">Cargando clustering...</p>
          ) : (
            <div className="space-y-3">
              {clustering.map((z, i) => (
                <div key={i} className="rounded-2xl border border-slate-800/70 bg-slate-900/60 p-4 transition-colors hover:border-slate-700 hover:bg-slate-800/30">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-100">{z.nombre_sector}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.25em] text-slate-500">
                        Hora pico {z.hora_pico}:00 · {z.total_delitos} delitos
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${clusterColor[z.nivel_cluster]}`}>
                        {z.nivel_cluster}
                      </span>
                      <p className="mt-2 text-[10px] text-slate-500">Severidad {z.severidad_media}</p>
                    </div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        z.nivel_cluster === 'Riesgo Alto'
                          ? 'bg-gradient-to-r from-red-400 to-rose-500'
                          : z.nivel_cluster === 'Riesgo Medio'
                            ? 'bg-gradient-to-r from-amber-400 to-orange-500'
                            : 'bg-gradient-to-r from-emerald-400 to-cyan-400'
                      }`}
                      style={{ width: `${Math.min(Number(z.severidad_media || 0) * 10, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </PanelCard>
      </div>
    </div>
  )
}