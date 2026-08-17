import React, { useEffect, useState } from 'react'
import { Users, ClipboardCheck, Lock, MonitorPlay, ArrowRight } from 'lucide-react'
import api from '../../lib/api'

interface Stats {
  total_interns: number
  updates_today: number
  locked_entries: number
  sessions_today: number
}

const KPICard: React.FC<{
  icon: React.ReactNode
  iconBg: string
  value: number | string
  label: string
  loading?: boolean
}> = ({ icon, iconBg, value, label, loading }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      {loading ? (
        <div className="h-7 w-12 bg-slate-200 animate-pulse rounded mb-1" />
      ) : (
        <p className="text-2xl font-bold text-slate-800 leading-tight">{value}</p>
      )}
      <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      <button className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mt-1.5 transition-colors">
        View all <ArrowRight size={12} />
      </button>
    </div>
  </div>
)

const KPICards: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => setStats(res.data))
      .catch(() => setStats({ total_interns: 0, updates_today: 0, locked_entries: 0, sessions_today: 0 }))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <KPICard icon={<Users size={22} className="text-blue-600" />} iconBg="bg-blue-50"
        value={stats?.total_interns ?? 0} label="Total Interns" loading={loading} />
      <KPICard icon={<ClipboardCheck size={22} className="text-green-600" />} iconBg="bg-green-50"
        value={stats?.updates_today ?? 0} label="Updates Today" loading={loading} />
      <KPICard icon={<Lock size={22} className="text-amber-600" />} iconBg="bg-amber-50"
        value={stats?.locked_entries ?? 0} label="Locked Entries" loading={loading} />
      <KPICard icon={<MonitorPlay size={22} className="text-purple-600" />} iconBg="bg-purple-50"
        value={stats?.sessions_today ?? 0} label="Sessions Today" loading={loading} />
    </div>
  )
}

export default KPICards
