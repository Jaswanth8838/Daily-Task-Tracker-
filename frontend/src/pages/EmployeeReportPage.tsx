import React, { useEffect, useState, useCallback } from 'react'
import { Calendar, Lock, CheckCircle2, AlertCircle, Clock, ChevronDown, RotateCcw, FileText } from 'lucide-react'
import api from '../lib/api'

interface EmpReport {
  id: number
  date: string
  today_work: string
  what_learned: string
  daily_status: string
  overall_progress: number
  remarks: string
  is_frozen: boolean
  is_editable: boolean
  frozen_at: string | null
  created_at: string
  updated_at: string
}

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'in_progress', label: 'In Progress', color: 'text-blue-700 bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300' },
  { value: 'completed', label: 'Completed', color: 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300' },
  { value: 'blocked', label: 'Blocked', color: 'text-red-700 bg-red-100 dark:bg-red-950/50 dark:text-red-300' },
]

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const opt = STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0]
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${opt.color}`}>
      {opt.label}
    </span>
  )
}

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="relative w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-500 ${
        value >= 100 ? 'bg-emerald-500' : value >= 50 ? 'bg-blue-500' : value > 0 ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
      }`}
      style={{ width: `${value}%` }}
    />
  </div>
)

const EmployeeReportPage: React.FC = () => {
  const todayIso = new Date().toISOString().split('T')[0]
  const todayDisplay = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  const [todayReport, setTodayReport] = useState<EmpReport | null>(null)
  const [history, setHistory] = useState<EmpReport[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [form, setForm] = useState({
    today_work: '',
    what_learned: '',
    daily_status: 'not_started',
    overall_progress: 0,
    remarks: '',
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [todayRes, allRes] = await Promise.all([
        api.get(`/reports/my/${todayIso}`),
        api.get('/reports/my'),
      ])
      const t = todayRes.data?.data || todayRes.data
      setTodayReport(t)
      if (t) {
        setForm({
          today_work: t.today_work || '',
          what_learned: t.what_learned || '',
          daily_status: t.daily_status || 'not_started',
          overall_progress: t.overall_progress || 0,
          remarks: t.remarks || '',
        })
      }
      const rawAll = allRes.data?.data || allRes.data
      const list = Array.isArray(rawAll) ? rawAll : []
      setHistory(list.filter((r: EmpReport) => r.date !== todayIso))
    } catch (e) {
      console.error('Failed to load employee reports', e)
    } finally {
      setLoading(false)
    }
  }, [todayIso])

  useEffect(() => { fetchData() }, [fetchData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: name === 'overall_progress' ? Number(value) : value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      if (todayReport) {
        await api.put(`/reports/${todayReport.id}`, form)
        setMessage({ type: 'success', text: 'Report updated successfully!' })
      } else {
        await api.post('/reports', form)
        setMessage({ type: 'success', text: 'Report created and saved!' })
      }
      fetchData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save report' })
    } finally {
      setSaving(false)
    }
  }

  const isFrozen = todayReport?.is_frozen || false

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileText className="text-blue-600 dark:text-blue-400" size={24} />
            Daily Work Report
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Record your daily activities, learning milestones, and project execution progress.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl">
          <Calendar size={15} className="text-blue-500" />
          <span>{todayDisplay}</span>
        </div>
      </div>

      {/* Today's Report Form Card */}
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border shadow-xs p-6 sm:p-8 transition-all ${
        isFrozen ? 'border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20' : 'border-slate-200/80 dark:border-slate-800'
      }`}>
        {isFrozen && (
          <div className="flex items-center gap-3 bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl px-4 py-3 mb-6 text-sm font-semibold">
            <Lock size={18} />
            <span>🔒 This report is locked because the reporting day has ended. It is now read-only.</span>
          </div>
        )}

        {!isFrozen && message && (
          <div className={`flex items-center gap-2.5 text-sm font-medium rounded-xl px-4 py-3 mb-6 border ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="space-y-5">
          {/* Today's Work */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Today's Work / Activity <span className="text-red-500">*</span>
            </label>
            <textarea
              name="today_work"
              rows={3}
              disabled={isFrozen}
              value={form.today_work}
              onChange={handleChange}
              placeholder="Describe what you worked on today — tasks completed, meetings, code written…"
              className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${
                isFrozen ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            />
          </div>

          {/* What I Learned */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              What I Learned Today <span className="text-red-500">*</span>
            </label>
            <textarea
              name="what_learned"
              rows={3}
              disabled={isFrozen}
              value={form.what_learned}
              onChange={handleChange}
              placeholder="Key concepts, skills, tools, or architectural insights you acquired today…"
              className={`w-full border rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${
                isFrozen ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            />
          </div>

          {/* Status + Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Daily Status</label>
              <select
                name="daily_status"
                disabled={isFrozen}
                value={form.daily_status}
                onChange={handleChange}
                className={`w-full h-11 border rounded-xl px-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFrozen ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white'
                }`}
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Overall Progress: <span className="text-blue-600 dark:text-blue-400 font-bold">{form.overall_progress}%</span>
              </label>
              <input
                type="range"
                name="overall_progress"
                min={0} max={100} step={5}
                disabled={isFrozen}
                value={form.overall_progress}
                onChange={handleChange}
                className={`w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600 ${isFrozen ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          </div>

          <div>
            <ProgressBar value={form.overall_progress} />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Remarks / Additional Notes <span className="text-slate-400 dark:text-slate-500 font-normal lowercase">(optional)</span>
            </label>
            <textarea
              name="remarks"
              rows={2}
              disabled={isFrozen}
              value={form.remarks}
              onChange={handleChange}
              placeholder="Any blockers, observations, or feedback for your supervisor…"
              className={`w-full border rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${
                isFrozen ? 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 text-slate-500 cursor-not-allowed' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            />
          </div>

          {/* Action Buttons */}
          {!isFrozen && (
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-bold px-6 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                ) : (
                  <><CheckCircle2 size={16} />{todayReport ? 'Update Report' : 'Save Report'}</>
                )}
              </button>

              {todayReport && (
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  Last saved: {new Date(todayReport.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* History Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 dark:text-white">Previous Work Reports</h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
            {history.length} records
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500">
            <Clock size={32} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No previous reports found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {history.map(r => (
              <div key={r.id} className="px-6 py-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-800 dark:text-white">{r.date}</span>
                    <StatusBadge status={r.daily_status} />
                    {r.is_frozen && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded font-bold">
                        <Lock size={10} />FROZEN
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{r.overall_progress}%</span>
                </div>
                <ProgressBar value={r.overall_progress} />
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">{r.today_work}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeReportPage
