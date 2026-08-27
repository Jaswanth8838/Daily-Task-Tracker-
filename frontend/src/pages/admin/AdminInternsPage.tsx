import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Search, RefreshCw, BarChart2, CheckCircle2, Clock, AlertCircle, Lock, Ban } from 'lucide-react'
import { reportService } from '../../services/reportService'

interface InternSummary {
  id: number
  name: string
  email: string
  employee_id: string
  tracker_access_status: string
  is_blocked: boolean
  today_task: string
  total_training_hours: number
  submitted_days: number
  missed_days: number
}

const ITEMS_PER_PAGE = 10

const AdminInternsPage: React.FC = () => {
  const navigate = useNavigate()
  const [interns, setInterns] = useState<InternSummary[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchInterns = useCallback(async () => {
    try {
      const data = await reportService.getHRInterns(search)
      setInterns(data || [])
    } catch (err) {
      console.error('Failed to load interns list', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [search])

  useEffect(() => {
    fetchInterns()
  }, [fetchInterns])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchInterns()
  }

  // Pagination logic
  const totalPages = Math.max(Math.ceil(interns.length / ITEMS_PER_PAGE), 1)
  const paginatedInterns = interns.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const renderTodayTaskBadge = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
            <CheckCircle2 size={13} className="text-emerald-500" />
            ✓ Submitted
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60">
            <Clock size={13} className="text-amber-500" />
            ● Pending
          </span>
        )
      case 'FROZEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60">
            <Lock size={13} className="text-red-500" />
            🔒 Frozen
          </span>
        )
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60">
            <Ban size={13} className="text-red-500" />
            ⛔ Blocked
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <AlertCircle size={13} className="text-slate-400" />
            ! Not Submitted
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="text-blue-600 dark:text-blue-400" size={24} />
            Interns &amp; Individual Performance
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Select an intern from the table below to review their detailed training metrics, submission trends, and technology progress.
          </p>
        </div>

        <button
          type="button"
          id="btn-refresh-interns"
          name="btnRefreshInterns"
          onClick={handleRefresh}
          className="h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh List
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[280px]">
          <label htmlFor="intern-list-search" className="sr-only">Search Interns</label>
          <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="intern-list-search"
            name="internListSearch"
            type="text"
            placeholder="Search by intern name, employee ID, or email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
            className="w-full h-11 pl-10 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700">
          Total Interns: <span className="text-slate-800 dark:text-white font-bold">{interns.length}</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading interns list…</p>
          </div>
        ) : paginatedInterns.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No interns found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or refresh the page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-6">Intern Name</th>
                  <th className="py-4 px-4">Employee ID</th>
                  <th className="py-4 px-4">Tracker Access</th>
                  <th className="py-4 px-4">Today's Task</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedInterns.map((intern) => (
                  <tr key={intern.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                      <div>
                        <span className="text-sm">{intern.name}</span>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-normal">{intern.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                      {intern.employee_id}
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
                          intern.is_blocked
                            ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${intern.is_blocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        {intern.tracker_access_status}
                      </span>
                    </td>
                    <td className="py-4 px-4 whitespace-nowrap">
                      {renderTodayTaskBadge(intern.today_task)}
                    </td>
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        type="button"
                        id={`btn-view-perf-${intern.id}`}
                        name={`btnViewPerf-${intern.id}`}
                        onClick={() => navigate(`/admin/interns/${intern.id}`)}
                        className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shadow-blue-600/30 inline-flex items-center gap-1.5"
                      >
                        <BarChart2 size={14} />
                        View Performance
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
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                id="btn-prev-page"
                name="btnPrevPage"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                id="btn-next-page"
                name="btnNextPage"
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
    </div>
  )
}

export default AdminInternsPage
