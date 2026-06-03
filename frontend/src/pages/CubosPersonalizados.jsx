// frontend/src/pages/CubosPersonalizados.jsx
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ScatterChart, Scatter, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
  AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { BarChart3, Play, Trash2, Download, Plus } from 'lucide-react'
import useDashboardStore from '../store/useDashboardStore'
import { exportarCSV } from '../services/exportar'

// Dimensiones disponibles para el usuario
const DIMENSIONES = {
  nombre_sector:      { label: 'Zona / Sector',          tipo: 'texto'  },
  colonia:            { label: 'Colonia',                tipo: 'texto'  },
  tipo_zona:          { label: 'Tipo de zona',           tipo: 'texto'  },
  nivel_riesgo:       { label: 'Nivel de riesgo',        tipo: 'numero' },
  dia_semana:         { label: 'Día de la semana',       tipo: 'texto'  },
  turno:              { label: 'Turno',                  tipo: 'texto'  },
  hora:               { label: 'Hora',                   tipo: 'numero' },
  mes:                { label: 'Mes',                    tipo: 'numero' },
  estado_operativo:   { label: 'Estado cámara',          tipo: 'texto'  },
  tipo_delito:        { label: 'Tipo de delito',         tipo: 'texto'  },
  categoria:          { label: 'Categoría delito',       tipo: 'texto'  },
  municipio:          { label: 'Municipio',              tipo: 'texto'  },
  direccion:          { label: 'Dirección / Calle',      tipo: 'texto'  },
  semana_mes:         { label: 'Semana del mes',        tipo: 'numero' },
  fecha:              { label: 'Fecha',                  tipo: 'fecha'  },
}

const METRICAS = {
  total_incidentes:   { label: 'Total incidentes',       fn: 'count'  },
  severidad_promedio: { label: 'Severidad promedio',     fn: 'mean'   },
  severidad_maxima:   { label: 'Severidad máxima',       fn: 'max'    },
  total_eventos:      { label: 'Total eventos',          fn: 'sum'    },
  delitos_violentos:  { label: 'Delitos violentos',      fn: 'violent'},
  capturados:         { label: 'Capturados',             fn: 'capture'},
  duracion_promedio:  { label: 'Duración promedio (s)',  fn: 'avg_dur'},
  porcentaje_violento:{ label: '% Violentos',           fn: 'percent'},
}

const TIPOS_GRAFICA = [
  { id: 'barras_v',   label: 'Barras vertical',  icon: '▊' },
  { id: 'barras_h',   label: 'Barras horizontal', icon: '▬' },
  { id: 'linea',      label: 'Línea',             icon: '∿' },
  { id: 'pie',        label: 'Circular',          icon: '◔' },
  { id: 'dispersion', label: 'Dispersión',        icon: '⊹' },
  { id: 'area',       label: 'Área',               icon: '≈' },
  { id: 'radar',      label: 'Radar',              icon: '✺' },
]

const COLORES_PALETTE = [
  '#06b6d4','#f43f5e','#a78bfa','#22d3ee',
  '#f59e0b','#34d399','#fb923c','#e879f9',
]

const MAX_CATEGORIAS_GRAFICA = 10
const formatearNumero = (valor) => Number(valor || 0).toLocaleString('es-MX')
const truncarEtiqueta = (texto, max = 14) => {
  const txt = String(texto ?? '')
  return txt.length > max ? `${txt.slice(0, max)}...` : txt
}

function construirDatos(rawData, dimension, metrica) {
  if (!rawData.length || !dimension || !metrica) return []

  const grupos = {}
  rawData.forEach(row => {
    // Normalizar la clave de agrupamiento según el tipo de dimensión
    const dimTipo = DIMENSIONES[dimension]?.tipo
    const rawVal = row[dimension]
    let key
    if (rawVal === undefined || rawVal === null || rawVal === '') {
      key = 'Sin dato'
    } else if (dimTipo === 'fecha') {
      // Agrupar fechas por día (YYYY-MM-DD) para evitar agrupaciones demasiado granulares
      const d = new Date(rawVal)
      key = !Number.isNaN(d) ? d.toISOString().slice(0, 10) : String(rawVal)
    } else {
      key = String(rawVal)
    }

    if (!grupos[key]) grupos[key] = { items: [], _key: key }
    grupos[key].items.push(row)
  })

  return Object.values(grupos).map(g => {
    const items = g.items
    let valor = 0
    if (metrica === 'total_incidentes') {
      // Preferir campos pre-agrupados si existen (datos ya agregados por zona/cluster)
      const possibleCountFields = ['total_incidentes', 'incident_count', 'count', 'cantidad', 'cantidad_incidentes', 'incidentes']
      const foundField = possibleCountFields.find(f => items.some(r => r[f] !== undefined && r[f] !== null))
      if (foundField) {
        valor = items.reduce((s, r) => s + (Number(r[foundField]) || 0), 0)
      } else {
        // Intentar detectar automáticamente un campo numérico representativo
        const sampleKeys = Object.keys(items[0] || {})
        const numericCandidates = sampleKeys.filter(k => k !== dimension && items.some(r => typeof r[k] === 'number'))
        if (numericCandidates.length) {
          const sums = numericCandidates.map(k => ({ key: k, sum: items.reduce((s, r) => s + (Number(r[k]) || 0), 0) }))
          sums.sort((a, b) => b.sum - a.sum)
          const best = sums[0]
          // Usar el campo detectado sólo si aporta más que el simple count (evita tomar un campo que sea 0/1)
          if (best.sum > items.length) {
            valor = best.sum
          } else {
            valor = items.length
          }
        } else {
          // fallback: contar filas
          valor = items.length
        }
      }
    }
    else if (metrica === 'severidad_promedio') valor = +(items.reduce((s, r) => s + (r.severidad_promedio || r.severidad || 0), 0) / items.length).toFixed(2)
    else if (metrica === 'severidad_maxima') valor = Math.max(...items.map(r => r.severidad_maxima || r.severidad || 0))
    else if (metrica === 'total_eventos') valor = items.reduce((s, r) => s + (r.total_eventos || r.cantidad_eventos || 1), 0)
    else if (metrica === 'delitos_violentos') valor = items.reduce((s, r) => s + (r.delitos_violentos || 0), 0)
    else if (metrica === 'capturados') valor = items.reduce((s, r) => s + (r.capturados || 0), 0)
    else if (metrica === 'duracion_promedio') valor = +(items.reduce((s, r) => s + (r.duracion || r.duracion_segundos || 0), 0) / items.length || 0).toFixed(2)
    else if (metrica === 'porcentaje_violento') {
      const violentos = items.reduce((s, r) => s + (Number(r.delitos_violentos) || 0), 0)
      // Buscar un campo que represente el total de incidentes en los registros agrupados
      const possibleTotalFields = ['total_incidentes', 'incident_count', 'count', 'cantidad', 'cantidad_incidentes', 'incidentes', 'total']
      const totalField = possibleTotalFields.find(f => items.some(r => r[f] !== undefined && r[f] !== null))
      let denom = 0
      if (totalField) {
        denom = items.reduce((s, r) => s + (Number(r[totalField]) || 0), 0)
      } else {
        denom = items.length
      }

      // Además, detectar campos numéricos candidatos para diagnóstico
      const sampleKeys = Object.keys(items[0] || {})
      const numericCandidates = sampleKeys.filter(k => k !== dimension && items.some(r => typeof r[k] === 'number' || (!isNaN(Number(r[k])) && r[k] !== '' && r[k] !== null && r[k] !== undefined)))
      const candidateSums = numericCandidates.map(k => ({ key: k, sum: items.reduce((s, r) => s + (Number(r[k]) || 0), 0) }))
      candidateSums.sort((a, b) => b.sum - a.sum)
      const bestCandidate = candidateSums[0]

      const rawPercent = (violentos / (denom || 1)) * 100
      if (rawPercent > 100) {
        console.warn('CubosPersonalizados: porcentaje_violento > 100 — valores inconsistentes', { dimensionKey: g._key, violentos, denom, rawPercent, totalField, bestCandidate })
      }

      // Depuración: mostrar muestra de items y candidatos (temporal)
      if (typeof window !== 'undefined') {
        console.debug('CubosPersonalizados - pct debug', {
          group: g._key,
          sample: items.slice(0, 3),
          violentos,
          denom,
          rawPercent,
          totalField,
          numericCandidates: candidateSums.slice(0, 6),
        })
      }

      valor = +Math.min(100, rawPercent).toFixed(2)
    }
    return { name: String(g._key), value: valor }
  }).sort((a, b) => b.value - a.value)
}

