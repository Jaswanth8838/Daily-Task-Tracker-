import React, { useEffect, useState, useCallback } from 'react'
import { Calendar, Lock, CheckCircle2, AlertCircle, BookOpen, Users, Code2 } from 'lucide-react'
import api from '../lib/api'

interface InternReport {
  id: number
  date: string
  training_details: string
  training_status: string
  training_progress: number
  meeting_details: string
  meeting_status: string
  meeting_notes: string
  practice_details: string
  practice_status: string
  practice_progress: number
  overall_status: string
  is_frozen: boolean
  is_editable: boolean
  created_at: string
  updated_at: string
}

interface TrainingSession {
  id: number
  session_title: string
  trainer_name: string
  technology_name: string
  date: string
  status: string
  practice_assignment: string | null
}

const STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
]

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-red-100 text-red-700',
}

const Section: React.FC<{
  icon: React.ReactNode
  title: string
  color: string
  children: React.ReactNode
}> = ({ icon, title, color, children }) => (
  <div className={`rounded-xl border ${color} p-5`}>
    <div className="flex items-center gap-2 mb-4">
      <div className="p-1.5 rounded-lg bg-white/70">{icon}</div>
      <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    </div>
    {children}
  </div>
)

const InternReportPage: React.FC = () => {
  const todayIso = new Date().toISOString().split('T')[0]
  const todayDisplay = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })

  const [todayReport, setTodayReport] = useState<InternReport | null>(null)
  const [history, setHistory] = useState<InternReport[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [assignedPractice, setAssignedPractice] = useState<string | null>(null)
  const [assignedMeeting, setAssignedMeeting] = useState<string | null>(null)

  const [form, setForm] = useState({
    training_details: '', training_status: 'not_started', training_progress: 0,
    meeting_details: '', meeting_status: 'not_started', meeting_notes: '',
    practice_details: '', practice_status: 'not_started', practice_progress: 0,
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [todayRes, allRes, sessionsRes, meetingsRes] = await Promise.all([
        api.get(`/intern-reports/my/${todayIso}`),
        api.get('/intern-reports/my'),
        api.get('/tracker/sessions'),
        api.get('/tracker/meetings'),
      ])
      
      const t = todayRes.data
      setTodayReport(t)

      // Fetch today's completed session practice assignment
      const todaySessions = (sessionsRes.data as TrainingSession[]).filter(
        s => s.date === todayIso && s.status === 'completed' && s.practice_assignment
      )
      const latestPractice = todaySessions.length > 0 ? todaySessions[0].practice_assignment : null
      setAssignedPractice(latestPractice)

      // Fetch today's assigned meetings (scheduled or completed)
      const todayMeetings = (meetingsRes.data as any[]).filter(
        m => m.date === todayIso
      )
      const latestMeeting = todayMeetings.length > 0 
        ? `${todayMeetings[0].title} (${todayMeetings[0].time || 'No time set'})`
        : null
      setAssignedMeeting(latestMeeting)

      setForm({
        training_details: t?.training_details || '',
        training_status: t?.training_status || 'not_started',
        training_progress: t?.training_progress || 0,
        meeting_details: t?.meeting_details || latestMeeting || '',
        meeting_status: t?.meeting_status || 'not_started',
        meeting_notes: t?.meeting_notes || '',
        practice_details: t?.practice_details || latestPractice || '',
        practice_status: t?.practice_status || 'not_started',
        practice_progress: t?.practice_progress || 0,
      })

      setHistory(allRes.data.filter((r: InternReport) => r.date !== todayIso))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [todayIso])

  useEffect(() => { fetchData() }, [fetchData])

  const handleChange = (field: string, value: string | number) => {
    setForm(f => ({ ...f, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      if (todayReport) {
        await api.put(`/intern-reports/${todayReport.id}`, form)
        setMessage({ type: 'success', text: 'Report updated successfully!' })
      } else {
        await api.post('/intern-reports', form)
        setMessage({ type: 'success', text: 'Intern report created!' })
      }
      fetchData()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save report' })
    } finally {
      setSaving(false)
    }
  }

  const isFrozen = todayReport?.is_frozen || false

  const computedOverall = (() => {
    const statuses = [form.training_status, form.meeting_status, form.practice_status]
    if (statuses.every(s => s === 'completed')) return 'completed'
    if (statuses.some(s => s === 'blocked')) return 'blocked'
    if (statuses.some(s => s === 'in_progress' || s === 'completed')) return 'in_progress'
    return 'not_started'
  })()

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">Intern Daily Report</h2>
          <p className="text-xs text-slate-500">Track training, meetings, and practice for the day</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg">
          <Calendar size={14} className="text-blue-500" />
          <span>{todayDisplay}</span>
        </div>
      </div>

      {/* Freeze Banner */}
      {isFrozen && (
        <div className="flex items-center gap-3 bg-amber-100 border border-amber-300 text-amber-800 rounded-xl px-4 py-3 text-sm font-semibold">
          <Lock size={18} />
          🔒 This report is locked because the reporting day has ended. It is read-only.
        </div>
      )}

      {/* Save Message */}
      {!isFrozen && message && (
        <div className={`flex items-center gap-2 text-xs font-medium rounded-xl px-4 py-2.5 border ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <CheckCircle2 size={15} />
          {message.text}
        </div>
      )}

      {/* Three Sections */}
      {loading ? (
        <div className="flex justify-center p-10"><span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          
          {/* Section: Training */}
          <Section icon={<BookOpen size={16} className="text-blue-600" />} title="1. Daily Training Details (Updated individually)" color="border-blue-200 bg-blue-50/40">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">What you learned today</label>
                <textarea
                  rows={3}
                  disabled={isFrozen}
                  value={form.training_details}
                  onChange={e => handleChange('training_details', e.target.value)}
                  placeholder="Describe your training sessions, concepts learned, domain covered..."
                  className={`w-full border rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    isFrozen ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500' : 'border-slate-300'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    disabled={isFrozen}
                    value={form.training_status}
                    onChange={e => handleChange('training_status', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isFrozen ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Progress: <span className="text-blue-600">{form.training_progress}%</span>
                  </label>
                  <input
                    type="range" min={0} max={100} step={5}
                    disabled={isFrozen}
                    value={form.training_progress}
                    onChange={e => handleChange('training_progress', Number(e.target.value))}
                    className={`w-full accent-blue-600 ${isFrozen ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Section: Meetings */}
          <Section icon={<Users size={16} className="text-purple-600" />} title="2. Meetings & Standups (Assigned by Admin)" color="border-purple-200 bg-purple-50/40">
            <div className="space-y-3">
              {assignedMeeting ? (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wide">Today's Assigned Meeting</span>
                  <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">{assignedMeeting}</p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-xs text-amber-800 font-medium">
                  <AlertCircle size={14} className="text-amber-600" />
                  No assigned meeting scheduled for today yet. You can log custom meetings below.
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meetings Attended</label>
                <textarea
                  rows={2}
                  disabled={isFrozen || !!assignedMeeting}
                  value={form.meeting_details}
                  onChange={e => handleChange('meeting_details', e.target.value)}
                  placeholder={assignedMeeting ? "" : "E.g. Daily Standup, Mentor Review Session, Team Alignment Meet..."}
                  className={`w-full border rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    isFrozen || !!assignedMeeting ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500' : 'border-slate-300'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    disabled={isFrozen}
                    value={form.meeting_status}
                    onChange={e => handleChange('meeting_status', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isFrozen ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Notes / Takeaways</label>
                  <textarea
                    rows={2}
                    disabled={isFrozen}
                    value={form.meeting_notes}
                    onChange={e => handleChange('meeting_notes', e.target.value)}
                    placeholder="Key deliverables discussed, feedback received..."
                    className={`w-full border rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                      isFrozen ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500' : 'border-slate-300'
                    }`}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Section: Practice */}
          <Section icon={<Code2 size={16} className="text-emerald-600" />} title="3. Practice & Assignment (Daily assigned by Admin)" color="border-emerald-200 bg-emerald-50/40">
            <div className="space-y-3">
              {assignedPractice ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">Today's Practice Task Assigned by Admin</span>
                  <p className="text-xs text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed">{assignedPractice}</p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-2 text-xs text-amber-800 font-medium">
                  <AlertCircle size={14} />
                  No direct practice task assigned by admin for today yet. You can log self-study progress below.
                </div>
              )}
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Practice Details & Deliverables</label>
                <textarea
                  rows={3}
                  disabled={isFrozen || !!assignedPractice}
                  value={form.practice_details}
                  onChange={e => handleChange('practice_details', e.target.value)}
                  placeholder={assignedPractice ? "" : "Describe coding assignments, algorithms solved, or project code practice..."}
                  className={`w-full border rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${
                    isFrozen || !!assignedPractice ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500' : 'border-slate-300'
                  }`}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    disabled={isFrozen}
                    value={form.practice_status}
                    onChange={e => handleChange('practice_status', e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isFrozen ? 'bg-slate-100 border-slate-200 cursor-not-allowed text-slate-500' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Practice Progress: <span className="text-emerald-600">{form.practice_progress}%</span>
                  </label>
                  <input
                    type="range" min={0} max={100} step={5}
                    disabled={isFrozen}
                    value={form.practice_progress}
                    onChange={e => handleChange('practice_progress', Number(e.target.value))}
                    className={`w-full accent-emerald-600 ${isFrozen ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Overall Status */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">Overall Daily Status</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${STATUS_COLORS[computedOverall]}`}>
                {computedOverall.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
              </span>
            </div>
            {!isFrozen && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-blue-600/20"
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Saving…</>
                ) : (
                  <><CheckCircle2 size={15} />{todayReport ? 'Update Report' : 'Save Report'}</>
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Previous Reports</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {history.map(r => (
              <div key={r.id} className="px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-700">{r.date}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${STATUS_COLORS[r.overall_status]}`}>
                    {r.overall_status.replace('_', ' ')}
                  </span>
                  {r.is_frozen && (
                    <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                      <Lock size={10} />FROZEN
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default InternReportPage
