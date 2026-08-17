import React, { useEffect, useState, useCallback } from 'react'
import { Calendar, Lock, CheckCircle2, AlertCircle, Clock, ChevronDown, RotateCcw } from 'lucide-react'
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
  { value: 'not_started', label: 'Not Started', color: 'text-slate-500 bg-slate-100' },
  { value: 'in_progress', label: 'In Progress', color: 'text-blue-700 bg-blue-100' },
  { value: 'completed', label: 'Completed', color: 'text-emerald-700 bg-emerald-100' },
  { value: 'blocked', label: 'Blocked', color: 'text-red-700 bg-red-100' },
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
  <div className="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
    <div
      className={`h-full rounded-full transition-all duration-500 ${
        value >= 100 ? 'bg-emerald-500' : value >= 50 ? 'bg-blue-500' : value > 0 ? 'bg-amber-500' : 'bg-slate-300'
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
      const t = todayRes.data
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
      setHistory(allRes.data.filter((r: EmpReport) => r.date !== todayIso))
    } catch (e) {
      console.error(e)
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
  const isEditable = todayReport ? todayReport.is_editable : true // new report is always editable

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Daily Work Report</h2>
          <p className="text-xs text-slate-500 mt-0.5">Record your daily activities, learning, and progress</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
          <Calendar size={14} className="text-blue-500" />
          <span>{todayDisplay}</span>
        </div>
      </div>

      {/* Today's Report Form */}
      <div className={`bg-white rounded-xl border shadow-sm p-6 transition-all ${isFrozen ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200/80'}`}>
        {isFrozen && (
          <div className="flex items-center gap-3 bg-amber-100 border border-amber-300 text-amber-800 rounded-xl px-4 py-3 mb-5 text-sm font-semibold">
            <Lock size={18} />
            <span>🔒 This report is locked because the reporting day has ended. It is now read-only.</span>
          </div>
        )}

        {!isFrozen && message && (
          <div className={`flex items-center gap-2 text-xs font-medium rounded-lg px-4 py-2.5 mb-4 border ${
            message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5">
          {/* Today's Work */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Today's Work / Activity <span className="text-red-500">*</span>
            </label>
            <textarea
              name="today_work"
              rows={3}
              disabled={isFrozen}
              value={form.today_work}
              onChange={handleChange}
              placeholder="Describe what you worked on today — tasks completed, meetings, code written..."
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${
                isFrozen ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'
              }`}
            />
          </div>

          {/* What I Learned */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              What I Learned Today <span className="text-red-500">*</span>
            </label>
            <textarea
              name="what_learned"
              rows={3}
              disabled={isFrozen}
              value={form.what_learned}
              onChange={handleChange}
              placeholder="Key concepts, skills, tools, or insights you picked up today..."
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${
                isFrozen ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'
              }`}
            />
          </div>

          {/* Status + Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Daily Status</label>
              <select
                name="daily_status"
                disabled={isFrozen}
                value={form.daily_status}
                onChange={handleChange}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isFrozen ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300 bg-white'
                }`}
              >
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Overall Progress: <span className="text-blue-600 font-bold">{form.overall_progress}%</span>
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
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>
          </div>

          {/* Progress Bar visual */}
          <div>
            <ProgressBar value={form.overall_progress} />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Remarks / Additional Notes <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="remarks"
              rows={2}
              disabled={isFrozen}
              value={form.remarks}
              onChange={handleChange}
              placeholder="Any blockers, observations, or notes for your manager..."
              className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-colors ${
                isFrozen ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'border-slate-300'
              }`}
            />
          </div>

          {/* Action Buttons */}
          {!isFrozen && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/20"
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                ) : (
                  <><CheckCircle2 size={16} />{todayReport ? 'Update Report' : 'Save Report'}</>
                )}
              </button>

              {todayReport && (
                <div className="text-xs text-slate-400">
                  Last saved: {new Date(todayReport.updated_at).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}
        </div>

        {todayReport && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs text-slate-500">
            <div>Status: <StatusBadge status={todayReport.daily_status} /></div>
            <div>Progress: <strong className="text-slate-700">{todayReport.overall_progress}%</strong></div>
            <div>Updated: <strong className="text-slate-700">{new Date(todayReport.updated_at).toLocaleString()}</strong></div>
          </div>
        )}
      </div>

      {/* History */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Previous Reports</h3>
          <span className="text-xs text-slate-500">{history.length} records</span>
        </div>

        {loading ? (
          <div className="flex justify-center p-8"><span className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <Clock size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-xs font-medium">No previous reports found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map(r => (
              <div key={r.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-800">{r.date}</span>
                    <StatusBadge status={r.daily_status} />
                    {r.is_frozen && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                        <Lock size={10} />FROZEN
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-700">{r.overall_progress}%</span>
                </div>
                <ProgressBar value={r.overall_progress} />
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{r.today_work}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EmployeeReportPage