function RenderGrafica({ tipo, datos, metricaLabel, color }) {
  if (!datos.length) return (
    <div className="flex items-center justify-center h-full text-slate-600 text-sm">
      Sin datos para mostrar
    </div>
  )

  const datosLimitados = datos.slice(0, MAX_CATEGORIAS_GRAFICA)
  const datosParaPie = datos.length > MAX_CATEGORIAS_GRAFICA
    ? [
      ...datos.slice(0, MAX_CATEGORIAS_GRAFICA - 1),
      {
        name: 'Otros',
        value: datos.slice(MAX_CATEGORIAS_GRAFICA - 1).reduce((acc, item) => acc + (item.value || 0), 0),
      },
    ]
    : datos

  const { theme } = useDashboardStore()
  const tooltipStyle = theme === 'dark'
    ? { background: 'rgba(15, 23, 42, 0.95)', border: '1px solid #334155', borderRadius: 10, fontSize: 12, padding: '8px 10px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)' }
    : { background: '#ffffff', border: '1px solid rgba(2,6,23,0.06)', borderRadius: 10, fontSize: 12, padding: '8px 10px', boxShadow: '0 6px 18px rgba(2,6,23,0.06)' }

  const tooltipContenido = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const punto = payload[0]
    const nombre = punto?.payload?.name
    const valor = punto?.value
    const titleColor = theme === 'dark' ? '#cbd5e1' : '#334155'
    const valueColor = theme === 'dark' ? '#f8fafc' : '#0f172a'
    return (
      <div style={tooltipStyle}>
        <p style={{ color: titleColor, fontSize: 11, marginBottom: 4 }}>{nombre}</p>
        <p style={{ color: valueColor, fontSize: 13, fontWeight: 700 }}>
          {metricaLabel}: <span style={{ color }}>{formatearNumero(valor)}</span>
        </p>
      </div>
    )
  }


  if (tipo === 'barras_v') return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={datosLimitados} margin={{ top: 8, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#1e2535" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(value) => truncarEtiqueta(value, 12)} angle={-22} textAnchor="end" height={52} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatearNumero} width={52} />
        <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} content={tooltipContenido} wrapperStyle={tooltipStyle} />
        <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} name={metricaLabel} maxBarSize={46} />
      </BarChart>
    </ResponsiveContainer>
  )

  if (tipo === 'barras_h') return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={datosLimitados} layout="vertical" margin={{ top: 5, right: 12, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#1e2535" horizontal={false} />
        <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatearNumero} />
        <YAxis dataKey="name" type="category" tick={{ fill: '#cbd5e1', fontSize: 10 }} width={120} tickFormatter={(value) => truncarEtiqueta(value, 16)} />
        <Tooltip cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} content={tooltipContenido} wrapperStyle={tooltipStyle} />
        <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} name={metricaLabel} barSize={16} />
      </BarChart>
    </ResponsiveContainer>
  )

  if (tipo === 'linea') return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={datosLimitados} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#1e2535" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(value) => truncarEtiqueta(value, 12)} angle={-20} textAnchor="end" height={50} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatearNumero} width={52} />
        <Tooltip content={tooltipContenido} wrapperStyle={tooltipStyle} />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.8}
          dot={{ fill: color, r: 3.5 }} activeDot={{ r: 5, stroke: '#0f172a', strokeWidth: 2 }} name={metricaLabel} />
      </LineChart>
    </ResponsiveContainer>
  )

  if (tipo === 'pie') return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={datosParaPie} cx="50%" cy="50%" innerRadius={42} outerRadius={96}
          dataKey="value" nameKey="name"
          label={({ name, percent }) => `${truncarEtiqueta(name, 10)} ${(percent*100).toFixed(0)}%`}
          labelLine={{ stroke: '#334155' }}
        >
          {datosParaPie.map((_, i) => <Cell key={i} fill={COLORES_PALETTE[i % COLORES_PALETTE.length]} />)}
        </Pie>
        <Tooltip content={tooltipContenido} wrapperStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 11, color: '#cbd5e1' }} formatter={(value) => truncarEtiqueta(value, 18)} />
      </PieChart>
    </ResponsiveContainer>
  )

  if (tipo === 'dispersion') return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 8, right: 10, left: 0, bottom: 18 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#1e2535" />
        <XAxis dataKey="index" type="number" name="índice"
          tick={{ fill: '#94a3b8', fontSize: 10 }}
          tickFormatter={(v) => truncarEtiqueta(datosLimitados[v]?.name || v, 10)} />
        <YAxis dataKey="value" name={metricaLabel} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatearNumero} />
        <Tooltip cursor={{ strokeDasharray: '3 3', stroke: '#64748b' }} content={tooltipContenido} wrapperStyle={tooltipStyle} />
        <Scatter
          data={datosLimitados.map((d, i) => ({ ...d, index: i }))}
          fill={color}
        />
      </ScatterChart>
    </ResponsiveContainer>
  )

  if (tipo === 'area') return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={datosLimitados} margin={{ top: 8, right: 10, left: 0, bottom: 20 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#1e2535" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={(value) => truncarEtiqueta(value, 12)} angle={-20} textAnchor="end" height={48} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={formatearNumero} width={52} />
        <Tooltip content={tooltipContenido} wrapperStyle={tooltipStyle} />
        <Area type="monotone" dataKey="value" stroke={color} fill={color} fillOpacity={0.16} strokeWidth={2} name={metricaLabel} />
      </AreaChart>
    </ResponsiveContainer>
  )

  if (tipo === 'radar') return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={datosLimitados} outerRadius={90} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <PolarGrid stroke="#1e2535" />
        <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <PolarRadiusAxis tickFormatter={formatearNumero} tick={{ fill: '#94a3b8', fontSize: 10 }} />
        <Tooltip content={tooltipContenido} wrapperStyle={tooltipStyle} />
        <Radar name={metricaLabel} dataKey="value" stroke={color} fill={color} fillOpacity={0.25} />
      </RadarChart>
    </ResponsiveContainer>
  )

  return null
}

export default function CubosPersonalizados() {
  const { zonasRiesgo, horarios, camaras, clustering, predicciones, incidentes, eventos, theme } = useDashboardStore()

  // Fuentes de datos disponibles
  const fuentesDatos = {
    zonas:    { label: 'Zonas de riesgo',    datos: zonasRiesgo },
    horarios: { label: 'Análisis horarios',  datos: horarios    },
    camaras:  { label: 'Estado cámaras',     datos: camaras     },
    clusters: { label: 'Clustering K-Means', datos: clustering  },
    predicciones: { label: 'Predicciones',     datos: predicciones },
    incidentes: { label: 'Incidentes',        datos: incidentes },
    eventos: { label: 'Eventos',             datos: eventos },
  }

  // Mostrar solo fuentes con datos
  const fuentesDisponibles = Object.entries(fuentesDatos).filter(([, v]) => Array.isArray(v.datos) && v.datos.length > 0)

  useEffect(() => {
    if (!fuentesDisponibles.length) return
    const keys = fuentesDisponibles.map(([k]) => k)
    if (!keys.includes(fuente)) {
      setFuente(keys[0])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuentesDisponibles.length])

  // Estado del constructor
  const [fuente,     setFuente]     = useState('zonas')
  const [dimension,  setDimension]  = useState('nombre_sector')
  const [metrica,    setMetrica]    = useState('total_incidentes')
  const [tipoGraf,   setTipoGraf]   = useState('barras_v')
  const [color,      setColor]      = useState(COLORES_PALETTE[0])
  const [titulo,     setTitulo]     = useState('')

  // Cubos guardados
  const [cubosGuardados, setCubosGuardados] = useState([])
  const [generarCount, setGenerarCount] = useState(3)

  // Persistencia local de cubos guardados
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cubos_personalizados')
      if (raw) setCubosGuardados(JSON.parse(raw))
    } catch (e) {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('cubos_personalizados', JSON.stringify(cubosGuardados)) } catch (e) {}
  }, [cubosGuardados])

  const datosFuente = fuentesDatos[fuente]?.datos || []
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Muestra una muestra de los datos en la consola para depuración
      // (temporal: eliminar en producción o cuando ya esté validado)
      console.log('CubosPersonalizados - muestra datosFuente (8):', datosFuente.slice(0, 8))
      console.log('CubosPersonalizados - fuente, dimension, metrica:', { fuente, dimension, metrica })
    }
  }, [fuente, datosFuente, dimension, metrica])
  // Determina qué dimensiones y métricas están disponibles en la fuente seleccionada
  function evaluarDisponibilidad(sampleData) {
    const dims = new Set()
    const mets = new Set()
    const sample = Array.isArray(sampleData) ? sampleData.slice(0, 300) : []

    const hasField = (names) => sample.some(r => names.some(n => r[n] !== undefined && r[n] !== null))

    // dimensiones: existe la propiedad en al menos un registro
    Object.keys(DIMENSIONES).forEach(k => {
      if (sample.length === 0) return
      if (k === 'fecha') {
        // fecha: acepta si hay algún valor parseable
        const ok = sample.some(r => {
          const v = r[k] || r['fecha'] || r['created_at'] || r['timestamp']
          return v && !Number.isNaN(Date.parse(String(v)))
        })
        if (ok) dims.add(k)
      } else {
        if (sample.some(r => r[k] !== undefined && r[k] !== null && String(r[k]) !== '')) dims.add(k)
      }
    })

    // métricas: basadas en campos esperados
    if (sample.length > 0) mets.add('total_incidentes')
    if (hasField(['severidad', 'severidad_promedio', 'severidad_maxima'])) {
      mets.add('severidad_promedio')
      mets.add('severidad_maxima')
    }
    if (hasField(['total_eventos', 'cantidad_eventos', 'event_count'])) mets.add('total_eventos')
    if (hasField(['delitos_violentos', 'violent_count'])) mets.add('delitos_violentos')
    if (hasField(['capturados', 'capturado'])) mets.add('capturados')
    if (hasField(['duracion', 'duracion_segundos', 'duration_seconds'])) mets.add('duracion_promedio')
    if (hasField(['delitos_violentos'])) mets.add('porcentaje_violento')

    return { dimensions: dims, metrics: mets }
  }

  const disponibilidad = evaluarDisponibilidad(datosFuente)

  // Si la dimensión o métrica seleccionada deja de estar disponible, elegir la primera disponible
  useEffect(() => {
    if (datosFuente.length === 0) return
    if (!disponibilidad.dimensions.has(dimension)) {
      const primero = Object.keys(DIMENSIONES).find(k => disponibilidad.dimensions.has(k))
      if (primero) setDimension(primero)
    }
    if (!disponibilidad.metrics.has(metrica)) {
      const primeroM = Object.keys(METRICAS).find(k => disponibilidad.metrics.has(k))
      if (primeroM) setMetrica(primeroM)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuente, datosFuente.length])
  const datosGrafica = construirDatos(datosFuente, dimension, metrica)
  const metricaLabel = METRICAS[metrica]?.label
  const dimensionLabel = DIMENSIONES[dimension]?.label
  const fuenteLabel = fuentesDatos[fuente]?.label
  const valorTotal = datosGrafica.reduce((acc, item) => acc + (item.value || 0), 0)
  const categoriaTop = datosGrafica[0]

  function guardarCubo() {
    if (!titulo.trim()) return
    const nuevo = {
      id:        Date.now(),
      titulo:    titulo.trim(),
      fuente,
      dimension,
      metrica,
      tipoGraf,
      color,
      datos:     datosGrafica,
      fuenteLabel:    fuentesDatos[fuente]?.label,
      dimensionLabel: DIMENSIONES[dimension]?.label,
      metricaLabel:   METRICAS[metrica]?.label,
      creadoEn:  new Date().toLocaleTimeString('es-MX'),
    }
    setCubosGuardados(prev => [nuevo, ...prev])
    setTitulo('')
  }

  function generarCubosAutomaticos(count = generarCount) {
    if (!datosGrafica.length) return
    const top = datosGrafica.slice(0, Math.max(1, Number(count) || 1))
    const nuevos = top.map(item => ({
      id: Date.now() + Math.floor(Math.random() * 10000),
      titulo: `${metricaLabel} · ${dimensionLabel}: ${item.name}`,
      fuente,
      dimension,
      metrica,
      tipoGraf,
      color,
      datos: [item],
      fuenteLabel: fuentesDatos[fuente]?.label,
      dimensionLabel: DIMENSIONES[dimension]?.label,
      metricaLabel: METRICAS[metrica]?.label,
      creadoEn: new Date().toLocaleTimeString('es-MX'),
    }))
    setCubosGuardados(prev => [...nuevos, ...prev])
  }

  function eliminarCubo(id) {
    setCubosGuardados(prev => prev.filter(c => c.id !== id))
  }

  const pageShellClass = theme === 'dark'
    ? 'relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.10),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.10),_transparent_24%),linear-gradient(180deg,_rgba(15,23,42,0.35),_transparent_55%)] p-4 md:p-6 space-y-6'
    : 'relative min-h-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.10),_transparent_24%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.08),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.68),_rgba(226,232,240,0.28))] p-4 md:p-6 space-y-6'

  return (
    <div className={pageShellClass}>
      <div className={
        theme === 'dark'
          ? 'relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-[#101a2a] via-[#111827] to-[#1b1d3a] p-5 md:p-6'
          : 'relative overflow-hidden rounded-2xl border border-slate-200/30 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-5 md:p-6'
      }>
        <div className={theme === 'dark' ? 'absolute -top-16 -right-16 w-56 h-56 rounded-full bg-cyan-500/10 blur-3xl' : 'absolute -top-16 -right-16 w-56 h-56 rounded-full bg-cyan-200/30 blur-3xl'} />
        <div className={theme === 'dark' ? 'absolute -bottom-20 left-20 w-64 h-64 rounded-full bg-fuchsia-500/10 blur-3xl' : 'absolute -bottom-20 left-20 w-64 h-64 rounded-full bg-fuchsia-200/20 blur-3xl'} />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className={
              `text-[11px] uppercase tracking-[0.2em] mb-2 ${theme === 'dark' ? 'text-cyan-300/80' : 'text-cyan-600/80'}`
            }>
              Constructor visual
            </p>
            <h2 className={
              `text-xl md:text-2xl font-semibold leading-tight ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`
            }>
              Diseña cubos personalizados en segundos
            </h2>
            <p className={
              `text-xs md:text-sm mt-2 max-w-2xl ${theme === 'dark' ? 'text-slate-300/80' : 'text-slate-700/80'}`
            }>
              Selecciona la fuente, define la dimensión y métrica, y obtén una visualización clara lista para exportar.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-[11px] min-w-[220px]">
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2.5">
              <p className="text-slate-400">Registros</p>
              <p className="text-slate-100 font-semibold text-sm mt-0.5">{datosFuente.length}</p>
            </div>
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2.5">
              <p className="text-slate-400">Cubos guardados</p>
              <p className="text-slate-100 font-semibold text-sm mt-0.5">{cubosGuardados.length}</p>
            </div>
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2.5">
              <p className="text-slate-400">Categorías</p>
              <p className="text-slate-100 font-semibold text-sm mt-0.5">{datosGrafica.length}</p>
            </div>
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/60 px-3 py-2.5">
              <p className="text-slate-400">Valor total</p>
              <p className="text-slate-100 font-semibold text-sm mt-0.5">{valorTotal.toLocaleString('es-MX')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-7 space-y-5">
          <div className="bg-[#141928] border border-slate-800 rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-4">
              Paso 1: Define la consulta
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                  Fuente de datos
                </label>
                <select
                  value={fuente}
                  onChange={e => setFuente(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/60"
                >
                  {fuentesDisponibles.map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <p className="text-[10px] text-cyan-300/80 mt-1.5">{datosFuente.length} registros disponibles</p>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                  Dimensión (eje X)
                </label>
                <select
                  value={dimension}
                  onChange={e => setDimension(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/60"
                >
                  {Object.entries(DIMENSIONES).map(([k, v]) => {
                    const disponible = disponibilidad.dimensions.has(k)
                    return (
                      <option key={k} value={k} disabled={!disponible}>
                        {v.label}{!disponible ? ' — no disponible' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                  Métrica (eje Y)
                </label>
                <select
                  value={metrica}
                  onChange={e => setMetrica(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/60"
                >
                  {Object.entries(METRICAS).map(([k, v]) => {
                    const disponible = disponibilidad.metrics.has(k)
                    return (
                      <option key={k} value={k} disabled={!disponible}>
                        {v.label}{!disponible ? ' — no disponible' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                  Tipo de gráfica
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TIPOS_GRAFICA.map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTipoGraf(t.id)}
                      className={`rounded-lg border px-2.5 py-2 text-[11px] transition-all text-left ${
                        tipoGraf === t.id
                          ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-200'
                          : 'border-slate-700 bg-slate-900/80 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <p className="text-xs mb-0.5">{t.icon}</p>
                      <p className="leading-tight">{t.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#141928] border border-slate-800 rounded-2xl p-5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-4">
              Paso 2: Personaliza y guarda
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLORES_PALETTE.map(c => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform border ${color === c ? 'scale-110 border-white/70 ring-2 ring-cyan-400/40' : 'border-black/20 hover:scale-105'}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-wider text-slate-500 mb-2">
                  Título del cubo
                </label>
                <input
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && guardarCubo()}
                  placeholder="Ej: Incidentes por turno en Analco..."
                  className="w-full bg-slate-900/90 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-cyan-500/60 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <Play size={12} className="text-cyan-300" />
                Vista en vivo: {fuenteLabel} · {dimensionLabel} · {metricaLabel}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={generarCount}
                  onChange={e => setGenerarCount(Number(e.target.value))}
                  className="w-14 bg-slate-900/90 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-2.5 focus:outline-none"
                  title="Número de cubos a generar"
                />
                <button
                  onClick={() => generarCubosAutomaticos()}
                  disabled={!datosGrafica.length}
                  className="inline-flex items-center gap-2 px-3 py-2.5 bg-slate-800/60 border border-slate-700 text-slate-200 text-xs rounded-lg hover:border-cyan-400/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Generar cubos
                </button>
                <button
                  onClick={guardarCubo}
                  disabled={!titulo.trim() || !datosGrafica.length}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 text-xs rounded-lg hover:bg-cyan-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                  Guardar cubo
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-5 space-y-5">
          <div className="bg-[#141928] border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-slate-100 font-medium">{titulo || 'Vista previa'}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{fuenteLabel} · {dimensionLabel} · {metricaLabel}</p>
              </div>
              <button
                onClick={() => exportarCSV(datosGrafica, titulo || 'cubo_personalizado')}
                disabled={!datosGrafica.length}
                className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded border border-slate-700 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-colors disabled:opacity-30"
              >
                <Download size={11} />
                CSV
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2">
              <div style={{ height: '320px' }}>
                <RenderGrafica
                  tipo={tipoGraf}
                  datos={datosGrafica}
                  metricaLabel={metricaLabel}
                  color={color}
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-2.5">
                <p className="text-slate-500">Categoría principal</p>
                <p className="text-slate-200 mt-0.5 truncate" title={categoriaTop?.name || 'Sin datos'}>{categoriaTop?.name || 'Sin datos'}</p>
              </div>
              <div className="rounded-lg border border-slate-700/80 bg-slate-900/70 p-2.5">
                <p className="text-slate-500">Valor principal</p>
                <p className="text-slate-200 mt-0.5">{(categoriaTop?.value || 0).toLocaleString('es-MX')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {cubosGuardados.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3">
            Cubos guardados en esta sesión
          </p>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {cubosGuardados.map(cubo => (
              <div key={cubo.id} className="bg-[#141928] border border-slate-800 rounded-xl p-5 hover:border-cyan-500/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-slate-200">{cubo.titulo}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {cubo.fuenteLabel} · {cubo.dimensionLabel} · {cubo.metricaLabel}
                    </p>
                    <p className="text-[10px] text-slate-700 mt-0.5">Creado: {cubo.creadoEn}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => exportarCSV(cubo.datos, cubo.titulo)}
                      className="p-1.5 rounded border border-slate-700 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      onClick={() => eliminarCubo(cubo.id)}
                      className="p-1.5 rounded border border-slate-700 text-slate-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ height: '220px' }}>
                  <RenderGrafica
                    tipo={cubo.tipoGraf}
                    datos={cubo.datos}
                    metricaLabel={cubo.metricaLabel}
                    color={cubo.color}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {cubosGuardados.length === 0 && (
        <div className="text-center py-12 text-slate-600 border border-dashed border-slate-700/80 rounded-2xl bg-slate-900/30">
          <BarChart3 size={32} className="mx-auto mb-3 opacity-40 text-cyan-300" />
          <p className="text-sm text-slate-300">Configura y guarda un cubo para verlo aquí</p>
          <p className="text-xs mt-1">Los cubos guardados persisten durante la sesión</p>
        </div>
      )}
    </div>
  )
}