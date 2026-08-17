import React, { useState } from 'react'
import KPICards from '../components/dashboard/KPICards'
import DailyTrackerForm from '../components/tracker/DailyTrackerForm'
import SessionsTable from '../components/tracker/SessionsTable'
import MeetingsTable from '../components/tracker/MeetingsTable'
import RecentUpdatesTable from '../components/tracker/RecentUpdatesTable'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { GraduationCap, ArrowRight } from 'lucide-react'

const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const isIntern = user?.role === 'intern'

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      <KPICards key={`kpi-${refreshTrigger}`} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {isIntern ? (
          <div className="bg-white rounded-xl border border-blue-200/80 shadow-sm p-6 flex flex-col justify-between h-full min-h-[300px]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Specialized Intern Report</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Custom daily logging for your training & work activities</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                As an Intern, your daily reports are segmented into **Training progress**, **Meetings attended**, and **Practice updates**. Please use your dedicated report submission page to update your status throughout the day.
              </p>
            </div>
            <div className="pt-6">
              <Link
                to="/intern-report"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all shadow-md shadow-blue-500/10"
              >
                Go to Intern Daily Report
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ) : (
          <DailyTrackerForm onUpdateSaved={handleRefresh} />
        )}
        <SessionsTable refreshTrigger={refreshTrigger} />
      </div>

      <div className="grid grid-cols-1 gap-5">
        <MeetingsTable refreshTrigger={refreshTrigger} />
      </div>

      <RecentUpdatesTable refreshTrigger={refreshTrigger} />
    </div>
  )
}

export default DashboardPage
