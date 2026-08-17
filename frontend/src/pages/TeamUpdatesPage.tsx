import React, { useEffect, useState } from 'react'
import { Users, Filter, Search, Lock, Unlock, CheckCircle2, FileSpreadsheet, Eye } from 'lucide-react'
import api from '../lib/api'

interface TeamUpdate {
  id: number
  intern_name: string
  intern_email: string
  date: string
  trainer_name: string
  technology_name: string
  session_name: string
  concepts_covered: string
  duration_hrs: number
  update_text: string
  status: string
}

const TeamUpdatesPage: React.FC = () => {
  const [updates, setUpdates] = useState<TeamUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUpdate, setSelectedUpdate] = useState<TeamUpdate | null>(null)

  const fetchTeamUpdates = async () => {
    setLoading(true)
    try {
      const res = await api.get('/tracker/team-updates')
      setUpdates(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamUpdates()
  }, [])

  const handleToggleLock = async (updateId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'locked' ? 'submitted' : 'locked'
    try {
      await api.put(`/tracker/update/${updateId}/lock`, { status: nextStatus })
      fetchTeamUpdates()
    } catch (err) {
      console.error(err)
    }
  }

  const handleApprove = async (updateId: number) => {
    try {
      await api.put(`/tracker/update/${updateId}/lock`, { status: 'approved' })
      fetchTeamUpdates()
    } catch (err) {
      console.error(err)
    }
  }

  const filteredUpdates = updates.filter(u => {
    const matchesSearch =
      u.intern_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.intern_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.technology_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.trainer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.update_text.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Team Updates & Reviews</h2>
          <p className="text-xs text-slate-500 mt-0.5">Review, approve, and manage daily task logs from your assigned interns</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-medium border border-slate-200">
            Total Team Updates: <strong>{updates.length}</strong>
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by intern name, email, tech, trainer..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="submitted">Submitted</option>
            <option value="locked">Locked</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="px-5 py-3">Intern</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Technology</th>
                  <th className="px-5 py-3">Trainer</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Update Summary</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Actions / Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUpdates.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-800">{u.intern_name}</div>
                      <div className="text-[10px] text-slate-400">{u.intern_email}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700 whitespace-nowrap">{u.date}</td>
                    <td className="px-5 py-3.5">
                      <span className="bg-blue-50 text-blue-700 font-medium px-2 py-0.5 rounded border border-blue-100">
                        {u.technology_name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{u.trainer_name}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{u.duration_hrs}h</td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-[200px] truncate" title={u.update_text}>
                      {u.update_text}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.status === 'locked'
                            ? 'bg-amber-100 text-amber-800'
                            : u.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.status === 'locked' ? <Lock size={10} /> : <CheckCircle2 size={10} />}
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedUpdate(u)}
                          title="View Full Update"
                          className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleLock(u.id, u.status)}
                          title={u.status === 'locked' ? 'Unlock Update' : 'Lock Update'}
                          className={`p-1 rounded transition-colors ${
                            u.status === 'locked'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                          }`}
                        >
                          {u.status === 'locked' ? <Lock size={15} /> : <Unlock size={15} />}
                        </button>
                        {u.status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(u.id)}
                            title="Approve Update"
                            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUpdates.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">
                      <Users size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="font-medium text-xs">No team updates found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedUpdate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Update from {selectedUpdate.intern_name}</h3>
                <p className="text-xs text-slate-500">{selectedUpdate.intern_email} • {selectedUpdate.date}</p>
              </div>
              <button
                onClick={() => setSelectedUpdate(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div><span className="text-slate-400">Technology:</span> <strong>{selectedUpdate.technology_name}</strong></div>
                <div><span className="text-slate-400">Trainer:</span> <strong>{selectedUpdate.trainer_name}</strong></div>
                <div><span className="text-slate-400">Session:</span> <strong>{selectedUpdate.session_name}</strong></div>
                <div><span className="text-slate-400">Duration:</span> <strong>{selectedUpdate.duration_hrs} hours</strong></div>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Concepts Covered:</span>
                <p className="bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-700">{selectedUpdate.concepts_covered || 'None specified'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Detailed Description:</span>
                <p className="bg-slate-50 p-3 rounded border border-slate-100 text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedUpdate.update_text}
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => handleToggleLock(selectedUpdate.id, selectedUpdate.status)}
                className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs px-4 py-2 rounded-lg font-medium"
              >
                {selectedUpdate.status === 'locked' ? 'Unlock Entry' : 'Lock Entry'}
              </button>
              <button
                onClick={() => setSelectedUpdate(null)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TeamUpdatesPage
