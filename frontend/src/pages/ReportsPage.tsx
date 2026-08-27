import React, { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { Code2, Clock, BookOpen, Layers, RefreshCw, BarChart2 } from 'lucide-react'
import { reportService } from '../services/reportService'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

interface TechStat {
  technology: string
  hours: number
  sessions: number
  percentage: number
}

interface LanguageReportData {
  total_technologies: number
  total_hours: number
  total_sessions: number
  technologies: TechStat[]
}

const COLOR_PALETTE = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b']

const ReportsPage: React.FC = () => {
  const { user } = useAuth()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [data, setData] = useState<LanguageReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchInternReports = useCallback(async () => {
    try {
      const res = await reportService.getInternLanguageReports()
      setData(res)
    } catch (err) {
      console.error('Failed to load intern language reports', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchInternReports()
  }, [fetchInternReports])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchInternReports()
  }

  const textColor = isDark ? '#f1f5f9' : '#1e293b'
  const gridColor = isDark ? '#334155' : '#e2e8f0'

  if (loading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading technology statistics…</p>
      </div>
    )
  }

  const technologies = data?.technologies || []

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <Code2 className="text-blue-600 dark:text-blue-400" size={24} />
            My Technology &amp; Language Statistics
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personal technology domain breakdown, total hours, and session statistics calculated from your PostgreSQL records.
          </p>
        </div>

        <button
          type="button"
          id="btn-refresh-intern-reports"
          name="btnRefreshInternReports"
          onClick={handleRefresh}
          className="h-10 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
        >
          <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-none">
              {data?.total_technologies || 0}
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Technologies Learned</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-none">
              {data?.total_hours.toFixed(1) || '0.0'} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">hrs</span>
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Total Training Hours</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400 flex-shrink-0">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-none">
              {data?.total_sessions || 0}
            </p>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Logged Sessions</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart: Technology vs Hours */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white">Training Hours by Technology</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Total time invested in each technical domain</p>
            </div>
            <BarChart2 size={18} className="text-blue-600 dark:text-blue-400" />
          </div>

          {technologies.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No technology data recorded yet.</div>
          ) : (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={technologies} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis dataKey="technology" stroke={textColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={textColor} fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#cbd5e1',
                      borderRadius: '12px',
                      color: isDark ? '#ffffff' : '#0f172a',
                      fontSize: '12px',
                      fontWeight: 600
                    }}
                    formatter={(val: any) => [`${val} hrs`, 'Training Hours']}
                  />
                  <Bar dataKey="hours" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Donut Chart: Technology Share */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Technology Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Percentage share of overall learning time</p>
          </div>

          {technologies.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">No technology data.</div>
          ) : (
            <>
              <div className="h-52 w-full my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={technologies}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="hours"
                      nameKey="technology"
                    >
                      {technologies.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1e293b' : '#ffffff',
                        borderColor: isDark ? '#334155' : '#cbd5e1',
                        borderRadius: '12px',
                        color: isDark ? '#ffffff' : '#0f172a',
                        fontSize: '12px',
                        fontWeight: 600
                      }}
                      formatter={(val: any) => [`${val} hrs`, 'Hours']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
                {technologies.slice(0, 4).map((item, idx) => (
                  <div key={item.technology} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_PALETTE[idx % COLOR_PALETTE.length] }} />
                      <span className="text-slate-700 dark:text-slate-300">{item.technology}</span>
                    </div>
                    <span className="text-slate-900 dark:text-white font-bold">{item.percentage}% ({item.hours}h)</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Technology Breakdown Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Detailed Technology Breakdown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Complete summary of hours and session counts per domain</p>
          </div>
        </div>

        {technologies.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No technology breakdown available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3.5 px-6">Technology / Domain</th>
                  <th className="py-3.5 px-4">Total Sessions</th>
                  <th className="py-3.5 px-4">Total Hours</th>
                  <th className="py-3.5 px-6 text-right">% Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {technologies.map((t, idx) => (
                  <tr key={t.technology} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-800 dark:text-white whitespace-nowrap flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_PALETTE[idx % COLOR_PALETTE.length] }} />
                      {t.technology}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-200 font-semibold whitespace-nowrap">
                      {t.sessions} sessions
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-white whitespace-nowrap">
                      {t.hours.toFixed(1)} hrs
                    </td>
                    <td className="py-3.5 px-6 text-right font-extrabold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {t.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReportsPage
