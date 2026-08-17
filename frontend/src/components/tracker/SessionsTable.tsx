import React, { useEffect, useState } from 'react'
import { Plus, MonitorPlay, Calendar, Clock, X, CheckCircle2, Clipboard } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

interface Session {
  id: number
  session_title: string
  trainer_name: string
  technology_name: string
  concepts: string | null
  duration_hrs: number
  date: string
  status: string
  practice_assignment: string | null
}

const SessionsTable: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger }) => {
  const { user } = useAuth()
  const isManagerOrHr = user?.role === 'hr' || user?.role === 'manager' || user?.role === 'admin'

  const [sessions, setSessions] = useState<Session[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)

  const [form, setForm] = useState({
    session_title: '',
    trainer_name: '',
    technology_name: '',
    concepts: '',
    duration_hrs: '2.0',
  })

  const [practiceForm, setPracticeForm] = useState({
    practice_assignment: '',
  })

  const fetchSessions = async () => {
    try {
      const res = await api.get('/tracker/sessions')
      setSessions(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [refreshTrigger])

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/tracker/sessions', {
        ...form,
        duration_hrs: parseFloat(form.duration_hrs),
      })
      setModalOpen(false)
      setForm({ session_title: '', trainer_name: '', technology_name: '', concepts: '', duration_hrs: '2.0' })
      fetchSessions()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create session')
    }
  }

  const handleCompleteSession = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSession) return
    try {
      await api.put(`/tracker/sessions/${selectedSession.id}`, {
        status: 'completed',
        practice_assignment: practiceForm.practice_assignment,
      })
      setCompleteModalOpen(false)
      setPracticeForm({ practice_assignment: '' })
      setSelectedSession(null)
      fetchSessions()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update session')
    }
  }

  const openCompleteModal = (session: Session) => {
    setSelectedSession(session)
    setPracticeForm({ practice_assignment: session.practice_assignment || '' })
    setCompleteModalOpen(true)
  }

  const totalDuration = sessions.reduce((acc, s) => acc + (s.duration_hrs || 0), 0)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Training Sessions</h2>
            <p className="text-xs text-slate-500">Live schedule and recorded domain classes</p>
          </div>
          {isManagerOrHr && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={13} />
              Add Session
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold text-left">
                <th className="pb-2.5 pr-3">Session Title</th>
                <th className="pb-2.5 pr-3">Trainer</th>
                <th className="pb-2.5 pr-3">Technology</th>
                <th className="pb-2.5 pr-3">Concepts</th>
                <th className="pb-2.5 pr-3 text-center">Status</th>
                <th className="pb-2.5 pr-3">Practice Task</th>
                {isManagerOrHr && <th className="pb-2.5 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sessions.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 pr-3 font-semibold text-slate-800">{s.session_title}</td>
                  <td className="py-2.5 pr-3 text-slate-600">{s.trainer_name}</td>
                  <td className="py-2.5 pr-3">
                    <span className="inline-block bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded border border-blue-100">
                      {s.technology_name}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-500 max-w-[120px] truncate">{s.concepts || '-'}</td>
                  <td className="py-2.5 pr-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      s.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-500 max-w-[150px] truncate" title={s.practice_assignment || ''}>
                    {s.practice_assignment || '—'}
                  </td>
                  {isManagerOrHr && (
                    <td className="py-2.5 text-center">
                      {s.status !== 'completed' ? (
                        <button
                          onClick={() => openCompleteModal(s)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 hover:text-emerald-800 transition-colors border border-emerald-200 bg-emerald-50 px-2 py-1 rounded"
                        >
                          <CheckCircle2 size={11} /> Complete
                        </button>
                      ) : (
                        <button
                          onClick={() => openCompleteModal(s)}
                          className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          Edit Task
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={isManagerOrHr ? 7 : 6} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-1.5 text-slate-400">
                      <MonitorPlay size={28} className="opacity-40" />
                      <p className="text-xs font-medium">No training sessions scheduled yet</p>
                      {isManagerOrHr && (
                        <button
                          onClick={() => setModalOpen(true)}
                          className="text-xs text-blue-600 hover:underline mt-1"
                        >
                          + Create first session
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Total Scheduled Time: <strong className="text-slate-800">{totalDuration.toFixed(1)} hrs</strong>
        </span>
        <span className="text-slate-400">{sessions.length} sessions total</span>
      </div>

      {/* Add Session Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-800">Schedule New Training Session</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateSession} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Session Title *</label>
                <input
                  type="text"
                  required
                  value={form.session_title}
                  onChange={e => setForm({ ...form, session_title: e.target.value })}
                  placeholder="e.g. React Hooks Deep Dive"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Trainer *</label>
                  <input
                    type="text"
                    required
                    value={form.trainer_name}
                    onChange={e => setForm({ ...form, trainer_name: e.target.value })}
                    placeholder="Trainer Name"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Technology *</label>
                  <input
                    type="text"
                    required
                    value={form.technology_name}
                    onChange={e => setForm({ ...form, technology_name: e.target.value })}
                    placeholder="e.g. Frontend"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Concepts Covered</label>
                <input
                  type="text"
                  value={form.concepts}
                  onChange={e => setForm({ ...form, concepts: e.target.value })}
                  placeholder="useEffect, useMemo, custom hooks"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Duration (Hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.duration_hrs}
                  onChange={e => setForm({ ...form, duration_hrs: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-xs"
                >
                  Create Session
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete & Assign Practice Task Modal */}
      {completeModalOpen && selectedSession && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Complete Session &amp; Assign Practice</h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{selectedSession.session_title} ({selectedSession.technology_name})</p>
              </div>
              <button onClick={() => setCompleteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCompleteSession} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                  <Clipboard size={14} className="text-blue-500" />
                  Practice Assignment Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={practiceForm.practice_assignment}
                  onChange={e => setPracticeForm({ practice_assignment: e.target.value })}
                  placeholder="Define the coding challenge or task the interns must practice and submit progress for..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 resize-none text-slate-700"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-xs shadow-sm shadow-emerald-600/10"
                >
                  Save &amp; Notify Interns
                </button>
                <button
                  type="button"
                  onClick={() => setCompleteModalOpen(false)}
                  className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SessionsTable
