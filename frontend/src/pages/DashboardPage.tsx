import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Clock, CheckCircle2, BookOpen, BarChart2, ArrowRight,
  CalendarDays, AlertTriangle, Zap
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { trackerService } from '../services/trackerService'

interface DashboardData {
  today: string
  today_status: string
  today_status_label: string
  sessions_today: number
  hours_today: number
  access_status: string
  is_blocked: boolean
  is_submitted: boolean
  recent_updates: {
    id: number
    date: string
    session: string
    technology: string
    trainer: string
    duration: string
    status: string
  }[]
  totals: {
    total_hours: number
    total_sessions: number
    submitted_days: number
  }
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  submitted: { bg: 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Submitted' },
  draft:     { bg: 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60',   text: 'text-amber-700 dark:text-amber-400',   dot: 'bg-amber-500',   label: 'Draft' },
  frozen:    { bg: 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60',     text: 'text-red-700 dark:text-red-400',     dot: 'bg-red-500',     label: 'Frozen' },
  missed:    { bg: 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60',     text: 'text-red-700 dark:text-red-400',     dot: 'bg-red-500',     label: 'Missed' },
  not_started: { bg: 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700', text: 'text-slate-600 dark:text-slate-300', dot: 'bg-slate-400', label: 'Not Started' },
}

const BADGE_STYLES: Record<string, string> = {
  Submitted: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60',
  Draft:     'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60',
  Locked:    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60',
  Frozen:    'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60',
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trackerService.getInternDashboard()
      .then(res => setData(res))
      .catch(err => console.error('Dashboard load error', err))
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening'
  const firstName = user?.name?.split(' ')[0] || 'Intern'

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  const statusStyle = STATUS_STYLES[data?.today_status || 'not_started'] || STATUS_STYLES.not_started

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ─── 1. Header / Welcome Section ───────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#1e3a5f] dark:from-slate-950 dark:via-slate-900 dark:to-slate-850 border border-slate-800/80 rounded-2xl p-6 sm:p-7 shadow-xs text-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-blue-400 dark:text-blue-300 text-xs sm:text-sm font-semibold tracking-wide uppercase">{today}</p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {greeting}, {firstName} 👋
            </h1>
            <p className="text-slate-300 dark:text-slate-400 text-xs sm:text-sm">
              Here's your training activity overview for today.
            </p>
          </div>

          <button
            type="button"
            id="btn-goto-tracker"
            name="btnGotoTracker"
            onClick={() => navigate('/tracker')}
            className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-blue-900/30 shrink-0 self-start sm:self-center"
          >
            <Zap size={16} />
            <span>Complete Today's Update</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Visually separate blocked alert card */}
        {data?.is_blocked && (
          <div className="flex items-center gap-3 bg-red-950/80 border border-red-800/80 rounded-xl p-4 text-red-200 text-xs sm:text-sm font-medium shadow-xs">
            <AlertTriangle size={18} className="text-red-400 shrink-0" />
            <div>
              <strong>Tracker Access: BLOCKED</strong> — Your daily task was not submitted before the 11:59 PM deadline. Please contact HR to restore access.
            </div>
          </div>
        )}
      </div>

      {/* ─── KPI Summary Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Today's Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Today's Status</p>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${statusStyle.bg}`}>
              <CalendarDays size={18} className={statusStyle.text} />
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit ${statusStyle.bg}`}>
            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
            <span className={`text-xs font-bold ${statusStyle.text}`}>{data?.today_status_label || 'Not Started'}</span>
          </div>
        </div>

        {/* Sessions Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sessions Today</p>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
              <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white leading-none">{data?.sessions_today ?? 0}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1.5">
            {data?.hours_today ?? 0} hrs logged today
          </p>
        </div>

        {/* Total Hours */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total Hours</p>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
              <Clock size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white leading-none">{data?.totals?.total_hours ?? 0}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1.5">hrs all-time training</p>
        </div>

        {/* Days Submitted */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Days Submitted</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white leading-none">{data?.totals?.submitted_days ?? 0}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1.5">{data?.totals?.total_sessions ?? 0} total sessions logged</p>
        </div>
      </div>

      {/* ─── 2. Balanced Two-Column Dashboard Content ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Activity Table — Left 2 Columns */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">Recent Activity</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Your recently logged training updates</p>
              </div>
              <button
                type="button"
                id="btn-view-all-activity"
                name="btnViewAllActivity"
                onClick={() => navigate('/my-updates')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors hover:underline"
              >
                View all <ArrowRight size={14} />
              </button>
            </div>

            {(!data?.recent_updates || data.recent_updates.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                  <BarChart2 size={24} className="text-slate-400 dark:text-slate-500" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No updates logged yet</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                  Your submitted daily training sessions will appear here in chronological order.
                </p>
                <button
                  type="button"
                  id="btn-add-first-update"
                  name="btnAddFirstUpdate"
                  onClick={() => navigate('/tracker')}
                  className="mt-4 inline-flex items-center gap-1.5 h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  <Zap size={13} /> Add First Update
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Date</th>
                      <th className="px-4 py-3.5">Session</th>
                      <th className="px-4 py-3.5">Technology</th>
                      <th className="px-4 py-3.5">Duration</th>
                      <th className="px-6 py-3.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {data.recent_updates.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white whitespace-nowrap">{u.date}</td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-300 font-medium">{u.session}</td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-300 font-medium">{u.technology}</td>
                        <td className="px-4 py-4 text-slate-700 dark:text-slate-300 font-medium">{u.duration}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-extrabold border ${BADGE_STYLES[u.status] || 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
                            {u.status}
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

        {/* Today's Summary Card — Right 1 Column */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Today's Summary</h2>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold ${statusStyle.bg}`}>
                <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                <span className={statusStyle.text}>{data?.today_status_label || 'Not Started'}</span>
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Sessions Logged</span>
                <span className="font-extrabold text-slate-800 dark:text-white">{data?.sessions_today ?? 0} / 3</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Duration Logged</span>
                <span className="font-extrabold text-slate-800 dark:text-white">{data?.hours_today ?? 0} hrs</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Tracker Access</span>
                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  data?.is_blocked
                    ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900/60'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60'
                }`}>
                  {data?.is_blocked ? 'BLOCKED' : 'ACTIVE'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Submitted Days</span>
                <span className="font-extrabold text-slate-800 dark:text-white">{data?.totals?.submitted_days ?? 0} days</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              id="btn-summary-goto-tracker"
              name="btnSummaryGotoTracker"
              onClick={() => navigate('/tracker')}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              <Zap size={15} />
              <span>Go to Daily Tracker</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default DashboardPage
