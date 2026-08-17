import React, { useEffect, useState, useCallback } from 'react'
import { Search, Lock, Unlock, Eye, X, BookOpen, Users, Code2 } from 'lucide-react'
import api from '../../lib/api'

interface InternReport {
  id: number
  user_name: string
  user_email: string
  department: string
  date: string
  training_details: string
  training_status: string
  training_progress: number
  meeting_details: string
  meeting_status: string
  meeting_notes: string
  practice_details: string
  practice_status: string
  practice_progress: number
  overall_status: string
  is_frozen: boolean
  created_at: string
  updated_at: string
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-red-100 text-red-700',
}

const AdminInternReportsPage: React.FC = () => {
  const [reports, setReports] = useState<InternReport[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [frozenFilter, setFrozenFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedReport, setSelectedReport] = useState<InternReport | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '15' })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (frozenFilter) params.set('is_frozen', frozenFilter)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const res = await api.get(`/admin/intern-reports?${params}`)
      setReports(res.data.reports)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search, statusFilter, frozenFilter, dateFrom, dateTo, page])

  useEffect(() => { fetchReports() }, [fetchReports])

  const handleFreeze = async (id: number, freeze: boolean) => {
    try {
      await api.put(`/admin/intern-reports/${id}/${freeze ? 'freeze' : 'unfreeze'}`)
      fetchReports()
      if (selectedReport?.id === id) setSelectedReport(null)
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Intern Daily Reports</h2>
          <p className="text-xs text-slate-500">{total} total intern reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name, email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="not_started">Not Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="blocked">Blocked</option>
        </select>
        <select value={frozenFilter} onChange={e => { setFrozenFilter(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500">
          <option value="">All Reports</option>
          <option value="true">Frozen Only</option>
          <option value="false">Active Only</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-10"><span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="px-5 py-3">Intern</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Training</th>
                  <th className="px-5 py-3">Meeting</th>
                  <th className="px-5 py-3">Practice</th>
                  <th className="px-5 py-3">Overall</th>
                  <th className="px-5 py-3 text-center">Frozen</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-800">{r.user_name}</div>
                      <div className="text-[10px] text-slate-400">{r.user_email}</div>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{r.date}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <BookOpen size={11} className="text-blue-500" />
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[r.training_status]}`}>
                          {r.training_status.replace('_',' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <Users size={11} className="text-purple-500" />
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[r.meeting_status]}`}>
                          {r.meeting_status.replace('_',' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <Code2 size={11} className="text-emerald-500" />
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[r.practice_status]}`}>
                          {r.practice_status.replace('_',' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_COLORS[r.overall_status]}`}>
                        {r.overall_status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {r.is_frozen ? <Lock size={15} className="text-amber-600 mx-auto" /> : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setSelectedReport(r)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => handleFreeze(r.id, !r.is_frozen)}
                          className={`p-1 rounded transition-colors ${r.is_frozen ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}>
                          {r.is_frozen ? <Unlock size={15} /> : <Lock size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400 text-xs">No intern reports found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">← Prev</button>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedReport(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{selectedReport.user_name} — {selectedReport.date}</h3>
                <p className="text-xs text-slate-500">{selectedReport.user_email}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-4 text-xs">
              {/* Training */}
              <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-700"><BookOpen size={14} className="text-blue-600" /> Training</div>
                <p className="text-slate-600 mb-2">{selectedReport.training_details || '—'}</p>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[selectedReport.training_status]}`}>{selectedReport.training_status.replace('_',' ')}</span>
                  <span className="text-slate-500">Progress: <strong>{selectedReport.training_progress}%</strong></span>
                </div>
              </div>
              {/* Meeting */}
              <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-4">
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-700"><Users size={14} className="text-purple-600" /> Meeting</div>
                <p className="text-slate-600 mb-1">{selectedReport.meeting_details || '—'}</p>
                <p className="text-slate-500 italic mb-2">{selectedReport.meeting_notes || '—'}</p>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[selectedReport.meeting_status]}`}>{selectedReport.meeting_status.replace('_',' ')}</span>
              </div>
              {/* Practice */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-700"><Code2 size={14} className="text-emerald-600" /> Practice</div>
                <p className="text-slate-600 mb-2">{selectedReport.practice_details || '—'}</p>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[selectedReport.practice_status]}`}>{selectedReport.practice_status.replace('_',' ')}</span>
                  <span className="text-slate-500">Progress: <strong>{selectedReport.practice_progress}%</strong></span>
                </div>
              </div>
              <div className="flex justify-between items-center border-t border-slate-100 pt-3">
                <div>Overall: <span className={`ml-1 font-bold px-2 py-0.5 rounded ${STATUS_COLORS[selectedReport.overall_status]}`}>{selectedReport.overall_status?.replace('_',' ')}</span></div>
                <button onClick={() => handleFreeze(selectedReport.id, !selectedReport.is_frozen)}
                  className={`text-xs px-4 py-2 rounded-lg font-medium border transition-colors ${
                    selectedReport.is_frozen ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                  }`}>
                  {selectedReport.is_frozen ? '🔓 Unfreeze' : '🔒 Freeze'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminInternReportsPage
