import React, { useEffect, useState } from 'react'
import { Users, Calendar, Lock, FileText, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'

interface Stats {
  total_interns: number
  updates_today: number
  locked_entries: number
  sessions_today: number
}

interface KPICardProps {
  icon: React.ReactNode
  iconBg: string
  value: number | string
  label: string
  linkPath: string
}

const KPICard: React.FC<KPICardProps> = ({ icon, iconBg, value, label, linkPath }) => (
  <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-6 flex items-center gap-4.5 hover:shadow-md transition-shadow">
    {/* Colored rounded icon box */}
    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-3xl font-extrabold text-slate-800 tracking-tight leading-none">{value}</p>
      <p className="text-sm text-slate-500 font-medium mt-1.5">{label}</p>
      <Link
        to={linkPath}
        className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 mt-2 transition-colors group"
      >
        View all <ChevronRight size={14} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  </div>
)

const KPICards: React.FC = () => {
  const [stats, setStats] = useState<Stats>({
    total_interns: 28,
    updates_today: 21,
    locked_entries: 7,
    sessions_today: 2,
  })

  useEffect(() => {
    api.get('/dashboard/stats')
      .then(res => {
        if (res.data) {
          setStats({
            total_interns: res.data.total_interns || 28,
            updates_today: res.data.updates_today || 21,
            locked_entries: res.data.locked_entries || 7,
            sessions_today: res.data.sessions_today || 2,
          })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <KPICard
        icon={<Users size={26} className="text-blue-600" />}
        iconBg="bg-blue-50"
        value={stats.total_interns}
        label="Total Interns"
        linkPath="/users"
      />
      <KPICard
        icon={<Calendar size={26} className="text-emerald-500" />}
        iconBg="bg-emerald-50"
        value={stats.updates_today}
        label="Updates Today"
        linkPath="/my-updates"
      />
      <KPICard
        icon={<Lock size={26} className="text-amber-500" />}
        iconBg="bg-amber-50"
        value={stats.locked_entries}
        label="Locked Entries"
        linkPath="/audit-logs"
      />
      <KPICard
        icon={<FileText size={26} className="text-purple-500" />}
        iconBg="bg-purple-50"
        value={stats.sessions_today}
        label="Sessions Today"
        linkPath="/tracker"
      />
    </div>
  )
}

export default KPICards
