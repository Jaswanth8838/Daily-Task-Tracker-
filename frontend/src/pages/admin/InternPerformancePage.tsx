import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Calendar, Clock, CheckCircle2, AlertTriangle, Activity,
  BookOpen, Code2, RefreshCw, BarChart2, Shield, Filter
} from 'lucide-react'
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts'
import { reportService } from '../../services/reportService'
import { useTheme } from '../../context/ThemeContext'

interface PerformanceData {
  intern: {
    id: number
    name: string
    email: string
    employee_id: string
    tracker_access_status: string
    is_blocked: boolean
    joining_date: string | null
  }
  range: {
    type: string
    start_date: string
    end_date: string
  }
  summary: {
    training_hours: number
    completed_days: number
    missed_days: number
    total_sessions: number
    submission_rate: number
  }
  daily_training_hours: {
    date: string
    display_date: string
    hours: number
    status: string
  }[]
  submission_status: {
    name: string
    value: number
    color: string
  }[]
  technology_distribution: {
    technology: string
    hours: number
    percentage: number
  }[]
  session_stats: {
    session_number: number
    session_name: string
    completed_count: number
    total_hours: number
    average_hours: number
  }[]
  recent_sessions: {
    id: number
    date: string
    session_name: string
    trainer_name: string
    technology_name: string
    concepts_covered: string
    duration_hrs: number
    status: string
    update_text: string
  }[]
}

const ITEMS_PER_PAGE = 8

