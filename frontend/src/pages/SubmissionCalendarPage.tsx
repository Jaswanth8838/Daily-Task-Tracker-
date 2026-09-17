import React, { useEffect, useState, useCallback } from 'react'
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, CheckCircle2,
  XCircle, Lock, Clock, Eye, AlertCircle, RefreshCw, Layers, BookOpen, User, X
} from 'lucide-react'
import api from '../lib/api'

interface SessionDetail {
  id: number
  session_number: number
  session_name: string
  trainer_name: string
  technology_name: string
  concepts_covered: string
  duration_hrs: number
  update_text: string
  status: string
}

interface CalendarDay {
  date: string
  day: number
  weekday: string
  status: 'submitted' | 'missed' | 'frozen' | 'today_pending' | 'not_applicable' | 'future'
  sessions_count: number
  total_duration: number
  submitted_at: string | null
  sessions: SessionDetail[]
}

interface CalendarData {
  year: number
  month: number
  month_name: string
  total_days_submitted: number
  total_days_missed: number
  total_sessions_submitted: number
  all_time: {
    submitted_days: number
    missed_days: number
    total_sessions: number
  }
  calendar_days: CalendarDay[]
}

const SubmissionCalendarPage: React.FC = () => {
  const today = new Date()
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1)
  const [data, setData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null)

  const fetchCalendar = useCallback(async (year: number, month: number) => {
    try {
      const res = await api.get(`/tracker/submission-calendar?year=${year}&month=${month}`)
      const payload = res.data?.data || res.data
      setData(payload)
    } catch (err) {
      console.error('Failed to load submission calendar', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchCalendar(currentYear, currentMonth)
  }, [currentYear, currentMonth, fetchCalendar])

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12)
      setCurrentYear(y => y - 1)
    } else {
      setCurrentMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1)
      setCurrentYear(y => y + 1)
    } else {
      setCurrentMonth(m => m + 1)
    }
  }

  const handleToday = () => {
    setCurrentYear(today.getFullYear())
    setCurrentMonth(today.getMonth() + 1)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchCalendar(currentYear, currentMonth)
  }

  // Helper for status badge
  const renderStatusBadge = (status: CalendarDay['status'], sessions: number) => {
    switch (status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60">
            <CheckCircle2 size={13} className="text-emerald-500" />
            Submitted ({sessions}/3)
          </span>
        )
      case 'missed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60">
            <XCircle size={13} className="text-red-500" />
            Not Submitted
          </span>
        )
      case 'frozen':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60">
            <Lock size={13} className="text-amber-500" />
            Locked / Frozen
          </span>
        )
      case 'today_pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60">
            <Clock size={13} className="text-blue-500" />
            Due Today ({sessions}/3)
          </span>
        )
      case 'future':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 dark:text-slate-500">
            Upcoming
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 dark:text-slate-600">
            —
          </span>
        )
    }
  }

  // Format date display
  const formatDateDisplay = (isoStr: string) => {
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    } catch {
      return isoStr
    }
  }

  // Format timestamp display
  const formatTimestamp = (isoStr?: string | null) => {
    if (!isoStr) return '—'
    try {
      const d = new Date(isoStr)
      return d.toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      })
    } catch {
      return '—'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarIcon className="text-blue-600 dark:text-blue-400" size={24} />
            Daily Task Submission Calendar
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your daily submission compliance, verified dates, and 3 mandatory session logs from PostgreSQL.
          </p>
        </div>

        {/* Month Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="h-9 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-3 text-xs font-bold text-slate-800 dark:text-white min-w-[110px] text-center">
              {data?.month_name || `${currentMonth}/${currentYear}`}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="Refresh Calendar"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Month Submitted</span>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {data?.total_days_submitted || 0} <span className="text-xs font-bold text-slate-400">days</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Month Missed</span>
          <p className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-1">
            {data?.total_days_missed || 0} <span className="text-xs font-bold text-slate-400">days</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sessions Stored</span>
          <p className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
            {data?.total_sessions_submitted || 0} <span className="text-xs font-bold text-slate-400">sessions</span>
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">All-Time Total</span>
          <p className="text-2xl font-extrabold text-slate-800 dark:text-white mt-1">
            {data?.all_time?.submitted_days || 0} <span className="text-xs font-bold text-slate-400">days ({data?.all_time?.total_sessions || 0} sessions)</span>
          </p>
        </div>
      </div>

      {/* Structured Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6">
        <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">
          Monthly Calendar View — {data?.month_name}
        </h2>

        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading submission data…</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {data?.calendar_days.map((d) => {
              const isSubmitted = d.status === 'submitted'
              const isMissed = d.status === 'missed'
              const isFrozen = d.status === 'frozen'
              const isPending = d.status === 'today_pending'

              let borderBg = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
              if (isSubmitted) borderBg = 'border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-400 cursor-pointer'
              else if (isMissed) borderBg = 'border-red-200 dark:border-red-900/60 bg-red-50/30 dark:bg-red-950/20'
              else if (isFrozen) borderBg = 'border-amber-200 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20'
              else if (isPending) borderBg = 'border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/30'

              return (
                <div
                  key={d.date}
                  onClick={() => {
                    if (d.sessions && d.sessions.length > 0) {
                      setSelectedDay(d)
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between min-h-[105px] ${borderBg}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                      {d.day}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                      {d.weekday}
                    </span>
                  </div>

                  <div className="my-2">
                    {isSubmitted ? (
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        <span>Submitted</span>
                      </div>
                    ) : isMissed ? (
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-red-700 dark:text-red-400">
                        <XCircle size={14} className="text-red-500 shrink-0" />
                        <span>Missed</span>
                      </div>
                    ) : isFrozen ? (
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-400">
                        <Lock size={14} className="text-amber-500 shrink-0" />
                        <span>Frozen</span>
                      </div>
                    ) : isPending ? (
                      <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-700 dark:text-blue-400">
                        <Clock size={14} className="text-blue-500 shrink-0" />
                        <span>Due Today</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-600 font-medium">Upcoming</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span>{d.sessions_count}/3 sessions</span>
                    {d.sessions && d.sessions.length > 0 && (
                      <span className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-0.5">
                        <Eye size={11} /> View
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Date Table Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              Submission Logs Table
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive list of past dates with verified session counts and submission timestamps.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Sessions Submitted</th>
                <th className="px-6 py-4">Total Training Hours</th>
                <th className="px-6 py-4">Submitted Date / Time</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {data?.calendar_days
                .filter(d => d.status !== 'future' && d.status !== 'not_applicable')
                .slice()
                .reverse()
                .map(d => (
                  <tr key={d.date} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                      {formatDateDisplay(d.date)} <span className="text-slate-400 font-normal">({d.weekday})</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(d.status, d.sessions_count)}
                    </td>
                    <td className="px-6 py-4 font-bold whitespace-nowrap">
                      <span className={d.sessions_count === 3 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}>
                        {d.sessions_count} / 3 mandatory sessions
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {d.total_duration > 0 ? `${d.total_duration} hrs` : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {formatTimestamp(d.submitted_at)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {d.sessions && d.sessions.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => setSelectedDay(d)}
                          className="h-8 px-3 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>View 3 Sessions</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-Session Modal Details */}
      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  Sessions Submitted for {formatDateDisplay(selectedDay.date)}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Submitted at: <strong className="text-slate-700 dark:text-slate-200">{formatTimestamp(selectedDay.submitted_at)}</strong> • Total Duration: <strong className="text-slate-700 dark:text-slate-200">{selectedDay.total_duration} hrs</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body with 3 Sessions */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedDay.sessions.map((s, idx) => (
                <div
                  key={s.id || idx}
                  className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300">
                      {s.session_name || `Session ${s.session_number || idx + 1}`}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {s.duration_hrs} hours
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Trainer</span>
                      <span className="font-semibold text-slate-800 dark:text-white">{s.trainer_name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Technology</span>
                      <span className="font-semibold text-slate-800 dark:text-white">{s.technology_name}</span>
                    </div>
                  </div>

                  {s.concepts_covered && (
                    <div className="text-xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Concepts Covered</span>
                      <p className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                        {s.concepts_covered}
                      </p>
                    </div>
                  )}

                  {s.update_text && (
                    <div className="text-xs">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Work / Practice Summary</span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                        {s.update_text}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold transition-colors cursor-pointer"
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

export default SubmissionCalendarPage
