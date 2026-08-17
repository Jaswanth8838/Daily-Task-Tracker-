import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, ClipboardList, FileText, Users, BarChart2,
  Database, Settings, ScrollText, ChevronLeft, ChevronRight,
  LogOut, Shield, GraduationCap, ClipboardCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import WallstreetLogo from './WallstreetLogo'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  roles: string[]
}

const navItems: NavItem[] = [
  // --- Admin Section (top for HR/Admin) ---
  { label: 'Dashboard', icon: <Shield size={18} />, path: '/admin', roles: ['hr', 'admin'] },
  { label: 'Users', icon: <Users size={18} />, path: '/admin/users', roles: ['hr', 'admin'] },
  { label: 'Emp Reports', icon: <FileText size={18} />, path: '/admin/reports', roles: ['hr', 'admin'] },
  { label: 'Intern Reports', icon: <GraduationCap size={18} />, path: '/admin/intern-reports', roles: ['hr', 'admin'] },
  { label: 'Activity Logs', icon: <ScrollText size={18} />, path: '/admin/activity-logs', roles: ['hr', 'admin'] },

  // --- General Portal (non-admin) ---
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/', roles: ['intern', 'manager', 'employee'] },
  { label: 'Daily Tracker', icon: <ClipboardList size={18} />, path: '/tracker', roles: ['manager', 'employee'] },
  { label: 'My Updates', icon: <FileText size={18} />, path: '/my-updates', roles: ['intern', 'manager', 'employee'] },
  { label: 'Team Updates', icon: <Users size={18} />, path: '/team-updates', roles: ['manager', 'employee'] },
  { label: 'Reports', icon: <BarChart2 size={18} />, path: '/reports', roles: ['intern', 'manager', 'employee'] },
  { label: 'Master Data', icon: <Database size={18} />, path: '/master-data', roles: ['manager'] },
  { label: 'Settings', icon: <Settings size={18} />, path: '/settings', roles: ['intern', 'manager', 'employee', 'hr', 'admin'] },

  // --- Specialized Daily Report Roles ---
  { label: 'My Daily Report', icon: <ClipboardCheck size={18} />, path: '/daily-report', roles: ['employee', 'manager'] },
  { label: 'Intern Report', icon: <GraduationCap size={18} />, path: '/intern-report', roles: ['intern'] },
]


const Sidebar: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const role = user?.role ?? 'intern'
  const filteredNav = navItems.filter(item => item.roles.includes(role))

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <aside
      className="flex flex-col h-screen fixed top-0 left-0 z-30 transition-all duration-300 shadow-xl"
      style={{ width: collapsed ? 64 : 240, background: '#111827' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-3.5 border-b border-white/10" style={{ minHeight: 56 }}>
        <div className="flex-shrink-0">
          <WallstreetLogo className="w-9 h-9" />
        </div>
        {!collapsed && (
          <div className="leading-none min-w-0">
            <span className="block text-[11px] font-extrabold tracking-[0.08em] whitespace-nowrap" style={{ color: '#1e2d5b', fontFamily: "'Inter', sans-serif" }}>
              <span style={{ color: '#ffffff' }}>WALL STREET</span>
            </span>
            <span className="block text-[8.5px] font-bold tracking-[0.18em] whitespace-nowrap mt-0.5" style={{ color: '#f07c24', fontFamily: "'Inter', sans-serif" }}>
              CONSULTING SERVICES
            </span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto space-y-1">
        {filteredNav.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 mx-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="border-t border-white/10 p-3 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-bold truncate">{user?.name ?? 'User'}</p>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">{user?.role ?? ''}</p>
            </div>
          )}
          <div className="flex items-center gap-1 ml-auto flex-shrink-0">
            <button onClick={handleLogout} title="Sign out"
              className="text-slate-400 hover:text-red-400 transition-colors p-1 rounded">
              <LogOut size={14} />
            </button>
            <button onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded">
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
