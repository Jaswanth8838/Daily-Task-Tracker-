import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'
import { BarChart3, Download, Clock, CheckCircle2, TrendingUp, ShieldAlert } from 'lucide-react'
import api from '../lib/api'

interface TechBreakdown {
  name: string
  hours: number
}

interface TrendItem {
  date: string
  hours: number
  count: number
}

interface StatusItem {
  name: string
  value: number
}

interface ReportsSummary {
  total_updates: number
  total_hours: number
  tech_breakdown: TechBreakdown[]
  weekly_trend: TrendItem[]
  status_breakdown: StatusItem[]
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4']

const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<ReportsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = async () => {
    setLoading(true)
    try {
      const res = await api.get('/reports/summary')
      setSummary(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/reports/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `daily_task_tracker_report_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      alert('Failed to export CSV')
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Analytics & Activity Reports</h2>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive insights across intern learning hours, domains, and compliance</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20"
        >
          <Download size={14} />
          Export Report (CSV)
        </button>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 leading-none">
              {summary ? `${summary.total_hours.toFixed(1)}h` : '0h'}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Training Hours</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 leading-none">
              {summary ? summary.total_updates : 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Updates Recorded</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 leading-none">
              {summary ? summary.tech_breakdown.length : 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">Active Tech Domains</p>
          </div>
        </div>
      </div>

      {/* Visual Charts */}
      {loading ? (
        <div className="flex justify-center p-12">
          <span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Daily Trend */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Weekly Training Hours Trend</h3>
            <p className="text-xs text-slate-500 mb-4">Hours logged each day over the past 7 days</p>
            <div className="h-64">
              {summary && summary.weekly_trend.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={summary.weekly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                      formatter={(val: any) => [`${val} hrs`, 'Duration']}
                    />
                    <Bar dataKey="hours" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">No trend data yet</div>
              )}
            </div>
          </div>

          {/* Chart 2: Tech Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-1">Hours by Technology Domain</h3>
            <p className="text-xs text-slate-500 mb-4">Distribution of hours across various skills</p>
            <div className="h-64">
              {summary && summary.tech_breakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.tech_breakdown}
                      dataKey="hours"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}h`}
                    >
                      {summary.tech_breakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val} hrs`, 'Time spent']} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">No domain hours logged yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsPage
