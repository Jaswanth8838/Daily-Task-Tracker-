import React, { useEffect, useState } from 'react'
import { Plus, Users, Calendar, Clock, X, CheckCircle2 } from 'lucide-react'
import api from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

interface Meeting {
  id: number
  title: string
  time: string
  date: string
  description: string | null
  status: string
}

const MeetingsTable: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger }) => {
  const { user } = useAuth()
  const isManagerOrHr = user?.role === 'hr' || user?.role === 'manager' || user?.role === 'admin'

  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  
  const [form, setForm] = useState({
    title: '',
    time: '',
    description: '',
  })

  const fetchMeetings = async () => {
    try {
      const res = await api.get('/tracker/meetings')
      setMeetings(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchMeetings()
  }, [refreshTrigger])

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/tracker/meetings', form)
      setModalOpen(false)
      setForm({ title: '', time: '', description: '' })
      fetchMeetings()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to schedule meeting')
    }
  }

  const handleCompleteMeeting = async (id: number) => {
    try {
      await api.put(`/tracker/meetings/${id}`, {
        status: 'completed',
      })
      fetchMeetings()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update meeting')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Assigned Meetings &amp; Standups</h2>
            <p className="text-xs text-slate-500">Scheduled alignment calls and sync-up sessions</p>
          </div>
          {isManagerOrHr && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={13} />
              Schedule Meeting
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500 font-semibold text-left">
                <th className="pb-2.5 pr-3">Meeting Title</th>
                <th className="pb-2.5 pr-3">Time</th>
                <th className="pb-2.5 pr-3">Description</th>
                <th className="pb-2.5 pr-3 text-center">Status</th>
                <th className="pb-2.5">Date</th>
                {isManagerOrHr && <th className="pb-2.5 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {meetings.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 pr-3 font-semibold text-slate-800">{m.title}</td>
                  <td className="py-2.5 pr-3 text-slate-600 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-slate-400" />
                      {m.time || '—'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-500 max-w-[150px] truncate" title={m.description || ''}>
                    {m.description || '—'}
                  </td>
                  <td className="py-2.5 pr-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      m.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {m.status}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-500">{m.date}</td>
                  {isManagerOrHr && (
                    <td className="py-2.5 text-center">
                      {m.status !== 'completed' && (
                        <button
                          onClick={() => handleCompleteMeeting(m.id)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600 hover:text-emerald-800 transition-colors border border-emerald-200 bg-emerald-50 px-2 py-1 rounded"
                        >
                          <CheckCircle2 size={11} /> Mark Done
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {meetings.length === 0 && (
                <tr>
                  <td colSpan={isManagerOrHr ? 6 : 5} className="py-10 text-center">
                    <div className="flex flex-col items-center gap-1.5 text-slate-400">
                      <Users size={28} className="opacity-40" />
                      <p className="text-xs font-medium">No meetings assigned yet</p>
                      {isManagerOrHr && (
                        <button
                          onClick={() => setModalOpen(true)}
                          className="text-xs text-purple-600 hover:underline mt-1"
                        >
                          + Schedule first meeting
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
        <span className="text-slate-400">{meetings.length} meetings total</span>
      </div>

      {/* Schedule Meeting Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-bold text-slate-800">Schedule New Assigned Meeting</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleCreateMeeting} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Meeting Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Weekly Review Meeting"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Timing / Clock Slot *</label>
                <input
                  type="text"
                  required
                  value={form.time}
                  onChange={e => setForm({ ...form, time: e.target.value })}
                  placeholder="e.g. 11:30 AM - 12:00 PM"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Agenda points or sync focus..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg text-xs"
                >
                  Schedule &amp; Notify
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
    </div>
  )
}

export default MeetingsTable
