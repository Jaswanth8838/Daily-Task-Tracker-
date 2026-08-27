import React, { useEffect, useState, useCallback } from 'react'
import {
  Users, FileText, Lock, CheckCircle2, TrendingUp, AlertTriangle,
  Activity, BookOpen, Calendar, Code2, XCircle, RefreshCw,
  ChevronDown, ChevronUp, AlertCircle, Shield, ArrowRight
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
  overall_status: string
  training_status: string
  training_progress: number
  training_details: string
  practice_status: string
  practice_progress: number
  practice_details: string
  lacking_areas: string[]
}

interface AggSection {
  completed: number
  in_progress: number
  not_started: number
  blocked: number
}

interface InternOverview {
  today: string
  total_interns: number
  submitted_today: number
  not_submitted_today: number
  intern_rows: InternRow[]
  aggregate: {
    training: AggSection
    practice: AggSection
    overall: AggSection
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_PILL: Record<string, string> = {
  completed:    'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60',
  in_progress:  'bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/60',
  not_started:  'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  blocked:      'bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/60',
  not_submitted:'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60',
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
  const [expandedIntern, setExpandedIntern] = useState<number | null>(null)
  const [filterSubmit, setFilterSubmit] = useState<'all' | 'submitted' | 'missing'>('all')
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [s, o] = await Promise.all([
        api.get('/admin/dashboard/stats'),
        api.get('/admin/dashboard/intern-overview'),
      ])
      setStats(s.data)
      setOverview(o.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false); setRefreshing(false) }
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
            Live intern activity overview · {overview?.today}
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
          <StatCard label="Total Users"        value={stats.total_users}       icon={<Users size={20} className="text-blue-600 dark:text-blue-400" />}    color="bg-blue-50 dark:bg-blue-950/50"    link="/admin/users" />
          <StatCard label="Active Interns"     value={stats.active_interns}    icon={<BookOpen size={20} className="text-purple-600 dark:text-purple-400" />} color="bg-purple-50 dark:bg-purple-950/50"  link="/admin/interns" />
          <StatCard label="Submitted Today"    value={stats.reports_today}     icon={<CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />} color="bg-emerald-50 dark:bg-emerald-950/50" link="/admin/interns" />
          <StatCard label="Pending Today"      value={stats.pending_today}     icon={<AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />} color="bg-amber-50 dark:bg-amber-950/50"  link="/admin/interns" />
          <StatCard label="Total Submissions"  value={stats.completed_total}   icon={<Activity size={20} className="text-cyan-600 dark:text-cyan-400" />}    color="bg-cyan-50 dark:bg-cyan-950/50"     link="/admin/reports" />
          <StatCard label="Frozen Accounts"    value={stats.frozen_total}      icon={<Lock size={20} className="text-red-600 dark:text-red-400" />}        color="bg-red-50 dark:bg-red-950/50"      link="/admin/tracker-access" />
        </div>
      )}

      {/* Per-Intern Activity Table */}
      {overview && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Live Intern Daily Activity Overview</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Today's task submission, training progress &amp; lacking areas</p>
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
                  <th className="px-6 py-3.5">Intern</th>
                  <th className="px-4 py-3.5 text-center">Submitted Today</th>
                  <th className="px-4 py-3.5 text-center">Training Progress</th>
                  <th className="px-4 py-3.5 text-center">Practice Progress</th>
                  <th className="px-4 py-3.5 text-center">Overall Status</th>
                  <th className="px-6 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredRows.map(r => (
                  <React.Fragment key={r.id}>
                    <tr className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${!r.submitted_today ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''}`}>
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-800 dark:text-white text-sm">{r.name}</div>
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-normal">{r.email}</div>
                      </td>

                      {/* Submitted today? */}
                      <td className="px-4 py-3.5 text-center">
                        {r.submitted_today
                          ? <CheckCircle2 size={18} className="text-emerald-500 mx-auto" />
                          : <XCircle size={18} className="text-amber-500 mx-auto" />}
                      </td>

                      {/* Training */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase ${STATUS_PILL[r.training_status]}`}>
                            {r.training_status.replace(/_/g, ' ')}
                          </span>
                          {r.submitted_today && (
                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.training_progress}%` }} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Practice */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="space-y-1">
                          <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase ${STATUS_PILL[r.practice_status]}`}>
                            {r.practice_status.replace(/_/g, ' ')}
                          </span>
                          {r.submitted_today && (
                            <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.practice_progress}%` }} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Overall */}
                      <td className="px-4 py-3.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase ${STATUS_PILL[r.overall_status]}`}>
                          {r.overall_status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Expand */}
                      <td className="px-6 py-3.5 text-right">
                        {r.submitted_today && (
                          <button onClick={() => setExpandedIntern(expandedIntern === r.id ? null : r.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 transition-colors p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800">
                            {expandedIntern === r.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expandedIntern === r.id && r.submitted_today && (
                      <tr>
                        <td colSpan={7} className="bg-slate-50/80 dark:bg-slate-800/50 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white mb-2">
                                <BookOpen size={14} className="text-blue-600 dark:text-blue-400" /> Training Session Details
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{r.training_details || '—'}</p>
                              <div className="mt-3 flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${r.training_progress}%` }} />
                                </div>
                                <span className="font-extrabold text-blue-600 dark:text-blue-400">{r.training_progress}%</span>
                              </div>
                            </div>
                            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-white mb-2">
                                <Code2 size={14} className="text-emerald-600 dark:text-emerald-400" /> Practice &amp; Concepts Details
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{r.practice_details || '—'}</p>
                              <div className="mt-3 flex items-center gap-2">
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${r.practice_progress}%` }} />
                                </div>
                                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{r.practice_progress}%</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filteredRows.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-xs">No intern records found</td></tr>
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
