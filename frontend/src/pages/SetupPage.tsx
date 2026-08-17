import React, { useState } from 'react'
import { Waves, Eye, EyeOff, CheckCircle } from 'lucide-react'
import api from '../lib/api'

interface Props {
  onSetupComplete: () => void
}

interface FieldErrors {
  name?: string
  email?: string
  password?: string
  confirm_password?: string
  general?: string
}

const SetupPage: React.FC<Props> = ({ onSetupComplete }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name as keyof FieldErrors]) {
      setErrors(e => ({ ...e, [name]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setLoading(true)
    try {
      await api.post('/setup/init', form)
      setSuccess(true)
      setTimeout(onSetupComplete, 1800)
    } catch (err: any) {
      const data = err.response?.data
      if (data?.errors) setErrors(data.errors)
      else setErrors({ general: data?.error || 'Failed to create account' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mb-3 shadow-lg">
            <Waves size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800">Task Tracker</h1>
          <p className="text-sm text-slate-500 mt-1">Internal Training Management</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {success ? (
            <div className="flex flex-col items-center py-6 gap-3 text-center">
              <CheckCircle className="text-green-500" size={48} />
              <h2 className="text-lg font-semibold text-slate-800">Account Created!</h2>
              <p className="text-sm text-slate-500">Redirecting to login…</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-800">Welcome! Create HR Account</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Set up the first administrator account to get started.
                </p>
              </div>

              {errors.general && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Anjali Sharma"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="hr@company.com"
                    className={`w-full border rounded-lg px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.email ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Minimum 8 characters"
                      className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.password ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                    />
                    <button type="button" onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      name="confirm_password"
                      type={showConfirm ? 'text' : 'password'}
                      value={form.confirm_password}
                      onChange={handleChange}
                      placeholder="Re-enter your password"
                      className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${errors.confirm_password ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                    />
                    <button type="button" onClick={() => setShowConfirm(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirm_password && <p className="text-xs text-red-600 mt-1">{errors.confirm_password}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors mt-2 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating Account…
                    </>
                  ) : 'Create HR Account'}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-xs text-slate-400 mt-6">© 2025 Task Tracker. All rights reserved.</p>
      </div>
    </div>
  )
}

export default SetupPage