const InternPerformancePage: React.FC = () => {
  const { internId } = useParams<{ internId: string }>()
  const navigate = useNavigate()
  const { theme } = useTheme()

  const [data, setData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filters
  const [rangeType, setRangeType] = useState('30d')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Pagination for recent activity
  const [currentPage, setCurrentPage] = useState(1)

  const isDark = theme === 'dark'
  const textColor = isDark ? '#f1f5f9' : '#1e293b'
  const gridColor = isDark ? '#334155' : '#e2e8f0'

  const loadPerformance = useCallback(async () => {
    if (!internId) return
    try {
      const params: any = { range: rangeType }
      if (rangeType === 'custom' && startDate && endDate) {
        params.start_date = startDate
        params.end_date = endDate
      }
      const res = await reportService.getInternPerformance(parseInt(internId, 10), params)
      setData(res)
    } catch (err) {
      console.error('Failed to load intern performance data', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [internId, rangeType, startDate, endDate])

  useEffect(() => {
    loadPerformance()
  }, [loadPerformance])

  const handleRefresh = () => {
    setRefreshing(true)
    loadPerformance()
  }

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading performance metrics…</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Unable to load intern performance data.</p>
        <button
          type="button"
          onClick={() => navigate('/admin/interns')}
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm"
        >
          Back to Interns List
        </button>
      </div>
    )
  }

  const { intern, summary, daily_training_hours, submission_status, technology_distribution, session_stats, recent_sessions } = data

  // Pagination for recent activity table
  const totalPages = Math.max(Math.ceil(recent_sessions.length / ITEMS_PER_PAGE), 1)
  const paginatedActivity = recent_sessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="space-y-6">
      {/* Top Navigation & Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          id="btn-back-to-interns"
          name="btnBackToInterns"
          onClick={() => navigate('/admin/interns')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Interns List
        </button>

        <button
          type="button"
          id="btn-refresh-perf"
          name="btnRefreshPerf"
          onClick={handleRefresh}
          className="h-9 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Intern Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-xl shadow-md shadow-blue-600/30">
            {intern.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{intern.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
              <span>Employee ID: <strong className="text-slate-700 dark:text-slate-200">{intern.employee_id}</strong></span>
              <span>•</span>
              <span>Email: <strong className="text-slate-700 dark:text-slate-200">{intern.email}</strong></span>
            </div>
          </div>
        </div>

        {/* Tracker Access Badge */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Tracker Access:</span>
          <span
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-extrabold border ${
              intern.is_blocked
                ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${intern.is_blocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
            {intern.tracker_access_status}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Time Range Filter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: 'Last 30 Days' },
            { id: 'month', label: 'This Month' },
            { id: 'custom', label: 'Custom Range' },
          ].map(r => (
            <button
              key={r.id}
              type="button"
              id={`btn-range-${r.id}`}
              name={`btnRange-${r.id}`}
              onClick={() => { setRangeType(r.id); setCurrentPage(1) }}
              className={`h-9 px-3.5 rounded-xl text-xs font-bold transition-all ${
                rangeType === r.id
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {r.label}
            </button>
          ))}

          {rangeType === 'custom' && (
            <div className="flex items-center gap-2 ml-2">
              <input
                id="perf-start-date"
                name="perfStartDate"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                id="perf-end-date"
                name="perfEndDate"
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="h-9 px-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* Row 1: Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* KPI 1: Training Hours */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-2">
            <Clock size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Hours</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
            {summary.training_hours.toFixed(1)} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">hrs</span>
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Total Training Hours</p>
        </div>

        {/* KPI 2: Completed Days */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <CheckCircle2 size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Submitted</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
            {summary.completed_days} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">days</span>
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Submitted Days</p>
        </div>

        {/* KPI 3: Missed Days */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-red-500 dark:text-red-400 mb-2">
            <AlertTriangle size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Missed</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
            {summary.missed_days} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">days</span>
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Missed / Frozen Days</p>
        </div>

        {/* KPI 4: Total Sessions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-2">
            <BookOpen size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sessions</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
            {summary.total_sessions}
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Logged Sessions</p>
        </div>

        {/* KPI 5: Submission Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-cyan-600 dark:text-cyan-400 mb-2">
            <Activity size={20} />
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rate</span>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
            {summary.submission_rate}%
          </p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Submission Rate</p>
        </div>
      </div>

      {/* Row 2: Charts (Trend Line & Submission Pie) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Training Hours Trend */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Training Hours by Day</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Daily hours logged across the selected timeframe</p>
            </div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 px-3 py-1 rounded-lg">
              Daily Trend
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily_training_hours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="display_date" stroke={textColor} fontSize={11} tickLine={false} />
                <YAxis stroke={textColor} fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '12px',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                  formatter={(val: any) => [`${val} hrs`, 'Duration']}
                />
                <Area type="monotone" dataKey="hours" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorHours)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Submission Status Distribution (Pie / Donut) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Submission Status</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Distribution of tracker submissions vs missed days</p>
          </div>

          <div className="h-52 w-full my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={submission_status}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {submission_status.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    borderRadius: '12px',
                    color: isDark ? '#ffffff' : '#0f172a',
                    fontSize: '12px',
                    fontWeight: 600
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
            {submission_status.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                </div>
                <span className="text-slate-900 dark:text-white font-bold">{item.value} days</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Technology Distribution & Mandatory 3-Session Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 3: Technology Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Technology / Domain Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total training hours breakdown per technology</p>
            </div>
            <Code2 size={18} className="text-blue-600 dark:text-blue-400" />
          </div>

          {technology_distribution.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">No technology data logged in this range.</div>
          ) : (
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={technology_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="technology" stroke={textColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={textColor} fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '12px',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                    formatter={(val: any) => [`${val} hrs`, 'Training Hours']}
                  />
                  <Bar dataKey="hours" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Session Performance Breakdown Cards (Session 1, Session 2, Session 3) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Session Performance</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Completion stats for Session 1, Session 2 &amp; Session 3</p>
          </div>

          <div className="space-y-3 flex-1 justify-center flex flex-col">
            {session_stats.map((s) => (
              <div key={s.session_number} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-white text-xs">{s.session_name}</span>
                  <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/60">
                    {s.completed_count} logged
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px]">Total Hours:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{s.total_hours.toFixed(1)} hrs</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Avg Duration:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-100">{s.average_hours.toFixed(1)} hrs/session</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4: Recent Training Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Recent Training Sessions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Detailed session logs for {intern.name}</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
            {recent_sessions.length} records
          </span>
        </div>

        {paginatedActivity.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No training activity recorded.</div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {paginatedActivity.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-6 font-semibold text-slate-800 dark:text-white whitespace-nowrap">
                      {s.date}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-bold whitespace-nowrap">
                      {s.session_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                      {s.trainer_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap">
                      {s.technology_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(s.concepts_covered || '').split(',').map((c, i) => (
                          <span key={i} className="inline-block bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-semibold text-[11px] px-2 py-0.5 rounded border border-blue-100 dark:border-blue-900/60">
                            {c.trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                      {s.duration_hrs.toFixed(1)} hrs
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                id="btn-perf-prev-page"
                name="btnPerfPrevPage"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                type="button"
                id="btn-perf-next-page"
                name="btnPerfNextPage"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg disabled:opacity-40 transition-colors"
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

export default InternPerformancePage
