// frontend/src/components/layout/KPICard.jsx
export default function KPICard({ label, value, sub, color = 'cyan' }) {
  const palette = {
    cyan: {
      ring: 'border-cyan-500/20',
      text: 'text-cyan-300',
      glow: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
      dot: 'bg-cyan-300',
    },
    red: {
      ring: 'border-red-500/20',
      text: 'text-red-300',
      glow: 'from-red-500/20 via-red-500/5 to-transparent',
      dot: 'bg-red-300',
    },
    green: {
      ring: 'border-emerald-500/20',
      text: 'text-emerald-300',
      glow: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      dot: 'bg-emerald-300',
    },
    yellow: {
      ring: 'border-amber-500/20',
      text: 'text-amber-300',
      glow: 'from-amber-500/20 via-amber-500/5 to-transparent',
      dot: 'bg-amber-300',
    },
    purple: {
      ring: 'border-violet-500/20',
      text: 'text-violet-300',
      glow: 'from-violet-500/20 via-violet-500/5 to-transparent',
      dot: 'bg-violet-300',
    },
  }

  const current = palette[color] || palette.cyan

  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-slate-950/60 p-5 shadow-lg shadow-slate-950/20 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-700/80 ${current.ring}`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${current.glow} opacity-80`} />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-4">
          <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{label}</p>
          <span className={`h-2.5 w-2.5 rounded-full ${current.dot} shadow-[0_0_18px_currentColor]`} />
        </div>
        <p className={`text-3xl font-semibold tracking-tight ${current.text}`}>{value}</p>
        {sub && <p className="mt-2 text-xs leading-5 text-slate-500">{sub}</p>}
      </div>
    </div>
  )
}