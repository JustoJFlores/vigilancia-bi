// frontend/src/components/layout/Sidebar.jsx
import {
  LayoutDashboard,
  MapPin,
  Clock,
  Camera,
  BrainCircuit,
  Map,
  BarChart3,
  Radio,
  User,
  Moon,
  Sun,
  LogOut,
} from 'lucide-react'
import useDashboardStore from '../../store/useDashboardStore'

const normalizeRole = (role) => String(role || '').trim().toLowerCase()

const menu = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'zonas', label: 'Zonas de riesgo', icon: MapPin },
  { id: 'horarios', label: 'Horarios', icon: Clock },
  { id: 'camaras', label: 'Cámaras', icon: Camera },
  { id: 'predicciones', label: 'Predicciones IA', icon: BrainCircuit },
  { id: 'mapa', label: 'Mapa de calor', icon: Map },
  { id: 'cubos', label: 'Cubos personalizados', icon: BarChart3 },
]

export default function Sidebar() {
  const { paginaActual, setPagina, usuario, logout, canAccess, theme, toggleTheme } = useDashboardStore()
  const rol = normalizeRole(usuario?.rol)
  const isDark = theme === 'dark'

  return (
    <aside
      style={{ width: '224px', flexShrink: 0 }}
      className={`fixed top-0 left-0 h-screen border-r flex flex-col z-50 backdrop-blur-sm overflow-hidden transition-colors duration-300 ${
        isDark
          ? 'bg-gradient-to-b from-slate-950 via-slate-950/95 to-slate-950 border-slate-800/80'
          : 'bg-gradient-to-b from-white via-slate-50/95 to-slate-100 border-slate-200/80'
      }`}
    >
      <div
        className={`absolute inset-0 ${
          isDark
            ? 'bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.12),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.08),_transparent_24%)]'
            : 'bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.10),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.08),_transparent_24%)]'
        }`}
      />

      <div className={`relative px-5 py-5 border-b ${isDark ? 'border-slate-800/60' : 'border-slate-200/80'}`}>
        <div className="flex items-center gap-2.5 group cursor-pointer">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full blur-md group-hover:blur-lg transition-all duration-300 ${isDark ? 'bg-cyan-400/20' : 'bg-cyan-500/15'}`} />
            <Radio size={18} className={`relative z-10 transition-colors ${isDark ? 'text-cyan-300 group-hover:text-cyan-200' : 'text-cyan-600 group-hover:text-cyan-700'}`} />
            <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse shadow-lg ${isDark ? 'bg-cyan-400 shadow-cyan-400/50' : 'bg-cyan-500 shadow-cyan-500/30'}`} />
          </div>
          <div>
            <span className={`text-xs font-bold tracking-[0.15em] uppercase transition-colors ${isDark ? 'text-slate-100 group-hover:text-cyan-300' : 'text-slate-900 group-hover:text-cyan-700'}`}>
              SIBVP
            </span>
            <p className="text-[9px] text-slate-500 mt-0.5">Vigilancia v2.0</p>
          </div>
        </div>
      </div>

      {usuario && (
        <div className={`relative px-4 py-4 border-b hover:bg-slate-900/40 transition-colors duration-200 ${isDark ? 'border-slate-800/60' : 'border-slate-200/80 hover:bg-slate-50/80'}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(6,182,212,0.08),_transparent)]" />
          <div className="relative flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br border flex items-center justify-center flex-shrink-0 shadow-lg ${isDark ? 'from-cyan-500/30 to-cyan-500/10 border-cyan-500/30 shadow-cyan-500/10' : 'from-cyan-500/15 to-cyan-500/5 border-cyan-500/20 shadow-cyan-500/5'}`}>
              <User size={13} className={isDark ? 'text-cyan-300' : 'text-cyan-700'} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-[11px] font-semibold truncate ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{usuario.nombre}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <p className="text-[8px] text-slate-500 uppercase tracking-wider font-medium">{rol || usuario.rol}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <p className={`text-[9px] uppercase tracking-[0.3em] px-2 mb-3 font-semibold ${isDark ? 'text-slate-600' : 'text-slate-500'}`}>Navegación</p>
        {menu.filter(item => canAccess(item.id)).map((item) => {
          const Icon = item.icon
          const activo = paginaActual === item.id

          return (
            <button
              key={item.id}
              onClick={() => setPagina(item.id)}
              className={`w-full relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group overflow-hidden ${
                activo
                  ? (isDark ? 'text-cyan-200' : 'text-cyan-700')
                  : (isDark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-500 hover:text-slate-900')
              }`}
            >
              <div
                className={`absolute inset-0 rounded-xl transition-all duration-200 ${
                  activo
                    ? (isDark
                      ? 'bg-gradient-to-r from-cyan-500/20 via-cyan-500/10 to-transparent shadow-lg shadow-cyan-500/10'
                      : 'bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent shadow-lg shadow-cyan-500/5')
                    : (isDark ? 'bg-transparent group-hover:bg-slate-800/50' : 'bg-transparent group-hover:bg-slate-100/90')
                }`}
              />

              <div
                className={`absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full transition-all duration-300 ${
                  activo
                    ? (isDark ? 'bg-gradient-to-b from-cyan-400 to-blue-500 shadow-lg shadow-cyan-400/50' : 'bg-gradient-to-b from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30')
                    : 'h-0 w-0 opacity-0'
                }`}
              />

              <Icon
                size={16}
                strokeWidth={activo ? 2.2 : 1.5}
                className={`flex-shrink-0 relative z-10 transition-all duration-200 ${
                  activo ? (isDark ? 'text-cyan-300' : 'text-cyan-700') : 'group-hover:scale-110'
                }`}
              />
              <span className="text-[12px] font-medium flex-1 text-left relative z-10">{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className={`relative px-3 py-4 border-t space-y-2 bg-gradient-to-t to-transparent ${isDark ? 'border-slate-800/60 from-slate-950/60' : 'border-slate-200/80 from-white/80'}`}>
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border group relative overflow-hidden ${isDark
            ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border-transparent hover:border-slate-700/70'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/90 border-transparent hover:border-slate-200'
          }`}
        >
          <div className={`absolute inset-0 rounded-xl transition-all duration-200 ${isDark ? 'bg-transparent group-hover:bg-cyan-500/5' : 'bg-transparent group-hover:bg-cyan-500/8'}`} />
          {isDark ? <Sun size={15} className="relative z-10" /> : <Moon size={15} className="relative z-10" />}
          <span className="text-[12px] font-medium relative z-10">{isDark ? 'Tema claro' : 'Tema oscuro'}</span>
        </button>

        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border border-transparent hover:border-red-500/30 group relative overflow-hidden ${isDark ? 'text-slate-500 hover:text-red-300 hover:bg-red-500/15' : 'text-slate-600 hover:text-red-600 hover:bg-red-500/10'}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/0 to-red-500/0 group-hover:from-red-500/10 group-hover:via-red-500/5 group-hover:to-red-500/0 transition-all duration-200 rounded-xl" />
          <LogOut size={15} className="relative z-10" />
          <span className="text-[12px] font-medium relative z-10">Cerrar sesión</span>
        </button>

        <p className={`text-[8px] px-3 tracking-wider ${isDark ? 'text-slate-700' : 'text-slate-500'}`}>Puebla, México · v2.0</p>
      </div>
    </aside>
  )
}