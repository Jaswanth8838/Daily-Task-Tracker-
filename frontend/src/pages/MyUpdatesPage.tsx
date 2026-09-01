import React, { useEffect, useState, useCallback } from 'react'
import { FileText, Calendar, Filter, Search, CheckCircle2, Clock, BookOpen, User as UserIcon, Code2, Eye, X, RefreshCw } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

interface DailySessionUpdate {
  id: number
  date: string
  session_number: number
  session_name: string
  trainer_name: string
  technology_name: string
  concepts_covered: string
  duration_hrs: number
  update_text: string
  status: string
  created_at: string
}

const ITEMS_PER_PAGE = 12

const MyUpdatesPage: React.FC = () => {
  const { user } = useAuth()
  const [updates, setUpdates] = useState<DailySessionUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedUpdate, setSelectedUpdate] = useState<DailySessionUpdate | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchMyUpdates = useCallback(async () => {
    try {
      const res = await api.get('/tracker/my-updates')
      const payload = res.data?.data || res.data
      const list = Array.isArray(payload)
        ? payload
        : (Array.isArray(payload?.updates) ? payload.updates : [])
      setUpdates(list)
    } catch (err) {
      console.error('Failed to fetch my updates', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchMyUpdates()
  }, [fetchMyUpdates])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchMyUpdates()
  }

  // Filter updates
  const filteredUpdates = updates.filter(u => {
    const term = searchTerm.toLowerCase()
    const matchesSearch =
      (u.technology_name || '').toLowerCase().includes(term) ||
      (u.trainer_name || '').toLowerCase().includes(term) ||
      (u.concepts_covered || '').toLowerCase().includes(term) ||
      (u.update_text || '').toLowerCase().includes(term) ||
      (u.date || '').includes(term) ||
      (u.session_name || '').toLowerCase().includes(term)

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Pagination
  const totalPages = Math.max(Math.ceil(filteredUpdates.length / ITEMS_PER_PAGE), 1)
  const paginatedUpdates = filteredUpdates.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Summary Metrics
  const totalHours = updates.reduce((sum, u) => sum + (u.duration_hrs || 0), 0)
  const submittedCount = updates.filter(u => u.status === 'submitted').length

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <FileText className="text-blue-600 dark:text-blue-400" size={24} />
            My Daily Updates &amp; Session Records
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review your submitted training sessions, logged hours, trainers, and technology concepts stored in PostgreSQL.
          </p>
        </div>

        <button
          type="button"
          id="btn-refresh-my-updates"
          name="btnRefreshMyUpdates"
          onClick={handleRefresh}
          className="h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
            <BookOpen size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
            {updates.length}
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Logged Sessions</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-2">
            <Clock size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hours</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
            {totalHours.toFixed(1)} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">hrs</span>
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Total Training Hours</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Status</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
            {submittedCount}
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Submitted Sessions</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
            <Calendar size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Days</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
            {Math.ceil(updates.length / 3)}
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Unique Training Days</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[260px]">
          <label htmlFor="my-updates-search" className="sr-only">Search updates</label>
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="my-updates-search"
            name="myUpdatesSearch"
            type="text"
            placeholder="Search by technology, trainer, concepts, or date…"
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
            className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-slate-400" />
            <label htmlFor="status-filter" className="text-xs font-bold text-slate-600 dark:text-slate-300">Status:</label>
          </div>
          <select
            id="status-filter"
            name="statusFilter"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
            className="h-10 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="submitted">Submitted</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Sessions Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading your session records…</p>
          </div>
        ) : paginatedUpdates.length === 0 ? (
          <div className="py-16 text-center">
            <FileText size={36} className="text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No session updates found</p>
            <p className="text-xs text-slate-400 mt-1">Submit your 3 mandatory sessions in the Daily Tracker to see them listed here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-6">Date</th>
                  <th className="py-3.5 px-4">Session</th>
                  <th className="py-3.5 px-4">Trainer</th>
                  <th className="py-3.5 px-4">Technology</th>
                  <th className="py-3.5 px-4">Concepts Covered</th>
                  <th className="py-3.5 px-4">Duration</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedUpdates.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      <span className="inline-block bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg text-xs font-extrabold border border-slate-200 dark:border-slate-700">
                        {item.session_name || `Session ${item.session_number}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                      {item.trainer_name || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                      {item.technology_name || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(item.concepts_covered || '').split(',').map((c, i) => (
                          <span key={i} className="inline-block bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold text-[11px] px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/60">
                            {c.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                      {item.duration_hrs.toFixed(1)} hrs
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                          item.status === 'submitted'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
                            : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60'
                        }`}
                      >
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        id={`btn-view-update-${item.id}`}
                        name={`btnViewUpdate-${item.id}`}
                        onClick={() => setSelectedUpdate(item)}
                        className="h-8 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye size={13} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                id="btn-my-updates-prev"
                name="btnMyUpdatesPrev"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                id="btn-my-updates-next"
                name="btnMyUpdatesNext"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedUpdate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                  {selectedUpdate.session_name || `Session ${selectedUpdate.session_number}`} Details
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{selectedUpdate.date}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUpdate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <span className="text-slate-400 font-semibold">Trainer:</span>
                <p className="font-bold text-slate-800 dark:text-white text-sm mt-0.5">{selectedUpdate.trainer_name}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <span className="text-slate-400 font-semibold">Technology:</span>
                <p className="font-bold text-slate-800 dark:text-white text-sm mt-0.5">{selectedUpdate.technology_name}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl col-span-2">
                <span className="text-slate-400 font-semibold">Concepts Covered:</span>
                <p className="font-bold text-slate-800 dark:text-white text-xs mt-0.5">{selectedUpdate.concepts_covered}</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <span className="text-slate-400 font-semibold">Duration:</span>
                <p className="font-bold text-slate-800 dark:text-white text-sm mt-0.5">{selectedUpdate.duration_hrs.toFixed(1)} hrs</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
                <span className="text-slate-400 font-semibold">Status:</span>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">{selectedUpdate.status.toUpperCase()}</p>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Daily Update Text:</span>
              <div className="mt-1.5 p-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-xs text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">
                {selectedUpdate.update_text}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUpdate(null)}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyUpdatesPage
