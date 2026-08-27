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
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-7">

      {/* ─── Welcome Banner ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] dark:from-slate-900 dark:to-slate-800 border border-slate-800 rounded-2xl p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 shadow-sm">
        <div>
          <p className="text-blue-300 text-sm font-semibold mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-slate-300 dark:text-slate-400 text-sm mt-1.5">
            Here's your training activity overview for today.
          </p>
          {data?.is_blocked && (
            <div className="mt-3 flex items-center gap-2 bg-red-900/40 border border-red-700/50 rounded-xl px-4 py-2.5 text-red-300 text-sm font-medium">
              <AlertTriangle size={15} />
              Your tracker access is <strong>BLOCKED</strong>. Contact HR to restore access.
            </div>
          )}
        </div>
        <button
          type="button"
          id="btn-goto-tracker"
          name="btnGotoTracker"
          onClick={() => navigate('/tracker')}
          className="flex-shrink-0 h-12 px-6 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-blue-900/40 flex items-center gap-2"
        >
          <Zap size={16} />
          Complete Today's Update
          <ArrowRight size={16} />
        </button>
      </div>

      {/* ─── KPI Summary Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Today's Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Today's Status</p>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${statusStyle.bg}`}>
              <CalendarDays size={20} className={statusStyle.text} />
            </div>
          </div>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${statusStyle.bg}`}>
            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
            <span className={`text-sm font-bold ${statusStyle.text}`}>{data?.today_status_label || 'Not Started'}</span>
          </div>
        </div>

        {/* Sessions Today */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Sessions Today</p>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
              <BookOpen size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{data?.sessions_today ?? 0}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            {data?.hours_today ?? 0} hrs logged today
          </p>
        </div>

        {/* Training Hours */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Total Hours</p>
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center">
              <Clock size={20} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{data?.totals?.total_hours ?? 0}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">hrs all-time training</p>
        </div>

        {/* Submitted Days */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Days Submitted</p>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
              <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-800 dark:text-white">{data?.totals?.submitted_days ?? 0}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{data?.totals?.total_sessions ?? 0} total sessions logged</p>
        </div>
      </div>

      {/* ─── Recent Activity + Quick Actions ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Updates table — 2/3 width */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Recent Activity</h2>
            <button
              type="button"
              id="btn-view-all-activity"
              name="btnViewAllActivity"
              onClick={() => navigate('/my-updates')}
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>

          {(!data?.recent_updates || data.recent_updates.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
              <BarChart2 size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">No updates yet</p>
              <p className="text-xs mt-1">Start logging your daily training</p>
              <button
                type="button"
                id="btn-add-first-update"
                name="btnAddFirstUpdate"
                onClick={() => navigate('/tracker')}
                className="mt-4 h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Zap size={13} /> Add First Update
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                    <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Session</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Technology</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duration</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {data.recent_updates.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-3.5 text-slate-800 dark:text-white font-medium whitespace-nowrap">{u.date}</td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">{u.session}</td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">{u.technology}</td>
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">{u.duration}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${BADGE_STYLES[u.status] || 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
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

        {/* Summary Card — 1/3 width */}
        <div className="flex flex-col gap-5">
          {/* Today's Summary card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-800 dark:text-white">Today's Summary</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${statusStyle.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                  <span className={statusStyle.text}>{data?.today_status_label || 'Not Started'}</span>
                </span>
              </div>

              <div className="space-y-3.5 divide-y divide-slate-100 dark:divide-slate-800/80">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Sessions Logged</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{data?.sessions_today ?? 0}</span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Duration Logged</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{data?.hours_today ?? 0} hrs</span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Tracker Access</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${data?.is_blocked ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
                    {data?.is_blocked ? 'BLOCKED' : 'ACTIVE'}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Submitted Days</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">{data?.totals?.submitted_days ?? 0} days</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                id="btn-summary-goto-tracker"
                name="btnSummaryGotoTracker"
                onClick={() => navigate('/tracker')}
                className="w-full h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Zap size={14} className="text-blue-600 dark:text-blue-400" />
                <span>Go to Daily Tracker</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
