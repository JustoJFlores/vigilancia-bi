// frontend/src/pages/Horarios.jsx
import { useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts'
import useDashboardStore from '../store/useDashboardStore'
import { formatDateDDMMYYYY } from '../utils/date'
import { getPrediccionHorarios } from '../services/api'

const alertaColor = { ALTO: '#f43f5e', MEDIO: '#f59e0b', BAJO: '#22d3ee' }
const alertaBadge = {
  ALTO: 'bg-red-500/15 text-red-300 border-red-500/30',
  MEDIO: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  BAJO: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
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
    cyan: 'from-cyan-500/20 via-cyan-500/5 to-transparent border-cyan-500/20',
    purple: 'from-violet-500/20 via-violet-500/5 to-transparent border-violet-500/20',
    red: 'from-red-500/20 via-red-500/5 to-transparent border-red-500/20',
    amber: 'from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/20',
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

export default function Horarios() {
  const { horarios, setHorarios, loading, setLoading } = useDashboardStore()

  useEffect(() => {
    async function cargar() {
        setLoading(true)
        try {
        // Usamos el endpoint de predicciones que sí trae nivel_alerta
        const [h] = await Promise.all([getPrediccionHorarios()])
        setHorarios(h.data.datos)
        } catch(e) { console.error(e) }
        finally { setLoading(false) }
    }
    cargar()
    }, [])

  if (loading) return <div className="flex-1 flex items-center justify-center p-12"><p className="text-cyan-400 animate-pulse text-sm tracking-[0.3em] uppercase">Cargando datos...</p></div>

  const porTurno = ['Madrugada','Mañana','Tarde','Noche'].map(turno => ({
    turno,
    total: horarios.filter(h => h.turno === turno).reduce((s, h) => s + (h.total || 0), 0)
  }))

  const top10 = horarios.slice(0, 10)
  const totalDelitos = horarios.reduce((sum, h) => sum + Number(h.total || 0), 0)
  const maxProbabilidad = horarios.length ? Math.max(...horarios.map(h => Number(h.probabilidad_pct || 0))) : 0
  const alertasAltas = horarios.filter(h => h.nivel_alerta === 'ALTO').length
  const promedioProbabilidad = horarios.length
    ? (horarios.reduce((sum, h) => sum + Number(h.probabilidad_pct || 0), 0) / horarios.length).toFixed(2)
    : '0.00'
  const franjaCritica = top10[0]

  const tendenciaPorHora = Array.from({ length: 24 }, (_, hora) => {
    const registros = horarios.filter(h => Number(h.hora) === hora)
    const total = registros.reduce((sum, h) => sum + Number(h.total || 0), 0)
    const prob = registros.length
      ? registros.reduce((sum, h) => sum + Number(h.probabilidad_pct || 0), 0) / registros.length
      : 0
    return {
      hora: `${String(hora).padStart(2, '0')}:00`,
      total,
      probabilidad: Number(prob.toFixed(2)),
    }
  })

  return (
    <div className="relative min-h-full overflow-hidden p-6 lg:p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.10),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.10),_transparent_24%),linear-gradient(180deg,_rgba(15,23,42,0.35),_transparent_55%)]" />

      <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(6,182,212,0.12),_transparent_35%,_rgba(168,85,247,0.08))]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-cyan-300">
              Inteligencia temporal
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-100 lg:text-3xl">Análisis de horarios</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Identificación de franjas críticas, evolución por hora y lectura detallada de fechas para mejorar la respuesta operativa.
            </p>
          </div>
          {franjaCritica && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.25em] text-red-300/80">Franja crítica</p>
              <p className="mt-2 text-sm font-semibold text-slate-100">
                {franjaCritica.fecha ? `${formatDateDDMMYYYY(franjaCritica.fecha)} · ` : ''}
                {franjaCritica.dia_semana} · {franjaCritica.hora}:00
              </p>
              <p className="mt-1 text-xs text-red-300">{franjaCritica.probabilidad_pct}% probabilidad</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Delitos totales" value={totalDelitos} sub="Incidencias acumuladas" tone="red" />
        <StatCard label="Prob. real máxima" value={`${maxProbabilidad}%`} sub="Franja con mayor ocurrencia histórica" tone="purple" />
        <StatCard label="Alertas altas" value={alertasAltas} sub="Franja de prioridad alta" tone="amber" />
        <StatCard label="Prob. real promedio" value={`${promedioProbabilidad}%`} sub="Media de ocurrencia por franja" tone="cyan" />
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {porTurno.map(t => (
          <div key={t.turno} className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 text-center shadow-lg shadow-slate-950/20">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/15 via-violet-500/5 to-transparent" />
            <p className="relative text-[10px] uppercase tracking-[0.3em] text-slate-500">{t.turno}</p>
            <p className="relative mt-1 text-3xl font-semibold text-violet-300">{t.total}</p>
            <p className="relative mt-1 text-xs text-slate-500">delitos registrados</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <PanelCard
          title="Top 10 franjas por probabilidad real"
          subtitle="Fecha, día y hora priorizados por ocurrencia empírica"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={top10} layout="vertical" margin={{ top: 8, right: 14, left: 6, bottom: 8 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="4 4" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
              <YAxis
                dataKey={(d) => `${d.fecha ? `${formatDateDDMMYYYY(d.fecha)} · ` : ''}${d.dia_semana} ${d.hora}h`}
                type="category"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#cbd5e1', fontSize: 10 }}
                width={165}
              />
              <Tooltip contentStyle={chartTooltipStyle} wrapperStyle={chartTooltipStyle} />
              <Bar dataKey="probabilidad_pct" radius={[0, 12, 12, 0]} name="Probabilidad real %" barSize={16}>
                {top10.map((d, i) => (
                  <Cell key={i} fill={alertaColor[d.nivel_alerta] || '#22d3ee'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PanelCard>

        <PanelCard
          title="Tendencia por hora"
          subtitle="Comparativa entre volumen de delitos y probabilidad real media"
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={tendenciaPorHora} margin={{ top: 8, right: 14, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="4 4" vertical={false} />
              <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 10 }} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} unit="%" />
              <Tooltip contentStyle={chartTooltipStyle} wrapperStyle={chartTooltipStyle} />
              <Area yAxisId="left" type="monotone" dataKey="total" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.12} strokeWidth={2.4} />
              <Line yAxisId="right" type="monotone" dataKey="probabilidad" stroke="#a78bfa" strokeWidth={2.6} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </PanelCard>
      </div>

      <PanelCard
        title="Detalle por horario"
        subtitle="Lectura rápida de fecha, día, turno, probabilidad real y nivel de alerta"
      >
        <div className="overflow-hidden rounded-2xl border border-slate-800/70">
          <div className="overflow-y-auto max-h-[28rem]">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur">
                <tr className="border-b border-slate-800">
                  {['Fecha','Día','Hora','Turno','Delitos','Prob. real %','Alerta'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-[0.25em] text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horarios.map((h, i) => (
                  <tr key={i} className="border-b border-slate-800/40 bg-slate-950/40 transition-colors hover:bg-slate-800/20">
                    <td className="px-3 py-2 font-medium text-slate-200">{h.fecha ? formatDateDDMMYYYY(h.fecha) : 'Sin fecha'}</td>
                    <td className="px-3 py-2 text-slate-400">{h.dia_semana}</td>
                    <td className="px-3 py-2 font-mono text-slate-300">{String(h.hora).padStart(2, '0')}:00</td>
                    <td className="px-3 py-2 text-slate-400">{h.turno}</td>
                    <td className="px-3 py-2 font-mono text-cyan-300">{h.total}</td>
                    <td className="px-3 py-2 font-mono text-violet-300">{h.probabilidad_pct}%</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${alertaBadge[h.nivel_alerta] || 'bg-slate-500/10 text-slate-300 border-slate-500/30'}`}>
                        {h.nivel_alerta}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PanelCard>
    </div>
  )
}