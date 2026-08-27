import React, { useState, useEffect } from 'react'
import { Calendar } from 'lucide-react'
import DailyTrackerForm from '../components/tracker/DailyTrackerForm'
import api from '../lib/api'

const DailyTrackerPage: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [trackerState, setTrackerState] = useState<{
    today: string
    tracker: any
    access_status: string
    is_blocked: boolean
    is_frozen: boolean
    is_submitted: boolean
  } | null>(null)

  const fetchTodayState = async () => {
    try {
      const res = await api.get('/tracker/today')
      setTrackerState(res.data)
    } catch (err) {
      console.error('Failed to fetch today tracker state', err)
    }
  }

  useEffect(() => {
    fetchTodayState()
  }, [refreshTrigger])

  const handleRefresh = () => setRefreshTrigger(prev => prev + 1)

  const todayStr = new Date().toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Daily Tracker</h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <Calendar size={15} />
            {todayStr}
          </p>
        </div>
        {trackerState?.is_submitted && (
          <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Submitted for Today
          </span>
        )}
      </div>

      {/* 3-Session Tracker Form Component */}
      <DailyTrackerForm
        tracker={trackerState?.tracker || null}
        accessStatus={trackerState?.access_status}
        isBlocked={trackerState?.is_blocked || false}
        isFrozen={trackerState?.is_frozen || false}
        isSubmitted={trackerState?.is_submitted || false}
        onUpdateSaved={handleRefresh}
      />
    </div>
  )
}

export default DailyTrackerPage
