import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'

// Pages
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import SetupPage from './pages/SetupPage'
import MasterDataPage from './pages/MasterDataPage'
import UsersPage from './pages/UsersPage'
import MyUpdatesPage from './pages/MyUpdatesPage'
import TeamUpdatesPage from './pages/TeamUpdatesPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import AuditLogsPage from './pages/AuditLogsPage'
import EmployeeReportPage from './pages/EmployeeReportPage'
import InternReportPage from './pages/InternReportPage'

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminUsersPage from './pages/admin/AdminUsersPage'
import AdminReportsPage from './pages/admin/AdminReportsPage'
import AdminInternReportsPage from './pages/admin/AdminInternReportsPage'
import AdminActivityPage from './pages/admin/AdminActivityPage'

import api from './lib/api'

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/tracker': 'Daily Tracker',
  '/my-updates': 'My Updates',
  '/team-updates': 'Team Updates',
  '/reports': 'Reports & Analytics',
  '/master-data': 'Master Data',
  '/users': 'User Management',
  '/settings': 'Settings',
  '/audit-logs': 'Audit Logs',
  '/daily-report': 'My Daily Report',
  '/intern-report': 'Intern Daily Report',
  '/admin': 'Admin Dashboard',
  '/admin/users': 'Admin — Users',
  '/admin/reports': 'Admin — Employee Reports',
  '/admin/intern-reports': 'Admin — Intern Reports',
  '/admin/activity-logs': 'Admin — Activity Logs',
}

const SIDEBAR_WIDTH = 240

const AppLayout: React.FC = () => {
  const location = useLocation()
  const { user } = useAuth()
  const isAdmin = user?.role === 'hr' || user?.role === 'admin'
  const title = PAGE_TITLES[location.pathname] ?? 'Wallstreet LLC Consulting Services'

  return (
    <div className="min-h-screen bg-slate-100/70">
      <Sidebar />
      <div style={{ marginLeft: SIDEBAR_WIDTH }}>
        <Header title={title} sidebarWidth={SIDEBAR_WIDTH} />
        <main style={{ paddingTop: 56 }}>
          <div className="p-6 max-w-7xl mx-auto">
            <Routes>
              {/* Root: redirect admins to /admin, others to dashboard */}
              <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <DashboardPage />} />
              <Route path="/tracker" element={<DashboardPage />} />
              <Route path="/my-updates" element={<MyUpdatesPage />} />
              <Route path="/team-updates" element={<TeamUpdatesPage />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/master-data" element={<MasterDataPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              {/* Employee & Intern Report */}
              <Route path="/daily-report" element={<EmployeeReportPage />} />
              <Route path="/intern-report" element={<InternReportPage />} />
              {/* Admin Section */}
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/reports" element={<AdminReportsPage />} />
              <Route path="/admin/intern-reports" element={<AdminInternReportsPage />} />
              <Route path="/admin/activity-logs" element={<AdminActivityPage />} />
              <Route path="*" element={<Navigate to={isAdmin ? '/admin' : '/'} replace />} />
            </Routes>
          </div>
          <footer className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200/80 bg-white mt-10">
            <span className="text-xs text-slate-400">© 2025 Wallstreet LLC Consulting Services. All rights reserved.</span>
            <span className="text-xs font-medium text-slate-400">Enterprise Edition v2.0.0</span>
          </footer>
        </main>
      </div>
    </div>
  )
}


const AppRouter: React.FC = () => {
  const { user, loading } = useAuth()
  const [setupChecked, setSetupChecked] = useState(false)
  const [initialized, setInitialized] = useState<boolean | null>(null)

  useEffect(() => {
    api.get('/setup/status')
      .then(res => setInitialized(res.data.initialized))
      .catch(() => setInitialized(true))
      .finally(() => setSetupChecked(true))
  }, [])

  if (!setupChecked || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">Loading…</p>
        </div>
      </div>
    )
  }

  if (!initialized) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<SetupPage onSetupComplete={() => setInitialized(true)} />} />
      </Routes>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return <AppLayout />
}

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  )
}

export default App
