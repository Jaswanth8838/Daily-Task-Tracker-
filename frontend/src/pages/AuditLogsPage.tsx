import React, { useEffect, useState } from 'react'
import { ScrollText, Clock, User, ShieldCheck } from 'lucide-react'
import api from '../lib/api'

interface AuditLogItem {
  id: number
  user_name: string
  user_role: string
  action: string
  details: string
  created_at: string
}

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/audit-logs')
      setLogs(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Security & Activity Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time immutable audit trail for compliance, access tracking, and system actions</p>
        </div>
        <span className="bg-slate-100 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-medium border border-slate-200">
          {logs.length} logged events
        </span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
          </div>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{l.user_name}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-block uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {l.user_role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {l.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-md">{l.details}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                      <ScrollText size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="font-medium text-xs">No audit logs recorded yet</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditLogsPage
