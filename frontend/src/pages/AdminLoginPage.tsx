import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { WallstreetFullLogo } from '../components/layout/WallstreetLogo'

const AdminLoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

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
      setError('Please enter your administrator email and password.')
      return
    }

    setLoading(true)
    try {
      const loggedUser = await login(trimmedEmail, password)

      if (loggedUser.role !== 'hr' && loggedUser.role !== 'admin') {
        setError('Access Denied: This portal is strictly for HR and System Administrators.')
        setLoading(false)
        return
      }

      navigate('/admin', { replace: true })
    } catch (err: any) {
      setError('Invalid administrator email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center p-4 sm:p-8 bg-slate-900 text-white transition-colors duration-200">
      
      {/* Top Header Bar */}
      <div className="w-full max-w-7xl flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <WallstreetFullLogo height={34} lightText />
        </div>
        <div className="text-xs sm:text-sm font-semibold text-purple-300">
          HR &amp; System Admin Portal
        </div>
      </div>

      {/* Main Full-Viewport Centered Card Container */}
      <div className="w-full max-w-[560px] my-auto py-8">
        
        {/* Prominent Admin Login Card */}
        <div className="bg-slate-950 rounded-3xl shadow-2xl border border-slate-800 p-8 sm:p-12">

          {/* Logo Header */}
          <div className="flex flex-col items-center justify-center text-center">
            <WallstreetFullLogo emblemSize={48} className="justify-center mb-3 text-white" />
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/70 border border-purple-800/60 text-purple-300 text-xs sm:text-sm font-bold mt-2">
              <ShieldCheck size={16} />
              HR &amp; System Admin Portal
            </div>
          </div>

          <div className="border-t border-slate-800/80 my-7" />

          <h2 className="text-[22px] font-bold text-slate-100 mb-6 text-center">
            Administrator Sign In
          </h2>

          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="mb-6 bg-red-950/60 border border-red-900/60 rounded-2xl p-4 flex items-center gap-3 text-sm text-red-400 font-medium"
            >
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="admin-email"
                className="block text-sm font-semibold text-slate-300 mb-2"
              >
                Administrator Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your administrator email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full h-12 sm:h-[52px] pl-12 pr-4 border border-slate-800 bg-slate-900 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium disabled:opacity-60 transition-all"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password"
                className="block text-sm font-semibold text-slate-300 mb-2"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-12 sm:h-[52px] pl-12 pr-12 border border-slate-800 bg-slate-900 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium disabled:opacity-60 transition-all"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end pt-1">
              <Link
                to="/forgot-password"
                className="text-xs sm:text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              id="btn-admin-login-submit"
              name="btnAdminLoginSubmit"
              disabled={loading}
              className="w-full h-12 sm:h-[52px] bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900/50 text-white font-bold rounded-xl text-base transition-all shadow-md shadow-purple-900/30 flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying Access…
                </span>
              ) : (
                <>
                  <span>Sign In to Admin Portal</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Return link */}
          <div className="mt-8 border-t border-slate-800/80 pt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-400 hover:text-white inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={16} />
              Return to Intern / Employee Login
            </Link>
          </div>
        </div>
      </div>

      <footer className="text-center text-xs sm:text-sm font-medium text-slate-500 py-4">
        © Wall Street Consulting Services. All rights reserved.
      </footer>
    </div>
  )
}

export default AdminLoginPage
