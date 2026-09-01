import React, { useEffect, useState, useCallback } from 'react'
import {
  Users, Lock, CheckCircle2, AlertTriangle,
  Activity, BookOpen, Clock, RefreshCw, XCircle, Shield
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────
interface AdminStats {
  total_users: number
  active_employees: number
  active_interns: number
  reports_today: number
  pending_today: number
  completed_total: number
  frozen_total: number
}

interface InternRow {
  id: number
  name: string
  email: string
  submitted_today: boolean
  sessions_submitted: string
  sessions_count: number
  last_submitted_at: string | null
}

interface InternOverview {
  today: string
  total_interns: number
  submitted_today: number
  not_submitted_today: number
  intern_rows: InternRow[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatDateTime = (isoString?: string | null) => {
  if (!isoString) return 'Not Yet Submitted'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return 'Not Yet Submitted'
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return 'Not Yet Submitted'
  }
}

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; color: string; link?: string }> = ({ label, value, icon, color, link }) => {
  const inner = (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex items-center gap-4 hover:shadow-md transition-all">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-2xl font-bold text-slate-800 dark:text-white leading-none">{value}</p>
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">{label}</p>
      </div>
    </div>
  )
  return link ? <Link to={link}>{inner}</Link> : <div>{inner}</div>
}

// ── Main Component ─────────────────────────────────────────────────────────────
const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [overview, setOverview] = useState<InternOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterSubmit, setFilterSubmit] = useState<'all' | 'submitted' | 'missing'>('all')
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [s, o] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/dashboard/intern-overview'),
      ])
      const sData = s.data?.data || s.data
      const oData = o.data?.data || o.data
      setStats(sData)
      setOverview(oData)
    } catch (e) {
      console.error('Failed to load HR dashboard data', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRefresh = () => { setRefreshing(true); loadData() }

  const filteredRows = overview?.intern_rows.filter(r => {
    if (filterSubmit === 'submitted') return r.submitted_today
    if (filterSubmit === 'missing') return !r.submitted_today
    return true
  }) ?? []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">Admin &amp; HR Control Center</h2>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Live intern daily activity overview · {overview?.today}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/interns"
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl transition-colors shadow-xs"
          >
            <Users size={15} />
            Individual Intern Performance
          </Link>
          <Link
            to="/admin/tracker-access"
            className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 px-4 py-2.5 rounded-xl transition-colors shadow-xs"
          >
            <Shield size={15} />
            Tracker Access Control
          </Link>
          <button
            type="button"
            id="btn-admin-refresh"
            name="btnAdminRefresh"
            onClick={handleRefresh}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3.5 py-2.5 rounded-xl transition-colors"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Users"        value={stats.total_users}       icon={<Users size={20} className="text-blue-600 dark:text-blue-400" />}    color="bg-blue-50 dark:bg-blue-950/50"    link="/users" />
          <StatCard label="Active Interns"     value={stats.active_interns}    icon={<BookOpen size={20} className="text-purple-600 dark:text-purple-400" />} color="bg-purple-50 dark:bg-purple-950/50"  link="/admin/interns" />
          <StatCard label="Submitted Today"    value={stats.reports_today}     icon={<CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />} color="bg-emerald-50 dark:bg-emerald-950/50" link="/admin/interns" />
          <StatCard label="Pending Today"      value={stats.pending_today}     icon={<AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />} color="bg-amber-50 dark:bg-amber-950/50"  link="/admin/interns" />
          <StatCard label="Total Submissions"  value={stats.completed_total}   icon={<Activity size={20} className="text-cyan-600 dark:text-cyan-400" />}    color="bg-cyan-50 dark:bg-cyan-950/50"     link="/admin/reports" />
          <StatCard label="Frozen Accounts"    value={stats.frozen_total}      icon={<Lock size={20} className="text-red-600 dark:text-red-400" />}        color="bg-red-50 dark:bg-red-950/50"      link="/admin/tracker-access" />
        </div>
      )}

      {/* Simplified Per-Intern Activity Table */}
      {overview && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Intern Daily Submission Overview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time daily task &amp; session submission status</p>
            </div>
            <div className="flex gap-2">
              {(['all', 'submitted', 'missing'] as const).map(f => (
                <button key={f} onClick={() => setFilterSubmit(f)}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border capitalize transition-all ${
                    filterSubmit === f ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}>
                  {f === 'all' ? `All (${overview.total_interns})` : f === 'submitted' ? `Submitted (${overview.submitted_today})` : `Missing (${overview.not_submitted_today})`}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Intern Name</th>
                  <th className="px-6 py-3.5 text-center">Submitted Today</th>
                  <th className="px-6 py-3.5 text-center">Sessions Submitted</th>
                  <th className="px-6 py-3.5 text-right">Last Submitted Date &amp; Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredRows.map(r => (
                  <tr key={r.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${!r.submitted_today ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''}`}>
                    {/* Intern Name */}
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-white text-sm">{r.name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">{r.email}</div>
                    </td>

                    {/* Submitted Today */}
                    <td className="px-6 py-4 text-center">
                      {r.submitted_today ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60">
                          <XCircle size={14} className="text-amber-500" />
                          Not Submitted
                        </span>
                      )}
                    </td>

                    {/* Sessions Submitted (out of 3) */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-extrabold border ${
                        r.sessions_count === 3
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
                          : r.sessions_count > 0
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      }`}>
                        <Clock size={13} />
                        {r.sessions_submitted}
                      </span>
                    </td>

                    {/* Last Submitted Date & Time */}
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {formatDateTime(r.last_submitted_at)}
                      </span>
                    </td>
                  </tr>
                ))}

                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                      No intern records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
