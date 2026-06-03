// frontend/src/pages/Camaras.jsx
import { useEffect, useMemo, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import useDashboardStore from '../store/useDashboardStore'
import { getCuboCamaras } from '../services/api'
import { exportarCSV } from '../services/exportar'

const estadoColor = { Activa: '#22d3ee', Inactiva: '#f43f5e', Mantenimiento: '#f59e0b' }
const accionBadge = {
  NORMAL: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  'CRITICA — Reemplazar': 'bg-red-500/15 text-red-300 border-red-500/30',
  'ATENCION — Revisar': 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  'MEJORAR — Zona critica sin IA': 'bg-orange-500/15 text-orange-300 border-orange-500/30',
}

const chartTooltipStyle = (theme) => theme === 'dark' ? {
  background: '#0f172a',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: 16,
  color: '#e2e8f0',
  boxShadow: '0 24px 60px rgba(2, 6, 23, 0.45)',
} : {
  background: '#ffffff',
  border: '1px solid rgba(2,6,23,0.06)',
  borderRadius: 16,
  color: '#0f172a',
  boxShadow: '0 12px 30px rgba(2,6,23,0.06)',
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
    green: 'from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/20',
    amber: 'from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/20',
    red: 'from-red-500/20 via-red-500/5 to-transparent border-red-500/20',
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

export default function Camaras() {
  const { camaras, setCamaras, loading, setLoading, theme } = useDashboardStore()
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [filtroAccion, setFiltroAccion] = useState('Todas')
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    async function cargar() {
      setLoading(true)
      try {
        const c = await getCuboCamaras()
        setCamaras(c.data.datos)
      } catch(e) { console.error(e) }
      finally { setLoading(false) }
    }
    if (!camaras.length) cargar()
  }, [])

  if (loading) return <div className="flex-1 flex items-center justify-center p-12"><p className="text-cyan-400 animate-pulse text-sm tracking-[0.3em] uppercase">Cargando datos...</p></div>

  const porEstado = useMemo(
    () => ['Activa', 'Inactiva', 'Mantenimiento'].map(e => ({
      name: e,
      value: camaras.filter(c => c.estado_operativo === e).length,
    })).filter(e => e.value > 0),
    [camaras],
  )

  const conIA = camaras.filter(c => c.tiene_ia).length
  const sinIA = camaras.filter(c => !c.tiene_ia).length
  const criticas = camaras.filter(c => c.accion_recomendada !== 'NORMAL')
  const totalCamaras = camaras.length
  const promedioRespuesta = totalCamaras
    ? (camaras.reduce((sum, c) => sum + Number(c.tiempo_resp_promedio || 0), 0) / totalCamaras).toFixed(2)
    : '0.00'
  const iaPct = totalCamaras ? Math.round((conIA / totalCamaras) * 100) : 0

  const acciones = useMemo(() => {
    const conteo = {}
    camaras.forEach((c) => {
      conteo[c.accion_recomendada] = (conteo[c.accion_recomendada] || 0) + 1
    })
    return conteo
  }, [camaras])

  const camarasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return camaras.filter((c) => {
      const matchEstado = filtroEstado === 'Todos' || c.estado_operativo === filtroEstado
      const matchAccion = filtroAccion === 'Todas' || c.accion_recomendada === filtroAccion
      const target = `${c.codigo_camara} ${c.modelo} ${c.nombre_sector}`.toLowerCase()
      const matchBusqueda = !q || target.includes(q)
      return matchEstado && matchAccion && matchBusqueda
    })
  }, [camaras, filtroEstado, filtroAccion, busqueda])

  const topTiempoRespuesta = [...camaras]
    .sort((a, b) => Number(b.tiempo_resp_promedio || 0) - Number(a.tiempo_resp_promedio || 0))
    .slice(0, 8)
    .map((c) => ({
      codigo: c.codigo_camara,
      sector: c.nombre_sector,
      tiempo: Number(c.tiempo_resp_promedio || 0),
      estado: c.estado_operativo,
    }))

  return (
    <div className="relative min-h-full overflow-hidden p-6 lg:p-8 space-y-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.10),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.10),_transparent_24%),linear-gradient(180deg,_rgba(15,23,42,0.35),_transparent_55%)]" />

      <div className="relative overflow-hidden rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-2xl shadow-slate-950/30 backdrop-blur-sm">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,_rgba(6,182,212,0.12),_transparent_35%,_rgba(168,85,247,0.08))]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.35em] text-cyan-300">
              Supervisión de dispositivos
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-100 lg:text-3xl">Estado de cámaras</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Estado operativo, cobertura IA, tiempos de respuesta y acciones prioritarias para mantener la red de vigilancia saludable.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFiltroAccion('Todas')}
              className="rounded-full border border-slate-700/70 bg-slate-900/60 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-slate-300 transition-colors hover:border-cyan-500/30 hover:text-cyan-200"
            >
              Ver todo
            </button>
            <button
              onClick={() => setFiltroAccion('CRITICA — Reemplazar')}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-red-300 transition-colors hover:bg-red-500/20"
            >
              Solo críticas
            </button>
            <button
              onClick={() => exportarCSV(camaras, 'camaras')}
              className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.25em] text-cyan-200 transition-colors hover:bg-cyan-500/20 hover:text-white"
            >
              Exportar CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <StatCard label="Total cámaras" value={totalCamaras} sub="Dispositivos registrados" tone="cyan" />
        <StatCard label="Con IA" value={conIA} sub={`${iaPct}% de la red`} tone="green" />
        <StatCard label="Sin IA" value={sinIA} sub="Pendiente de analítica automática" tone="amber" />
        <StatCard label="Con alertas" value={criticas.length} sub="Acciones no normales" tone="red" />
        <StatCard label="T. respuesta medio" value={`${promedioRespuesta} min`} sub="Promedio general de respuesta" tone="cyan" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <PanelCard title="Estado operativo" subtitle="Distribución actual de la red por estado">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={porEstado} cx="50%" cy="50%" innerRadius={56} outerRadius={84} paddingAngle={3} dataKey="value" nameKey="name">
                {porEstado.map((e, i) => <Cell key={i} fill={estadoColor[e.name]} />)}
              </Pie>
              <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ color: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={chartTooltipStyle(theme)} wrapperStyle={chartTooltipStyle(theme)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 rounded-2xl border border-slate-800/70 bg-slate-900/70 p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-slate-500">
              <span>Cobertura IA</span>
              <span>{iaPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" style={{ width: `${iaPct}%` }} />
            </div>
          </div>
        </PanelCard>

        <PanelCard
          title="Top tiempos de respuesta"
          subtitle="Cámaras con mayor latencia operativa"
          className="xl:col-span-2"
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={topTiempoRespuesta} layout="vertical" margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" strokeDasharray="4 4" horizontal={false} />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} unit=" min" />
              <YAxis dataKey="codigo" type="category" axisLine={false} tickLine={false} tick={{ fill: '#cbd5e1', fontSize: 10 }} width={90} />
              <Tooltip
                contentStyle={chartTooltipStyle(theme)}
                formatter={(value, _, payload) => [`${value} min`, `Tiempo · ${payload.payload.sector}`]}
              />
              <Bar dataKey="tiempo" radius={[0, 12, 12, 0]} barSize={16}>
                {topTiempoRespuesta.map((item, i) => (
                  <Cell key={i} fill={estadoColor[item.estado] || '#22d3ee'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PanelCard>
      </div>

      <PanelCard title="Detalle por cámara" subtitle="Búsqueda y filtros para priorizar mantenimiento y operación">
        <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código, modelo o sector"
            className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-cyan-500/40"
          />
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500/40"
          >
            <option>Todos</option>
            <option>Activa</option>
            <option>Inactiva</option>
            <option>Mantenimiento</option>
          </select>
          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            className="rounded-xl border border-slate-700/80 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-500/40"
          >
            <option>Todas</option>
            {Object.keys(acciones).map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-400">
            Mostrando <span className="font-semibold text-cyan-300">{camarasFiltradas.length}</span> de {camaras.length}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(acciones).map(([accion, total]) => (
            <span key={accion} className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${accionBadge[accion] || 'bg-slate-500/10 text-slate-300 border-slate-500/30'}`}>
              {accion}
              <span className="rounded-full bg-slate-900/60 px-1.5 py-0.5 text-[10px]">{total}</span>
            </span>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800/70">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-900/80">
                <tr className="border-b border-slate-800">
                  {['Código','Modelo','Sector','Estado','IA','Incidentes','T. Respuesta','Acción'].map(h => (
                    <th key={h} className="px-3 py-2 text-left text-[10px] uppercase tracking-[0.25em] text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {camarasFiltradas.map((c, i) => (
                  <tr key={i} className="border-b border-slate-800/40 bg-slate-950/40 transition-colors hover:bg-slate-800/20">
                    <td className="px-3 py-2 font-mono text-cyan-400">{c.codigo_camara}</td>
                    <td className="px-3 py-2 text-slate-300 text-[10px]">{c.modelo}</td>
                    <td className="px-3 py-2 text-slate-200">{c.nombre_sector}</td>
                    <td className="px-3 py-2">
                      <span className="font-semibold" style={{ color: estadoColor[c.estado_operativo] || '#cbd5e1' }}>
                        {c.estado_operativo}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={c.tiene_ia ? 'text-emerald-300' : 'text-slate-500'}>
                        {c.tiene_ia ? '✓ Sí' : '✗ No'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-cyan-300">{c.incidentes_detectados}</td>
                    <td className="px-3 py-2 font-mono text-slate-300">{c.tiempo_resp_promedio} min</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-semibold ${accionBadge[c.accion_recomendada] || 'bg-slate-500/10 text-slate-300 border-slate-500/30'}`}>
                        {c.accion_recomendada}
                      </span>
                    </td>
                  </tr>
                ))}
                {camarasFiltradas.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                      No hay cámaras que coincidan con los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PanelCard>
    </div>
  )
}