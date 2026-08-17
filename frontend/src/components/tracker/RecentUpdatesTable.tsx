import React, { useEffect, useState } from 'react'
import { FileText, Lock, ArrowRight, ShieldAlert, GraduationCap, Laptop } from 'lucide-react'
import api from '../../lib/api'
import { Link } from 'react-router-dom'

interface DailyUpdateItem {
  id: string
  type: string
  user_name: string
  user_email: string
  date: string
  summary: string
  status: string
  progress: number
  is_frozen: boolean
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-red-100 text-red-700',
  submitted: 'bg-blue-100 text-blue-700',
  locked: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
}

const RecentUpdatesTable: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger }) => {
  const [updates, setUpdates] = useState<DailyUpdateItem[]>([])

  const fetchRecent = async () => {
    try {
      const res = await api.get('/tracker/recent')
      setUpdates(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchRecent()
  }, [refreshTrigger])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 mt-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Recent Activity Updates</h2>
          <p className="text-xs text-slate-500">Latest training and task submissions logged across all roles</p>
        </div>
        <Link
          to="/my-updates"
          className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          View My History
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-100 text-slate-500 font-semibold text-left">
              <th className="pb-2.5 pr-3">User</th>
              <th className="pb-2.5 pr-3">Date</th>
              <th className="pb-2.5 pr-3">Type</th>
              <th className="pb-2.5 pr-3">Progress</th>
              <th className="pb-2.5 pr-3">Update Summary</th>
              <th className="pb-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {updates.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                <td className="py-2.5 pr-3">
                  <div className="font-semibold text-slate-800">{u.user_name}</div>
                  <div className="text-[10px] text-slate-400">{u.user_email}</div>
                </td>
                <td className="py-2.5 pr-3 text-slate-600 font-medium">{u.date}</td>
                <td className="py-2.5 pr-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    u.type === 'intern' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {u.type === 'intern' ? <GraduationCap size={10} /> : <Laptop size={10} />}
                    {u.type}
                  </span>
                </td>
                <td className="py-2.5 pr-3 font-semibold text-slate-700">{u.progress}%</td>
                <td className="py-2.5 pr-3 text-slate-600 max-w-[320px] truncate" title={u.summary}>
                  {u.summary}
                </td>
                <td className="py-2.5 text-center">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      STATUS_COLORS[u.status] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {u.is_frozen && <Lock size={10} />}
                    {u.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
            {updates.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <FileText size={28} className="opacity-40" />
                    <p className="text-xs font-medium">No updates submitted today yet</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RecentUpdatesTable
