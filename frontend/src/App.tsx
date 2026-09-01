import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'

// Pages
import DashboardPage from './pages/DashboardPage'
import DailyTrackerPage from './pages/DailyTrackerPage'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
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
import AdminInternsPage from './pages/admin/AdminInternsPage'
import InternPerformancePage from './pages/admin/InternPerformancePage'
import AdminTrackerAccessPage from './pages/admin/AdminTrackerAccessPage'

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
  '/admin/interns': 'HR — Interns & Performance',
  '/admin/tracker-access': 'HR — Tracker Access & Overrides',
  '/admin/users': 'Admin — Users',
  '/admin/reports': 'Admin — Employee Reports',
  '/admin/intern-reports': 'Admin — Intern Reports',
  '/admin/activity-logs': 'Admin — Activity Logs',
}

const AppLayout: React.FC = () => {
  const location = useLocation()
  const { user } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const isAdmin = user?.role === 'hr' || user?.role === 'admin'
  const title = PAGE_TITLES[location.pathname] ?? 'Wallstreet LLC Consulting Services'
  const sidebarWidth = sidebarCollapsed ? 72 : 240

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div style={{ marginLeft: sidebarWidth, transition: 'margin-left 0.2s' }}>
        <Header
          title={title}
          sidebarWidth={sidebarWidth}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main style={{ paddingTop: 64 }}>
          <div className="p-8 max-w-[1560px] mx-auto">
            <Routes>
              <Route path="/" element={isAdmin ? <Navigate to="/admin" replace /> : <DashboardPage />} />
              <Route path="/tracker" element={isAdmin ? <Navigate to="/admin" replace /> : <DailyTrackerPage />} />
              <Route path="/my-updates" element={isAdmin ? <Navigate to="/admin/interns" replace /> : <MyUpdatesPage />} />
              <Route path="/team-updates" element={isAdmin ? <TeamUpdatesPage /> : <Navigate to="/" replace />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/master-data" element={isAdmin ? <MasterDataPage /> : <Navigate to="/" replace />} />
              <Route path="/users" element={isAdmin ? <UsersPage /> : <Navigate to="/" replace />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/audit-logs" element={isAdmin ? <AuditLogsPage /> : <Navigate to="/" replace />} />
              {/* Employee & Intern Report */}
              <Route path="/daily-report" element={<EmployeeReportPage />} />
              <Route path="/intern-report" element={<InternReportPage />} />
              {/* Admin & HR Interns Section */}
              <Route path="/admin" element={isAdmin ? <AdminDashboardPage /> : <Navigate to="/" replace />} />
              <Route path="/admin/interns" element={isAdmin ? <AdminInternsPage /> : <Navigate to="/" replace />} />
              <Route path="/admin/interns/:internId" element={isAdmin ? <InternPerformancePage /> : <Navigate to="/" replace />} />
              <Route path="/admin/tracker-access" element={isAdmin ? <AdminTrackerAccessPage /> : <Navigate to="/" replace />} />
              <Route path="/admin/users" element={isAdmin ? <AdminUsersPage /> : <Navigate to="/" replace />} />
              <Route path="/admin/reports" element={isAdmin ? <AdminReportsPage /> : <Navigate to="/" replace />} />
              <Route path="/admin/intern-reports" element={isAdmin ? <AdminInternReportsPage /> : <Navigate to="/" replace />} />
              <Route path="/admin/activity-logs" element={isAdmin ? <AdminActivityPage /> : <Navigate to="/" replace />} />
              <Route path="*" element={<Navigate to={isAdmin ? '/admin' : '/'} replace />} />
            </Routes>
          </div>
          <footer className="flex items-center justify-between px-8 py-6 text-sm text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-800/80 mt-8">
            <span>© 2026 Task Tracker. All rights reserved.</span>
            <span>Version 1.0.0</span>
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
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading…</p>
        </div>
      </div>
    )
  }

  if (!initialized) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="*" element={<SetupPage onSetupComplete={() => setInitialized(true)} />} />
      </Routes>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return <AppLayout />
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
