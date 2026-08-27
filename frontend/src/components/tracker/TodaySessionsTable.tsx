import React, { useState } from 'react'
import { Plus, Trash2, Send, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../../lib/api'

interface SessionItem {
  id: number
  session_name: string
  trainer_name: string
  technology_name: string
  concepts_covered: string
  duration_hrs: number
  update_text: string
  status: string
}

interface TrackerData {
  id: number
  date: string
  status: string
  sessions: SessionItem[]
}

interface TodaySessionsTableProps {
  tracker: TrackerData | null
  isBlocked?: boolean
  isFrozen?: boolean
  isSubmitted?: boolean
  onRefresh?: () => void
}

const TodaySessionsTable: React.FC<TodaySessionsTableProps> = ({
  tracker,
  isBlocked = false,
  isFrozen = false,
  isSubmitted = false,
  onRefresh,
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const rawSessions = tracker?.sessions || []
  const totalDuration = rawSessions.reduce((sum, s) => sum + (s.duration_hrs || 0), 0)
  const isDisabled = isBlocked || isFrozen || isSubmitted

  const handleDelete = async (id: number) => {
    if (isDisabled) return
    setError(null)
    setSuccess(null)
    setDeletingId(id)
    try {
      await api.delete(`/tracker/session/${id}`)
      setSuccess('Session removed successfully.')
      if (onRefresh) onRefresh()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete session.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSubmitTracker = async () => {
    if (isDisabled || rawSessions.length === 0) return
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      await api.post('/tracker/submit')
      setSuccess('Daily tracker submitted successfully!')
      if (onRefresh) onRefresh()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit daily tracker.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Today's Training Sessions</h2>
        <span className="text-xs font-semibold text-slate-500 uppercase bg-slate-100 px-2.5 py-1 rounded-md">
          {rawSessions.length} logged
        </span>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3.5 flex items-start gap-2 text-xs text-red-700 font-medium">
          <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2 text-xs text-emerald-700 font-medium">
          <CheckCircle size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Table / Empty State */}
      {rawSessions.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <p className="text-sm font-semibold text-slate-500">No sessions logged for today yet.</p>
          <p className="text-xs text-slate-400 mt-1">Use the form on the left to log your first training session.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold text-left">
                <th className="pb-3 text-xs font-bold uppercase tracking-wider pr-3">Session</th>
                <th className="pb-3 text-xs font-bold uppercase tracking-wider pr-3">Trainer</th>
                <th className="pb-3 text-xs font-bold uppercase tracking-wider pr-3">Technology</th>
                <th className="pb-3 text-xs font-bold uppercase tracking-wider pr-3">Concepts</th>
                <th className="pb-3 text-xs font-bold uppercase tracking-wider pr-3">Duration</th>
                <th className="pb-3 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rawSessions.map((s) => {
                const conceptList = s.concepts_covered
                  ? s.concepts_covered.split(',').map(c => c.trim()).filter(Boolean)
                  : []

                return (
                  <tr key={s.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3.5 pr-3 font-semibold text-slate-800 whitespace-nowrap">
                      {s.session_name}
                    </td>
                    <td className="py-3.5 pr-3 text-slate-600 font-medium whitespace-nowrap">
                      {s.trainer_name}
                    </td>
                    <td className="py-3.5 pr-3 text-slate-600 font-medium whitespace-nowrap">
                      {s.technology_name}
                    </td>
                    <td className="py-3.5 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {conceptList.map((c, i) => (
                          <span
                            key={i}
                            className="inline-block bg-blue-50 text-blue-700 font-semibold text-[11px] px-2 py-0.5 rounded border border-blue-100"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 pr-3 text-slate-700 font-bold whitespace-nowrap">
                      {s.duration_hrs.toFixed(1)} hrs
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={isDisabled || deletingId === s.id}
                        onClick={() => handleDelete(s.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Delete Session"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer / Submission Area */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <span className="font-semibold text-slate-600 text-sm">
          Total Duration logged: <span className="font-bold text-slate-800">{totalDuration.toFixed(1)} hrs</span>
        </span>

        {rawSessions.length > 0 && !isDisabled && (
          <button
            type="button"
            disabled={submitting}
            onClick={handleSubmitTracker}
            className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm transition-all shadow-sm shadow-emerald-600/30 flex items-center justify-center gap-2"
          >
            <Send size={15} />
            {submitting ? 'Submitting…' : 'Submit Today\'s Tracker'}
          </button>
        )}
      </div>
    </div>
  )
}

export default TodaySessionsTable
