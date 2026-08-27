import React, { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2, KeyRound } from 'lucide-react'
import { WallstreetFullLogo } from '../components/layout/WallstreetLogo'
import api from '../lib/api'

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialToken = searchParams.get('token') || ''

  const [token, setToken] = useState(initialToken)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError(null)

    if (!token.trim()) {
      setError('Password reset token is missing or invalid.')
      return
    }

    if (!password) {
      setError('Please enter a new password.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please try again.')
      return
    }

    setLoading(true)
    try {
      await api.post('/auth/reset-password', {
        token: token.trim(),
        password: password
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password. The link may be expired or invalid.')
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

      {/* Main Card */}
      <div className="w-full max-w-[560px] my-auto py-8">
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
              Reset Password
            </h2>
            <p className="text-sm font-normal text-slate-500 dark:text-slate-400 mt-2">
              Enter your new corporate password.
            </p>
          </div>

          {/* Success Banner */}
          {success ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-6 text-center">
              <CheckCircle2 size={44} className="text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Password Reset Complete</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                Your password has been successfully updated. You can now sign in with your new credentials.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-base transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                <span>Sign In Now</span>
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <>
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

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                
                {/* Reset Token field (if not provided in query string) */}
                {!initialToken && (
                  <div>
                    <label
                      htmlFor="reset-token"
                      className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                    >
                      Reset Token <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                      <input
                        id="reset-token"
                        name="token"
                        type="text"
                        required
                        placeholder="Enter your reset token"
                        value={token}
                        onChange={e => setToken(e.target.value)}
                        className="w-full h-12 sm:h-[52px] pl-12 pr-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-base text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                  >
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      id="new-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Enter your new password"
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

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                  >
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="w-full h-12 sm:h-[52px] pl-12 pr-12 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-base text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-medium disabled:opacity-60 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-reset-password-submit"
                  name="btnResetPasswordSubmit"
                  disabled={loading}
                  className="w-full h-12 sm:h-[52px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-base transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting Password…
                    </span>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Return link */}
          <div className="mt-8 border-t border-slate-100 dark:border-slate-800 pt-6 text-center">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 inline-flex items-center gap-2 transition-colors"
            >
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

export default ResetPasswordPage
