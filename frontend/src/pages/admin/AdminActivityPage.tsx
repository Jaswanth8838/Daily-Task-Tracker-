import React, { useEffect, useState, useCallback } from 'react'
import { Search, ScrollText, Filter } from 'lucide-react'
import api from '../../lib/api'

interface LogItem {
  id: number
  user_name: string
  user_role: string
  action: string
  details: string | null
  affected_record_id: number | null
  affected_table: string | null
  old_value: string | null
  new_value: string | null
  ip_address: string | null
  created_at: string
}

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'bg-blue-100 text-blue-700',
  SIGNUP: 'bg-emerald-100 text-emerald-700',
  EMPLOYEE_REPORT_CREATED: 'bg-cyan-100 text-cyan-700',
  EMPLOYEE_REPORT_UPDATED: 'bg-indigo-100 text-indigo-700',
  INTERN_REPORT_CREATED: 'bg-teal-100 text-teal-700',
  INTERN_REPORT_UPDATED: 'bg-violet-100 text-violet-700',
  ADMIN_REPORT_FROZEN: 'bg-amber-100 text-amber-700',
  ADMIN_REPORT_UNFROZEN: 'bg-emerald-100 text-emerald-700',
  ADMIN_REPORT_EDITED: 'bg-orange-100 text-orange-700',
  ADMIN_USER_UPDATED: 'bg-purple-100 text-purple-700',
}

const AdminActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '30' })
      if (search) params.set('search', search)
      if (actionFilter) params.set('action', actionFilter)
      if (dateFrom) params.set('date_from', dateFrom)
      if (dateTo) params.set('date_to', dateTo)
      const res = await api.get(`/admin/activity-logs?${params}`)
      setLogs(res.data.logs)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search, actionFilter, dateFrom, dateTo, page])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Activity & Audit Logs</h2>
          <p className="text-xs text-slate-500">{total} total events tracked</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search user, action, details..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500">
          <option value="">All Actions</option>
          <option value="LOGIN">Login</option>
          <option value="SIGNUP">Signup</option>
          <option value="EMPLOYEE_REPORT_CREATED">Report Created</option>
          <option value="EMPLOYEE_REPORT_UPDATED">Report Updated</option>
          <option value="INTERN_REPORT_CREATED">Intern Report Created</option>
          <option value="INTERN_REPORT_UPDATED">Intern Report Updated</option>
          <option value="ADMIN_REPORT_FROZEN">Report Frozen</option>
          <option value="ADMIN_REPORT_UNFROZEN">Report Unfrozen</option>
          <option value="ADMIN_REPORT_EDITED">Admin Edited</option>
          <option value="ADMIN_USER_UPDATED">User Updated</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs" />
        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs" />
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-10"><span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Details</th>
                  <th className="px-5 py-3">IP</th>
                  <th className="px-5 py-3 text-center">Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(l => (
                  <React.Fragment key={l.id}>
                    <tr
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                    >
                      <td className="px-5 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(l.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{l.user_name}</td>
                      <td className="px-5 py-3">
                        <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">{l.user_role}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${ACTION_COLORS[l.action] || 'bg-slate-100 text-slate-600'}`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-500 max-w-[200px] truncate">{l.details}</td>
                      <td className="px-5 py-3 font-mono text-[10px] text-slate-400">{l.ip_address || '—'}</td>
                      <td className="px-5 py-3 text-center text-slate-400">
                        {l.affected_record_id ? `#${l.affected_record_id}` : '—'}
                      </td>
                    </tr>
                    {expanded === l.id && (l.old_value || l.new_value) && (
                      <tr>
                        <td colSpan={7} className="px-5 py-3 bg-slate-50 border-b border-slate-100">
                          <div className="grid grid-cols-2 gap-3">
                            {l.old_value && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-500 mb-1">BEFORE</p>
                                <pre className="text-[10px] bg-red-50 border border-red-100 rounded p-2 overflow-auto max-h-32 text-slate-600">
                                  {JSON.stringify(JSON.parse(l.old_value), null, 2)}
                                </pre>
                              </div>
                            )}
                            {l.new_value && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-500 mb-1">AFTER</p>
                                <pre className="text-[10px] bg-emerald-50 border border-emerald-100 rounded p-2 overflow-auto max-h-32 text-slate-600">
                                  {JSON.stringify(JSON.parse(l.new_value), null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      <ScrollText size={28} className="mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-medium">No activity logs found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {pages} — {total} events</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">← Prev</button>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminActivityPage
