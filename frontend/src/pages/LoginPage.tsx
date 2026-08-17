import React, { useState } from 'react'
import { Eye, EyeOff, UserPlus, LogIn, Shield, GraduationCap } from 'lucide-react'
import WallstreetLogo from '../components/layout/WallstreetLogo'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'

type PortalType = 'intern' | 'hr'

const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [portal, setPortal] = useState<PortalType>('intern')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Engineering',
    employee_id: '',
    college: '',
    admin_code: ''
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.email || !form.password) {
      setError('Please enter your email and password')
      return
    }

    setLoading(true)
    try {
      if (mode === 'signin') {
        await login(form.email, form.password)
        // Login will check credentials; user role will determine UI layout
        navigate('/', { replace: true })
      } else {
        if (!form.name) {
          setError('Full Name is required for registration')
          setLoading(false)
          return
        }

        const role = portal === 'hr' ? 'hr' : 'intern'
        await api.post('/auth/signup', {
          ...form,
          role,
          department: form.department || (portal === 'hr' ? 'Human Resources' : 'Engineering')
        })

        setSuccess(`${portal === 'hr' ? 'HR Administrator' : 'Intern'} account created! Signing in...`)
        await login(form.email, form.password)
        setTimeout(() => {
          navigate('/', { replace: true })
        }, 800)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed. Please verify your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const isHr = portal === 'hr'

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100/90 p-4">
      <div className="w-full max-w-md">
        {/* Top Logo & App Title */}
        <div className="flex flex-col items-center mb-6">
          <WallstreetLogo className="w-14 h-14 mb-3" />
          <div className="text-center leading-none">
            <h1
              className="text-2xl font-extrabold tracking-[0.08em] uppercase"
              style={{ color: '#1e2d5b', fontFamily: "'Inter', sans-serif", letterSpacing: '0.12em' }}
            >
              WALL STREET
            </h1>
            <p
              className="text-[10px] font-bold tracking-[0.22em] uppercase mt-0.5"
              style={{ color: '#f07c24', fontFamily: "'Inter', sans-serif" }}
            >
              LLC CONSULTING SERVICES
            </p>
          </div>
          <p className="text-xs text-slate-500 mt-3">Enterprise Training & HR Platform</p>
        </div>

        {/* Portal Selector (Intern vs HR) */}
        <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1.5 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => { setPortal('intern'); setError(''); setSuccess('') }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              portal === 'intern'
                ? 'bg-white text-blue-600 shadow-sm shadow-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap size={16} className={portal === 'intern' ? 'text-blue-600' : 'text-slate-400'} />
            Intern Portal
          </button>

          <button
            type="button"
            onClick={() => { setPortal('hr'); setError(''); setSuccess('') }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              portal === 'hr'
                ? 'bg-white text-purple-700 shadow-sm shadow-slate-300'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield size={16} className={portal === 'hr' ? 'text-purple-600' : 'text-slate-400'} />
            HR / Admin Portal
          </button>
        </div>

        {/* Main Card */}
        <div className={`bg-white rounded-2xl shadow-sm border p-7 transition-all ${
          isHr ? 'border-purple-200/90 shadow-purple-500/5' : 'border-blue-200/90 shadow-blue-500/5'
        }`}>
          {/* Sign In vs Sign Up Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5">
            <button
              type="button"
              onClick={() => { setMode('signin'); setError(''); setSuccess('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LogIn size={14} />
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(''); setSuccess('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserPlus size={14} />
              {isHr ? 'Register HR' : 'Register Intern'}
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isHr ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {isHr ? 'HR Administrator' : 'Intern Access'}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-800 mt-1.5">
              {mode === 'signin'
                ? isHr ? 'HR Administrator Login' : 'Intern Task Portal Login'
                : isHr ? 'Create HR Admin Account' : 'Register Intern Profile'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {mode === 'signin'
                ? isHr
                  ? 'Sign in to manage master data, interns, reports, and reviews'
                  : 'Sign in to record your daily tasks, sessions, and training updates'
                : isHr
                  ? 'Set up administrative credentials with company email'
                  : 'Create your intern account to start logging daily activities'}
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-3.5 py-2.5 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5 text-xs font-medium text-emerald-700">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {isHr ? 'Administrator Full Name *' : 'Intern Full Name *'}
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder={isHr ? 'e.g. Sarah Jenkins (HR Lead)' : 'e.g. Alex Kumar'}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {!isHr ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Intern ID</label>
                      <input
                        name="employee_id"
                        type="text"
                        value={form.employee_id}
                        onChange={handleChange}
                        placeholder="INT-2025-01"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Domain/Dept</label>
                      <input
                        name="department"
                        type="text"
                        value={form.department}
                        onChange={handleChange}
                        placeholder="Frontend / Java"
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">HR Department / Title</label>
                    <input
                      name="department"
                      type="text"
                      value={form.department}
                      onChange={handleChange}
                      placeholder="Talent & Training Division"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isHr ? 'HR Work Email Address *' : 'Intern Email Address *'}
              </label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                placeholder={isHr ? 'hr.admin@company.com' : 'intern.name@company.com'}
                autoComplete="email"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder={mode === 'signup' ? 'Min. 6 characters' : 'Enter your password'}
                  autoComplete="current-password"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 shadow-sm ${
                isHr
                  ? 'bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 shadow-purple-600/20'
                  : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 shadow-blue-600/20'
              }`}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {mode === 'signin' ? 'Authenticating…' : 'Registering account…'}
                </>
              ) : mode === 'signin' ? (
                isHr ? 'Sign In as HR Admin' : 'Sign In as Intern'
              ) : (
                isHr ? 'Complete HR Registration' : 'Complete Intern Registration'
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>{mode === 'signin' ? "Don't have an account?" : 'Already registered?'}</span>
            <button
              type="button"
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess('') }}
              className={`font-semibold transition-colors ${isHr ? 'text-purple-600 hover:text-purple-700' : 'text-blue-600 hover:text-blue-700'}`}
            >
              {mode === 'signin' ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Footer info banner */}
        <div className="mt-4 text-center">
          <p className="text-[11px] text-slate-400">
            Switch between <strong>Intern Portal</strong> and <strong>HR / Admin Portal</strong> using the tabs at the top.
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
