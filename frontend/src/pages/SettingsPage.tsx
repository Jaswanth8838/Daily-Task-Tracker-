import React, { useState } from 'react'
import { User, Lock, Save, Shield, Mail, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

const SettingsPage: React.FC = () => {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }

    if (password && password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long.' })
      return
    }

    setLoading(true)
    try {
      await api.put('/auth/profile', {
        name,
        password: password || undefined
      })
      setMessage({ type: 'success', text: 'Profile and security settings updated successfully!' })
      setPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile settings.' })
    } finally {
      setLoading(false)
    }
  }

  const roleBadgeStyle = user?.role === 'hr' || user?.role === 'admin'
    ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/60'
    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60'

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <User className="text-blue-600 dark:text-blue-400" size={24} />
            Account &amp; Profile Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your personal profile details, contact information, and account security credentials.
          </p>
        </div>
        <div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${roleBadgeStyle}`}>
            <Shield size={14} />
            Role: {(user?.role || 'Intern').toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Settings Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 sm:p-8">
        
        {/* Status Alert Notification */}
        {message && (
          <div
            role="alert"
            className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3 border ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          
          {/* Profile Section */}
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-1">
              Personal Information
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Your personal profile details visible to supervisors and administrators.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="settings-name"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <User size={16} />
                  </span>
                  <input
                    id="settings-name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="settings-email"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
                >
                  Corporate Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Mail size={16} />
                  </span>
                  <input
                    id="settings-email"
                    name="email"
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full h-11 pl-10 pr-4 border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/50 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                  Corporate email is assigned by HR and cannot be modified.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200/80 dark:border-slate-800 my-6" />

          {/* Password Security Section */}
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
              <KeyRound size={18} className="text-blue-600 dark:text-blue-400" />
              Change Security Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Leave these fields blank if you do not wish to update your current account password.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="settings-new-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
                >
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    id="settings-new-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full h-11 pl-10 pr-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="settings-confirm-password"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <Lock size={16} />
                  </span>
                  <input
                    id="settings-confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full h-11 pl-10 pr-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-start">
            <button
              type="submit"
              id="btn-save-settings"
              name="btnSaveSettings"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Save size={16} />
              {loading ? 'Saving Changes…' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SettingsPage
