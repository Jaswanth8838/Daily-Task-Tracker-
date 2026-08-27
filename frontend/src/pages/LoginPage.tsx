import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Lock, Mail, AlertCircle, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { WallstreetFullLogo } from '../components/layout/WallstreetLogo'
import { useTheme } from '../context/ThemeContext'

const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const { theme } = useTheme()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !password) {
      setError('Please enter your corporate email and password.')
      return
    }

    setLoading(true)
    try {
      const loggedUser = await login(trimmedEmail, password)
      if (loggedUser.role === 'hr' || loggedUser.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (loggedUser.role === 'intern') {
        navigate('/', { replace: true })
      } else {
        setError('Invalid corporate email or password.')
      }
    } catch (err: any) {
      setError('Invalid corporate email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center p-4 sm:p-8 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      
      {/* Top Header Bar */}
      <div className="w-full max-w-7xl flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <WallstreetFullLogo height={34} />
        </div>
        <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">
          Daily Task Tracker
        </div>
      </div>

      {/* Main Full-Viewport Centered Card Container */}
      <div className="w-full max-w-[560px] my-auto py-8">
        
        {/* Prominent Authentication Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl dark:shadow-2xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-12 transition-colors">

          {/* Logo Header */}
          <div className="flex flex-col items-center justify-center text-center">
            <WallstreetFullLogo emblemSize={48} className="justify-center mb-4" />
            <h1 className="text-3xl sm:text-[32px] font-bold text-slate-900 dark:text-white tracking-tight mt-1">
              Daily Task Tracker
            </h1>
            <p className="text-base sm:text-lg font-medium text-slate-500 dark:text-slate-400 mt-2">
              Enterprise Internal Reporting &amp; Training Portal
            </p>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 my-7" />

          <h2 className="text-[22px] font-bold text-slate-800 dark:text-slate-200 mb-6 text-center">
            Intern Sign In
          </h2>

          {/* Error Message */}
          {error && (
            <div
              role="alert"
              className="mb-6 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-700 dark:text-red-400 font-medium"
            >
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="corporate-email"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                Corporate Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  id="corporate-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your corporate email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full h-12 sm:h-[52px] pl-12 pr-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-base text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-medium disabled:opacity-60 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-12 sm:h-[52px] pl-12 pr-12 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-base text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-medium disabled:opacity-60 transition-all"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-sign-in-submit"
              name="btnSignInSubmit"
              disabled={loading}
              className="w-full h-12 sm:h-[52px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-base transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                <>
                  <span>Sign In to Tracker</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* HR Portal Navigation Link */}
          <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 text-center">
            <Link
              to="/admin/login"
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 inline-flex items-center gap-2 transition-colors"
            >
              <ShieldCheck size={16} />
              HR Administrator Portal →
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 py-4">
        © Wall Street Consulting Services. All rights reserved.
      </footer>
    </div>
  )
}

export default LoginPage
