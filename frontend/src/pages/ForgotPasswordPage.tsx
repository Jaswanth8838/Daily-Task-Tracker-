import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react'
import { WallstreetFullLogo } from '../components/layout/WallstreetLogo'
import api from '../lib/api'

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [devToken, setDevToken] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)
    setSuccessMessage(null)
    setDevToken(null)

    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) {
      setError('Please enter your corporate email address.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email: trimmedEmail })
      // Generic security response
      setSuccessMessage(res.data.message || 'If an account exists for this email, password reset instructions will be sent.')
      if (res.data.dev_reset_token) {
        setDevToken(res.data.dev_reset_token)
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to process password reset request. Please try again.')
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
        
        {/* Card */}
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

          <div className="text-center mb-6">
            <h2 className="text-[22px] font-bold text-slate-800 dark:text-slate-200">
              Forgot Password
            </h2>
            <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Enter your corporate email address to receive password reset instructions.
            </p>
          </div>

          {/* Success Banner */}
          {successMessage && (
            <div className="mb-6 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-4 flex items-start gap-3 text-sm text-emerald-800 dark:text-emerald-300 font-medium">
              <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p>{successMessage}</p>
                {devToken && (
                  <div className="mt-3 pt-3 border-t border-emerald-200/80 dark:border-emerald-800/60 text-xs">
                    <span className="font-bold uppercase tracking-wider block text-emerald-700 dark:text-emerald-400 mb-1">Development Shortcut:</span>
                    <Link
                      to={`/reset-password?token=${encodeURIComponent(devToken)}`}
                      className="inline-flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 underline hover:text-blue-800"
                    >
                      <KeyRound size={14} />
                      Set New Password Now →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

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

          {/* Form */}
          {!successMessage && (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                >
                  Corporate Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                  <input
                    id="reset-email"
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

              <button
                type="submit"
                id="btn-send-reset-link"
                name="btnSendResetLink"
                disabled={loading}
                className="w-full h-12 sm:h-[52px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-base transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Reset Link…
                  </span>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Return link */}
          <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Sign In
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

export default ForgotPasswordPage
