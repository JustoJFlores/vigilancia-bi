// frontend/src/pages/Login.jsx
import { useState } from 'react'
import {
  Shield,
  Eye,
  EyeOff,
  Radio,
  Activity,
  Moon,
  Sun,
} from 'lucide-react'

import { motion } from 'framer-motion'

import useDashboardStore from '../store/useDashboardStore'
import { postLogin } from '../services/api'

export default function Login() {
  const { login, theme, toggleTheme } = useDashboardStore()
  const isDark = theme === 'dark'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showDemoCredentials, setShowDemoCredentials] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()

    setLoading(true)
    setError('')

    try {
      const res = await postLogin(username, password)
      login(res.data.access_token, res.data.usuario)
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-gradient-to-br from-[#050816] via-[#0b1120] to-[#111827]' : 'bg-gradient-to-br from-[#f8fbff] via-[#eef4ff] to-[#e5edf7]'}`}>

      {/* ======================================== */}
      {/* GRID TECNOLÓGICO */}
      {/* ======================================== */}
      <div className={`absolute inset-0 ${isDark ? 'opacity-[0.04]' : 'opacity-[0.07]'}`}>

        <div className={`absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.5)_1px,transparent_1px)] bg-[size:40px_40px] ${isDark ? '' : 'mix-blend-multiply opacity-50'}`} />

      </div>

      {/* ======================================== */}
      {/* GLOWS */}
      {/* ======================================== */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">

        <div className={`absolute top-1/4 left-1/4 w-[40rem] h-[40rem] rounded-full blur-3xl animate-pulse ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/15'}`} />

        <div
          className={`absolute bottom-1/4 right-1/4 w-[35rem] h-[35rem] rounded-full blur-3xl animate-pulse ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/12'}`}
          style={{ animationDelay: '1s' }}
        />

        <div className={`absolute top-0 left-0 w-full h-24 blur-3xl ${isDark ? 'bg-cyan-500/5' : 'bg-cyan-400/10'}`} />

      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className={`absolute top-6 right-6 z-50 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-lg backdrop-blur transition-all ${isDark
          ? 'border-cyan-500/30 bg-slate-900/70 text-cyan-300 shadow-cyan-950/20 hover:border-cyan-400/50 hover:bg-slate-800/80 hover:text-cyan-200'
          : 'border-slate-200 bg-white/75 text-slate-700 shadow-slate-200/40 hover:border-slate-300 hover:bg-white hover:text-slate-900'
        }`}
      >
        {isDark ? <Sun size={14} /> : <Moon size={14} />}
        {isDark ? 'Tema claro' : 'Tema oscuro'}
      </button>

      {/* ======================================== */}
      {/* BOTÓN DEMO */}
      {/* ======================================== */}
      <button
        type="button"
        onClick={() => setShowDemoCredentials(!showDemoCredentials)}
        className={`absolute top-6 left-6 z-50 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-lg backdrop-blur transition-all ${isDark
          ? 'border-cyan-500/30 bg-slate-900/70 text-cyan-300 shadow-cyan-950/20 hover:border-cyan-400/50 hover:bg-slate-800/80 hover:text-cyan-200'
          : 'border-cyan-500/20 bg-white/80 text-cyan-700 shadow-slate-200/50 hover:border-cyan-500/40 hover:bg-white hover:text-cyan-800'
        }`}
      >

        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
        </span>

        <Shield size={14} />

        Demo Access

      </button>

      {/* ======================================== */}
      {/* PANEL DEMO */}
      {/* ======================================== */}
      <div
        className={`absolute top-20 left-6 z-50 w-[min(92vw,20rem)] origin-top-left rounded-2xl border p-4 shadow-2xl backdrop-blur transition-all duration-200 ease-out ${isDark ? 'border-slate-700/50 bg-slate-950/90 shadow-black/40' : 'border-slate-200/90 bg-white/95 shadow-slate-200/70'} ${
          showDemoCredentials
            ? 'translate-y-0 scale-100 opacity-100'
            : '-translate-y-2 scale-95 opacity-0 pointer-events-none'
        }`}
      >

        <div className="mb-3 flex items-center justify-between">

          <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Accesos disponibles
          </p>

          <button
            type="button"
            onClick={() => setShowDemoCredentials(false)}
            className={`text-xs transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Cerrar
          </button>

        </div>

        <div className="space-y-2">

          {[
            ['admin', 'admin123', 'Administrador', 'border-red-500/20 hover:border-red-500/50'],
            ['analista', 'analista123', 'Analista', 'border-yellow-500/20 hover:border-yellow-500/50'],
            ['operador', 'operador123', 'Operador', 'border-emerald-500/20 hover:border-emerald-500/50'],
          ].map(([u, p, r, color]) => (

            <button
              key={u}
              onClick={() => {
                setUsername(u)
                setPassword(p)
                setShowDemoCredentials(false)
              }}
              className={`group w-full rounded-xl border px-4 py-3 text-left transition-all ${color} ${isDark ? 'bg-slate-800/30 hover:bg-slate-800/70' : 'bg-white/80 hover:bg-slate-50'}`}
            >

              <div className="flex items-center justify-between">

                <div>

                  <div className={`text-xs font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                    {r}
                  </div>

                  <div className={`mt-1 text-xs font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {u} / {p}
                  </div>

                </div>

                <span className={`text-[11px] ${isDark ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-700'}`}>
                  Usar
                </span>

              </div>

            </button>
          ))}

        </div>
      </div>

      {/* ======================================== */}
      {/* CONTENIDO PRINCIPAL */}
      {/* ======================================== */}
      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">

        {/* ======================================== */}
        {/* LEFT SIDE */}
        {/* ======================================== */}
        <motion.div
          initial={{ opacity: 0, x: -25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-[55%] flex items-center justify-center px-8 lg:px-20 py-20"
        >

          <div className="max-w-xl">

            {/* LOGO */}
            <div className="relative inline-flex items-center justify-center mb-10">

              <div className="absolute inset-0 rounded-3xl bg-cyan-400/20 blur-2xl animate-pulse"></div>

              <div className="relative flex items-center justify-center w-24 h-24 rounded-[2rem] border border-cyan-500/30 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 backdrop-blur-xl">

                <Radio
                  size={42}
                  className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)]"
                />

              </div>

            </div>

            {/* TITULO */}
            <h1 className="text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-400">

              SIBVP

            </h1>

            {/* SUBTITULO */}
              <p className={`mt-5 text-2xl leading-tight ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>

              Sistema Inteligente de Vigilancia Predictiva

            </p>

            {/* DESCRIPCIÓN */}
            <p className={`mt-5 leading-relaxed text-lg ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>

              Monitoreo y análisis predictivo
              en tiempo real para entornos
              críticos y sistemas inteligentes.

            </p>

            {/* STATUS */}
            <div className="mt-10 flex items-center gap-3">

              <div className="relative flex h-3 w-3">

                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>

                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400"></span>

              </div>

              <div className={`flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>

                <Activity size={15} />

                <span className="text-sm font-medium tracking-wide">
                  Sistema operativo
                </span>

              </div>

            </div>

          </div>
        </motion.div>

        {/* ======================================== */}
        {/* RIGHT SIDE */}
        {/* ======================================== */}
        <motion.div
          initial={{ opacity: 0, x: 25 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full lg:w-[45%] flex items-center justify-center px-6 py-16 lg:py-0"
        >

          <div className="relative w-full max-w-md">

            {/* GLOW */}
            <div className={`absolute inset-0 rounded-[2rem] blur-3xl scale-110 ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-500/5'}`}></div>

            {/* CARD */}
            <div className={`relative rounded-[2rem] border backdrop-blur-2xl p-8 shadow-2xl overflow-hidden ${isDark ? 'border-slate-700/50 bg-gradient-to-b from-slate-900/85 to-slate-950/95 shadow-cyan-900/20' : 'border-slate-200/80 bg-gradient-to-b from-white/95 to-slate-50/95 shadow-slate-200/60'}`}>

              {/* LÍNEA SUPERIOR */}
              <div className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent"></div>

              {/* TITULO */}
              <h2 className={`text-4xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Bienvenido
              </h2>

              <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ingresa tus credenciales para acceder al sistema
              </p>

              {/* FORM */}
              <form onSubmit={handleLogin} className="space-y-5">

                {/* USER */}
                <div>

                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Usuario
                  </label>

                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin / analista / operador"
                    required
                    className={`w-full rounded-xl border px-4 py-3 text-sm transition-all placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_25px_rgba(6,182,212,0.15)] ${isDark ? 'border-slate-700/80 bg-slate-800/50 text-slate-100 hover:border-slate-600 hover:bg-slate-800/70' : 'border-slate-200 bg-white/90 text-slate-900 hover:border-slate-300 hover:bg-white'}`}
                  />

                </div>

                {/* PASSWORD */}
                <div>

                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Contraseña
                  </label>

                  <div className="relative">

                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`w-full rounded-xl border px-4 py-3 pr-11 text-sm transition-all placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 focus:shadow-[0_0_25px_rgba(6,182,212,0.15)] ${isDark ? 'border-slate-700/80 bg-slate-800/50 text-slate-100 hover:border-slate-600 hover:bg-slate-800/70' : 'border-slate-200 bg-white/90 text-slate-900 hover:border-slate-300 hover:bg-white'}`}
                    />

                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'}`}
                    >
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>

                  </div>
                </div>

                {/* ERROR */}
                {error && (

                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3">

                    <p className="flex items-center text-sm text-red-300">

                      <span className="w-2 h-2 rounded-full bg-red-400 mr-2"></span>

                      {error}

                    </p>

                  </div>
                )}

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 py-3 text-sm font-bold text-white transition-all hover:from-cyan-600 hover:to-cyan-700 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >

                  {loading ? (

                    <span className="flex items-center justify-center gap-2">

                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>

                      Verificando...

                    </span>

                  ) : (
                    'Ingresar al sistema'
                  )}

                </button>

              </form>

              {/* FOOTER */}
              <div className="mt-8 pt-5 border-t border-slate-800 flex items-center justify-between text-xs">

                <span className="text-slate-500">
                  Puebla, México · v2.0
                </span>

              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}