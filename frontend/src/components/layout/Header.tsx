import React, { useEffect, useState, useRef } from 'react'
import { Bell, ChevronDown, Menu, LogOut, User as UserIcon, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useNavigate } from 'react-router-dom'
import api from '../../lib/api'

interface HeaderProps {
  title?: string
  sidebarWidth?: number
  sidebarCollapsed?: boolean
  onToggleSidebar?: () => void
}

const Header: React.FC<HeaderProps> = ({
  title = 'Daily Task Tracker',
  sidebarWidth = 240,
  sidebarCollapsed = false,
  onToggleSidebar
}) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const [notifications, setNotifications] = useState<any[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const displayName = user?.name || 'Anjali HR'
  const displayRole = (user?.role || 'HR').toUpperCase()
  const initial = displayName.charAt(0).toUpperCase()

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      if (Array.isArray(res.data)) {
        setNotifications(res.data)
      }
    } catch (err) {
      console.error('Failed to load notifications', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (err) {
      console.error('Failed to mark notifications as read', err)
    }
  }

  const handleMarkOneRead = async (notification: any) => {
    try {
      if (!notification.is_read) {
        await api.post(`/notifications/${notification.id}/read`)
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
        )
      }
      setDropdownOpen(false)
      if (user?.role === 'hr' || user?.role === 'admin') {
        if (notification.title?.includes('Task Not Submitted') || notification.title?.includes('Tracker')) {
          navigate('/admin/tracker-access')
        }
      } else if (user?.role === 'intern') {
        navigate('/dashboard')
      }
    } catch (err) {
      console.error('Failed to mark notification as read', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-8 transition-colors"
      style={{ left: sidebarWidth, height: 64, transition: 'left 0.2s, background-color 0.2s' }}
    >
      {/* Left Title with Hamburger Icon */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          id="btn-toggle-nav"
          name="btnToggleNav"
          onClick={onToggleSidebar}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95"
          title={sidebarCollapsed ? "Expand Navigation Sidebar" : "Collapse Navigation Sidebar"}
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
          Daily Task Tracker
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Theme Toggle Button */}
        <button
          type="button"
          id="btn-theme-toggle"
          name="btnThemeToggle"
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <>
              <Sun size={18} className="text-amber-400" />
              <span className="hidden sm:inline">Light</span>
            </>
          ) : (
            <>
              <Moon size={18} className="text-slate-600" />
              <span className="hidden sm:inline">Dark</span>
            </>
          )}
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            id="btn-notifications"
            name="btnNotifications"
            onClick={() => {
              setDropdownOpen(!dropdownOpen)
              fetchNotifications()
            }}
            className="relative text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-84 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 z-50 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800 dark:text-white">Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 text-center">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkOneRead(n)}
                      className={`p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-xs cursor-pointer ${
                        !n.is_read ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{n.title}</p>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 text-xs mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            id="btn-user-profile"
            name="btnUserProfile"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity"
          >
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-blue-500/20">
              {initial}
            </div>
            <div className="hidden sm:block text-left leading-tight">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{displayName}</p>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">{displayRole}</p>
            </div>
            <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2.5 w-48 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 py-2 z-50 text-sm">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email || ''}</p>
              </div>
              <button
                type="button"
                id="btn-sign-out"
                name="btnSignOut"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-left font-semibold transition-colors"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
