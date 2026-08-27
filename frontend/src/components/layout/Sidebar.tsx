import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, CheckSquare, Users, BarChart2,
  Database, Settings, ScrollText, ChevronDown, ChevronLeft, ChevronRight,
  LogOut, Shield, GraduationCap
} from 'lucide-react'
import { WallstreetEmblem } from './WallstreetLogo'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  roles: string[]
  hasSubmenu?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={19} />, path: '/', roles: ['intern', 'hr', 'admin'] },
  { label: 'Daily Tracker', icon: <Calendar size={19} />, path: '/tracker', roles: ['intern'] },
  { label: 'My Updates', icon: <CheckSquare size={19} />, path: '/my-updates', roles: ['intern'] },
  { label: 'Interns', icon: <Users size={19} />, path: '/admin/interns', roles: ['hr', 'admin'] },
  { label: 'Tracker Access', icon: <Shield size={19} />, path: '/admin/tracker-access', roles: ['hr', 'admin'] },
  { label: 'Team Updates', icon: <Users size={19} />, path: '/team-updates', roles: ['hr', 'admin'] },
  { label: 'Reports', icon: <BarChart2 size={19} />, path: '/reports', roles: ['intern', 'hr', 'admin'] },
  { label: 'Master Data', icon: <Database size={19} />, path: '/master-data', roles: ['hr', 'admin'], hasSubmenu: true },
  { label: 'Users', icon: <Users size={19} />, path: '/users', roles: ['hr', 'admin'] },
  { label: 'Settings', icon: <Settings size={19} />, path: '/settings', roles: ['intern', 'hr', 'admin'] },
  { label: 'Audit Logs', icon: <ScrollText size={19} />, path: '/audit-logs', roles: ['hr', 'admin'] },
]

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed: controlledCollapsed, onToggleCollapse }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [internalCollapsed, setInternalCollapsed] = useState(false)

  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  const handleToggle = () => {
    if (onToggleCollapse) {
      onToggleCollapse()
    } else {
      setInternalCollapsed(!internalCollapsed)
    }
  }

  const role = user?.role ?? 'hr'
  const filteredNav = navItems.filter(item => item.roles.includes(role))

  const displayName = user?.name || 'Anjali HR'
  const displayRole = (user?.role || 'HR').toUpperCase()
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <aside
      className="flex flex-col h-screen fixed top-0 left-0 z-30 transition-all duration-200"
      style={{ width: collapsed ? 72 : 240, backgroundColor: '#0f172a' }}
    >
      {/* Brand Header with Official Wall Street Logo */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/80" style={{ height: 64 }}>
        <div className="w-9 h-9 flex items-center justify-center flex-shrink-0">
          <WallstreetEmblem size={34} />
        </div>
        {!collapsed && (
          <div className="flex flex-col justify-center select-none overflow-hidden">
            <span className="font-extrabold text-white text-[15px] tracking-wider leading-tight whitespace-nowrap">
              WALL STREET
            </span>
            <span className="text-slate-400 text-[8.5px] font-semibold tracking-[0.2em] uppercase whitespace-nowrap">
              Consulting Services
            </span>
          </div>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-3.5 px-3 overflow-y-auto space-y-1.5">
        {filteredNav.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer min-h-[44px] ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </div>
            {!collapsed && item.hasSubmenu && (
              <ChevronDown size={15} className="text-slate-400" />
            )}
          </NavLink>
        ))}
      </nav>

      {/* Profile Footer Card */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#0b1120]">
        <div className="flex items-center justify-between bg-[#1e293b] border border-slate-700/60 rounded-xl p-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm shadow-blue-600/30">
              {initial}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-white text-sm font-bold truncate leading-snug">{displayName}</p>
                <p className="text-slate-400 text-xs font-medium">{displayRole}</p>
              </div>
            )}
          </div>
          <button
            type="button"
            id="btn-sidebar-collapse"
            name="btnSidebarCollapse"
            onClick={handleToggle}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors ml-1 flex-shrink-0"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
