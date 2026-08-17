import React, { useEffect, useState, useCallback } from 'react'
import {
  Users, FileText, Lock, CheckCircle2, TrendingUp, AlertTriangle,
  Activity, BookOpen, Calendar, Code2, XCircle, RefreshCw,
  ChevronDown, ChevronUp, AlertCircle
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
  department: string
  submitted_today: boolean
  overall_status: string
  training_status: string
  training_progress: number
  training_details: string
  meeting_status: string
  meeting_details: string
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
    meeting: AggSection
    practice: AggSection
    overall: AggSection
  }
  dept_breakdown: { dept: string; total: number; submitted: number; completed: number; blocked: number }[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const STATUS_PILL: Record<string, string> = {
  completed:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  in_progress:  'bg-blue-100 text-blue-700 border-blue-200',
  not_started:  'bg-slate-100 text-slate-500 border-slate-200',
  blocked:      'bg-red-100 text-red-700 border-red-200',
  not_submitted:'bg-amber-100 text-amber-700 border-amber-200',
}

const SectionBar: React.FC<{ label: string; data: AggSection; icon: React.ReactNode; color: string }> = ({ label, data, icon, color }) => {
  const total = data.completed + data.in_progress + data.not_started + data.blocked || 1
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
      <div className={`flex items-center gap-2 mb-3`}>
        <div className={`p-1.5 rounded-lg ${color}`}>{icon}</div>
        <span className="text-xs font-bold text-slate-700">{label}</span>
      </div>
      <div className="space-y-1.5">
        {[
          { key: 'completed',   label: 'Completed',   color: 'bg-emerald-500' },
          { key: 'in_progress', label: 'In Progress',  color: 'bg-blue-500' },
          { key: 'not_started', label: 'Not Started',  color: 'bg-slate-300' },
          { key: 'blocked',     label: 'Blocked',      color: 'bg-red-500' },
        ].map(s => {
          const count = data[s.key as keyof AggSection]
          const pct = Math.round((count / total) * 100)
          return (
            <div key={s.key}>
              <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
                <span>{s.label}</span><span className="font-bold text-slate-700">{count}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full ${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const StatCard: React.FC<{ label: string; value: number | string; icon: React.ReactNode; color: string; link?: string }> = ({ label, value, icon, color, link }) => {
  const inner = (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-slate-800 leading-none">{value}</p>
        <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
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
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Admin Control Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live intern activity overview · {overview?.today}
          </p>
        </div>
        <button onClick={handleRefresh} className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg transition-colors">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total Users"        value={stats.total_users}       icon={<Users size={20} className="text-blue-600" />}    color="bg-blue-50"    link="/admin/users" />
          <StatCard label="Employees"          value={stats.active_employees}  icon={<TrendingUp size={20} className="text-purple-600"/>} color="bg-purple-50"  link="/admin/reports" />
          <StatCard label="Active Interns"     value={stats.active_interns}    icon={<Activity size={20} className="text-emerald-600"/>}  color="bg-emerald-50" link="/admin/intern-reports" />
          <StatCard label="Reports Today"      value={stats.reports_today}     icon={<FileText size={20} className="text-cyan-600" />}  color="bg-cyan-50" />
          <StatCard label="Pending Today"      value={stats.pending_today}     icon={<AlertTriangle size={20} className="text-amber-600"/>} color="bg-amber-50" />
          <StatCard label="Frozen Reports"     value={stats.frozen_total}      icon={<Lock size={20} className="text-slate-600" />}     color="bg-slate-100" />
        </div>
      )}

      {/* Today's Submission Ring */}
      {overview && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Submission Summary */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-500 mb-3 tracking-wide uppercase">Today's Submissions</p>
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - Math.round((overview.submitted_today / (overview.total_interns || 1)) * 100)} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-slate-800">{overview.submitted_today}</span>
                <span className="text-[10px] text-slate-400">of {overview.total_interns}</span>
              </div>
            </div>
            <div className="mt-3 flex gap-3 text-xs">
              <div className="text-center"><div className="font-bold text-emerald-600">{overview.submitted_today}</div><div className="text-slate-400">Submitted</div></div>
              <div className="text-center"><div className="font-bold text-amber-600">{overview.not_submitted_today}</div><div className="text-slate-400">Missing</div></div>
            </div>
          </div>

          {/* Section Aggregates */}
          <SectionBar label="Training" data={overview.aggregate.training} icon={<BookOpen size={14} className="text-blue-600" />} color="bg-blue-50" />
          <SectionBar label="Meetings"  data={overview.aggregate.meeting}  icon={<Calendar size={14} className="text-purple-600" />} color="bg-purple-50" />
          <SectionBar label="Practice"  data={overview.aggregate.practice} icon={<Code2 size={14} className="text-emerald-600" />} color="bg-emerald-50" />
        </div>
      )}

      {/* Department Breakdown */}
      {overview && overview.dept_breakdown.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">Department / Tech Area Breakdown</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {overview.dept_breakdown.map(d => (
              <div key={d.dept} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="font-bold text-slate-800 text-xs truncate mb-1">{d.dept}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
                  <span>{d.total} interns</span>
                  <span className={`font-bold ${d.submitted >= d.total ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {d.submitted}/{d.total} submitted
                  </span>
                </div>
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((d.submitted / (d.total || 1)) * 100)}%` }} />
                </div>
                <div className="flex gap-2 mt-2 text-[9px]">
                  {d.completed > 0 && <span className="text-emerald-600 font-bold">✓ {d.completed} done</span>}
                  {d.blocked > 0 && <span className="text-red-600 font-bold">⚠ {d.blocked} blocked</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-Intern Detail Table */}
      {overview && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">Intern Activity Detail</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Task submission, meeting attendance, training progress &amp; lacking areas — today</p>
            </div>
            <div className="flex gap-1.5">
              {(['all', 'submitted', 'missing'] as const).map(f => (
                <button key={f} onClick={() => setFilterSubmit(f)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border capitalize transition-all ${
                    filterSubmit === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}>
                  {f === 'all' ? `All (${overview.total_interns})` : f === 'submitted' ? `Submitted (${overview.submitted_today})` : `Missing (${overview.not_submitted_today})`}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-left text-[11px]">
                <tr>
                  <th className="px-5 py-3">Intern</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3 text-center">Report</th>
                  <th className="px-5 py-3 text-center">Training</th>
                  <th className="px-5 py-3 text-center">Meeting</th>
                  <th className="px-5 py-3 text-center">Practice</th>
                  <th className="px-5 py-3 text-center">Overall</th>
                  <th className="px-5 py-3">Lacking Areas</th>
                  <th className="px-5 py-3 text-center">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map(r => (
                  <React.Fragment key={r.id}>
                    <tr className={`hover:bg-slate-50/80 transition-colors ${!r.submitted_today ? 'bg-amber-50/30' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-800">{r.name}</div>
                        <div className="text-[10px] text-slate-400">{r.email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{r.department}</td>

                      {/* Report submitted? */}
                      <td className="px-5 py-3.5 text-center">
                        {r.submitted_today
                          ? <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                          : <XCircle size={16} className="text-amber-500 mx-auto" />}
                      </td>

                      {/* Training */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="space-y-1">
                          <span className={`inline-block px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${STATUS_PILL[r.training_status]}`}>
                            {r.training_status.replace(/_/g, ' ')}
                          </span>
                          {r.submitted_today && (
                            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.training_progress}%` }} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Meeting */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${STATUS_PILL[r.meeting_status]}`}>
                          {r.meeting_status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Practice */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="space-y-1">
                          <span className={`inline-block px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${STATUS_PILL[r.practice_status]}`}>
                            {r.practice_status.replace(/_/g, ' ')}
                          </span>
                          {r.submitted_today && (
                            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto overflow-hidden">
                              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.practice_progress}%` }} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Overall */}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase ${STATUS_PILL[r.overall_status]}`}>
                          {r.overall_status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Lacking Areas */}
                      <td className="px-5 py-3.5 max-w-[180px]">
                        {r.lacking_areas.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {r.lacking_areas.map(a => (
                              <span key={a} className="inline-flex items-center gap-0.5 bg-red-50 border border-red-200 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                <AlertCircle size={9} />{a}
                              </span>
                            ))}
                          </div>
                        ) : r.submitted_today ? (
                          <span className="text-emerald-600 text-[10px] font-semibold">✓ On track</span>
                        ) : (
                          <span className="text-amber-600 text-[10px] font-semibold">No report yet</span>
                        )}
                      </td>

                      {/* Expand */}
                      <td className="px-5 py-3.5 text-center">
                        {r.submitted_today && (
                          <button onClick={() => setExpandedIntern(expandedIntern === r.id ? null : r.id)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1 rounded hover:bg-blue-50">
                            {expandedIntern === r.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {expandedIntern === r.id && r.submitted_today && (
                      <tr>
                        <td colSpan={9} className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                              <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1.5">
                                <BookOpen size={13} className="text-blue-600" /> Training Details
                              </div>
                              <p className="text-slate-600">{r.training_details || '—'}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${r.training_progress}%` }} />
                                </div>
                                <span className="font-bold text-blue-700">{r.training_progress}%</span>
                              </div>
                            </div>
                            <div className="rounded-lg bg-purple-50 border border-purple-200 p-3">
                              <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1.5">
                                <Calendar size={13} className="text-purple-600" /> Meeting Details
                              </div>
                              <p className="text-slate-600">{r.meeting_details || '—'}</p>
                              <span className={`mt-2 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${STATUS_PILL[r.meeting_status]}`}>
                                {r.meeting_status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
                              <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1.5">
                                <Code2 size={13} className="text-emerald-600" /> Practice Details
                              </div>
                              <p className="text-slate-600">{r.practice_details || '—'}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${r.practice_progress}%` }} />
                                </div>
                                <span className="font-bold text-emerald-700">{r.practice_progress}%</span>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {filteredRows.length === 0 && (
                  <tr><td colSpan={9} className="py-10 text-center text-slate-400 text-xs">No interns found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap gap-3 text-[10px] text-slate-500">
            {[
              { color: 'bg-emerald-500', label: 'Completed' },
              { color: 'bg-blue-500', label: 'In Progress' },
              { color: 'bg-slate-300', label: 'Not Started' },
              { color: 'bg-red-500', label: 'Blocked' },
              { color: 'bg-amber-400', label: 'Not Submitted' },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${l.color}`} />
                <span>{l.label}</span>
              </div>
            ))}
            <Link to="/admin/intern-reports" className="ml-auto text-blue-600 font-semibold hover:underline">View Full Report History →</Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboardPage
