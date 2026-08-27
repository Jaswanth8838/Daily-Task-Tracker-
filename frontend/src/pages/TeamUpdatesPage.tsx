import React, { useEffect, useState } from 'react'
import { Users, Filter, Search, CheckCircle2, Lock, AlertCircle } from 'lucide-react'
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

  const fetchTeamUpdates = async () => {
    setLoading(true)
    try {
      const res = await api.get('/tracker/team-updates')
      setUpdates(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTeamUpdates()
  }, [])

  const filteredUpdates = updates.filter(u => {
    const matchesSearch =
      (u.intern_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.intern_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.technology_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.trainer_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.update_text || '').toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="text-blue-600 dark:text-blue-400" size={24} />
            Team Daily Updates Monitor
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Read-only monitoring view of daily task logs submitted by interns across training programs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-3.5 py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-700">
            Total Logged Entries: <strong className="text-blue-600 dark:text-blue-400">{updates.length}</strong>
          </span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="relative w-full sm:w-80">
          <label htmlFor="search-team-updates" className="sr-only">Search Team Updates</label>
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-team-updates"
            name="searchTeamUpdates"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search intern name, email, tech, trainer..."
            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Filter size={15} className="text-slate-400" />
          <label htmlFor="filter-team-status" className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Status:</label>
          <select
            id="filter-team-status"
            name="filterTeamStatus"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="frozen">Frozen</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Table - Pure Monitoring (Actions / Controls Column Completely Removed) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading team updates…</p>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No team updates found</p>
            <p className="text-xs text-slate-400 mt-1">Submitted updates will appear here automatically when logged by interns.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Intern</th>
                  <th className="px-4 py-4">Date</th>
                  <th className="px-4 py-4">Session</th>
                  <th className="px-4 py-4">Technology</th>
                  <th className="px-4 py-4">Trainer</th>
                  <th className="px-4 py-4">Duration</th>
                  <th className="px-6 py-4">Update Details</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredUpdates.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-white text-sm">{u.intern_name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-normal">{u.intern_email}</div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{u.date}</td>
                    <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">{u.session_name}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-900/60">
                        {u.technology_name}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">{u.trainer_name}</td>
                    <td className="px-4 py-4 font-bold text-slate-800 dark:text-white whitespace-nowrap">{u.duration_hrs}h</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-[280px] leading-relaxed" title={u.update_text}>
                      {u.update_text}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                          u.status === 'submitted'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
                            : u.status === 'frozen'
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60'
                        }`}
                      >
                        {u.status === 'submitted' ? <CheckCircle2 size={13} /> : u.status === 'frozen' ? <Lock size={13} /> : <AlertCircle size={13} />}
                        {u.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default TeamUpdatesPage
