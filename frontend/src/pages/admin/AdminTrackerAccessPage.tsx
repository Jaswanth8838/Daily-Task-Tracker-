import React from 'react'
import { Shield } from 'lucide-react'
import TrackerAccessManager from '../../components/admin/TrackerAccessManager'

const AdminTrackerAccessPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <Shield className="text-purple-600 dark:text-purple-400" size={24} />
            Intern Tracker Access &amp; Submission Overrides
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage 24-hour freeze overrides, grant temporary access, and review historical audit logs from PostgreSQL.
          </p>
        </div>
      </div>

      {/* Access Manager Component */}
      <TrackerAccessManager />
    </div>
  )
}

export default AdminTrackerAccessPage
