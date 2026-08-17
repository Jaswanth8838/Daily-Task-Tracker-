import React, { useEffect, useState, useCallback } from 'react'
import { Search, Lock, Unlock, CheckCircle2, Eye, X, Edit3, AlertCircle } from 'lucide-react'
import api from '../../lib/api'

interface EmpReport {
  id: number
  user_name: string
  user_email: string
  department: string
  date: string
  today_work: string
  what_learned: string
  daily_status: string
  overall_progress: number
  remarks: string
  is_frozen: boolean
  is_editable: boolean
  created_at: string
  updated_at: string
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-red-100 text-red-700',
}

const AdminReportsPage: React.FC = () => {
  const [reports, setReports] = useState<EmpReport[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [frozenFilter, setFrozenFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedReport, setSelectedReport] = useState<EmpReport | null>(null)
  const [editRemarks, setEditRemarks] = useState('')
  const [saving, setSaving] = useState(false)
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchReports = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '15' })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (frozenFilter) params.set('is_frozen', frozenFilter)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const res = await api.get(`/admin/reports?${params}`)
      setReports(res.data.reports)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search, statusFilter, frozenFilter, dateFrom, dateTo, page])

  useEffect(() => { fetchReports() }, [fetchReports])

  const handleFreeze = async (id: number, freeze: boolean) => {
    try {
      await api.put(`/admin/reports/${id}/${freeze ? 'freeze' : 'unfreeze'}`)
      setActionMsg({ type: 'success', text: `Report ${freeze ? 'frozen' : 'unfrozen'} successfully` })
      fetchReports()
      if (selectedReport?.id === id) setSelectedReport(null)
    } catch (e: any) {
      setActionMsg({ type: 'error', text: e.response?.data?.error || 'Action failed' })
    }
    setTimeout(() => setActionMsg(null), 3000)
  }

  const handleAddRemarks = async () => {
    if (!selectedReport || !editRemarks.trim()) return
    setSaving(true)
    try {
      await api.put(`/admin/reports/${selectedReport.id}`, { admin_remarks: editRemarks })
      setActionMsg({ type: 'success', text: 'Admin remarks added successfully' })
      setEditRemarks('')
      fetchReports()
      setSelectedReport(null)
    } catch (e: any) {
      setActionMsg({ type: 'error', text: e.response?.data?.error || 'Failed to add remarks' })
    } finally {
      setSaving(false)
    }
    setTimeout(() => setActionMsg(null), 3000)
  }

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Employee Daily Reports</h2>
          <p className="text-xs text-slate-500">{total} total reports</p>
        </div>
      </div>

      {actionMsg && (
        <div className={`flex items-center gap-2 text-xs font-medium rounded-xl px-4 py-2.5 border ${
          actionMsg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {actionMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {actionMsg.text}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name, email, activity..."
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
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500" />
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
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Progress</th>
                  <th className="px-5 py-3">Today's Work</th>
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
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_COLORS[r.daily_status]}`}>
                        {r.daily_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.overall_progress}%` }} />
                        </div>
                        <span className="font-bold text-slate-700">{r.overall_progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 max-w-[180px] truncate">{r.today_work}</td>
                    <td className="px-5 py-3.5 text-center">
                      {r.is_frozen
                        ? <Lock size={15} className="text-amber-600 mx-auto" />
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => setSelectedReport(r)} className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors" title="View Details">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => handleFreeze(r.id, !r.is_frozen)}
                          className={`p-1 rounded transition-colors ${r.is_frozen ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'}`}
                          title={r.is_frozen ? 'Unfreeze' : 'Freeze'}>
                          {r.is_frozen ? <Unlock size={15} /> : <Lock size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-xs">No reports found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {pages} — {total} records</span>
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
                <p className="text-xs text-slate-500">{selectedReport.user_email} · {selectedReport.department || 'No dept'}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>Status: <span className={`font-bold ml-1 ${STATUS_COLORS[selectedReport.daily_status].split(' ')[1]}`}>{selectedReport.daily_status.replace('_', ' ')}</span></div>
                <div>Progress: <strong>{selectedReport.overall_progress}%</strong></div>
                <div>Frozen: <strong className={selectedReport.is_frozen ? 'text-amber-600' : 'text-emerald-600'}>{selectedReport.is_frozen ? 'Yes' : 'No'}</strong></div>
                <div>Updated: <strong>{new Date(selectedReport.updated_at).toLocaleString()}</strong></div>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">Today's Work</p>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap text-slate-700">{selectedReport.today_work || '-'}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-700 mb-1">What I Learned</p>
                <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap text-slate-700">{selectedReport.what_learned || '-'}</p>
              </div>
              {selectedReport.remarks && (
                <div>
                  <p className="font-semibold text-slate-700 mb-1">Remarks / Notes</p>
                  <p className="bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap text-slate-700">{selectedReport.remarks}</p>
                </div>
              )}

              {/* Admin Remarks */}
              <div className="border-t border-slate-100 pt-4">
                <p className="font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Edit3 size={14} /> Add Admin Remarks</p>
                <textarea rows={2} value={editRemarks} onChange={e => setEditRemarks(e.target.value)}
                  placeholder="Add an administrative note or correction..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 resize-none" />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleAddRemarks} disabled={saving || !editRemarks.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs px-4 py-2 rounded-lg font-medium flex items-center gap-1.5">
                    {saving ? 'Saving...' : 'Add Remarks'}
                  </button>
                  <button onClick={() => handleFreeze(selectedReport.id, !selectedReport.is_frozen)}
                    className={`text-xs px-4 py-2 rounded-lg font-medium border transition-colors ${
                      selectedReport.is_frozen ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                    }`}>
                    {selectedReport.is_frozen ? '🔓 Unfreeze Report' : '🔒 Freeze Report'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminReportsPage
