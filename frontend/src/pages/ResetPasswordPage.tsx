import React, { useState, useEffect } from 'react'
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { Lock, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2, KeyRound, RefreshCw } from 'lucide-react'
import { WallstreetFullLogo } from '../components/layout/WallstreetLogo'
import api from '../lib/api'

const ResetPasswordPage: React.FC = () => {
  const { token: routeToken } = useParams<{ token?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const rawToken = routeToken || searchParams.get('token') || ''

  const [token, setToken] = useState(rawToken)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(Boolean(rawToken))
  const [tokenInvalid, setTokenInvalid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    if (rawToken) {
      setVerifying(true)
      api.get(`/auth/verify-reset-token/${encodeURIComponent(rawToken.trim())}`)
        .then(res => {
          setTokenInvalid(false)
          if (res.data?.email) {
            setUserEmail(res.data.email)
          }
        })
        .catch(err => {
          setTokenInvalid(true)
          setError(err.response?.data?.error || 'Invalid or expired password reset link.')
        })
        .finally(() => setVerifying(false))
    }
  }, [rawToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || tokenInvalid) return
    setError(null)

    const activeToken = token.trim()
    if (!activeToken) {
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
        token: activeToken,
        password: password
      })
      setSuccess(true)
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to reset password. The link may be expired or invalid.'
      setError(errMsg)
      if (
        errMsg.toLowerCase().includes('expired') ||
        errMsg.toLowerCase().includes('already been used') ||
        errMsg.toLowerCase().includes('invalid')
      ) {
        setTokenInvalid(true)
      }
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
              {userEmail ? `Enter a new corporate password for ${userEmail}.` : 'Enter your new corporate password.'}
            </p>
          </div>

          {/* Verifying Token State */}
          {verifying ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Verifying reset link…</p>
            </div>
          ) : success ? (
            /* Success Banner */
            <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <CheckCircle2 size={44} className="text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Password Reset Complete</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                Password reset successfully. You can now sign in with your new password.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-base transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Sign In Now</span>
                <ArrowRight size={18} />
              </button>
            </div>
          ) : tokenInvalid ? (
            /* Invalid / Expired Token Banner */
            <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
              <AlertCircle size={44} className="text-red-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Link Expired or Invalid</h3>
              <p className="text-sm text-red-700 dark:text-red-400 mb-6 leading-relaxed">
                {error || 'This password reset link is invalid or has expired.'}
              </p>
              <Link
                to="/forgot-password"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-base transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                <span>Request a New Reset Link</span>
                <ArrowRight size={18} />
              </Link>
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
                
                {/* Reset Token field (if not provided in route or query string) */}
                {!rawToken && (
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
                      placeholder="Enter at least 6 characters"
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
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Minimum 6 characters</p>
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
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="w-full h-12 sm:h-[52px] pl-12 pr-12 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-base text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 font-medium disabled:opacity-60 transition-all"
                    />
                    <button
                      type="button"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-reset-password-submit"
                  name="btnResetPasswordSubmit"
                  disabled={loading}
                  className="w-full h-12 sm:h-[52px] bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-base transition-all shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 mt-4 cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Changing Password…
                    </span>
                  ) : (
                    <>
                      <span>Change Password</span>
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
              <ArrowRight size={16} className="rotate-180" />
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
