import React, { useEffect, useState, useRef } from 'react'
import { Bell, ChevronDown, Menu, LogOut, User as UserIcon, Sun, Moon, CheckCheck, BellOff, ExternalLink } from 'lucide-react'
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

interface NotificationItem {
  id: number
  user_id: number | null
  title: string
  message: string
  is_read: boolean
  created_at: string | null
}

const formatNotifTime = (isoString?: string | null) => {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`

    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  } catch {
    return ''
  }
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

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const displayName = user?.name || 'HR Administrator'
  const displayRole = (user?.role || 'HR').toUpperCase()
  const initial = displayName.charAt(0).toUpperCase()

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      const notifArray = Array.isArray(res.data) ? res.data : (res.data?.data || [])
      setNotifications(notifArray)
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

  const handleMarkOneRead = async (notification: NotificationItem) => {
    try {
      if (!notification.is_read) {
        await api.post(`/notifications/${notification.id}/read`)
        setNotifications(prev =>
          prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
        )
      }
      setDropdownOpen(false)
      if (user?.role === 'hr' || user?.role === 'admin') {
        if (notification.title?.includes('Not Submitted') || notification.title?.includes('Tracker')) {
          navigate('/admin/tracker-access')
        }
      } else if (user?.role === 'intern') {
        navigate('/')
      }
    } catch (err) {
      console.error('Failed to mark single notification as read', err)
    }
  }

  // Initial fetch and 15s polling
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)
  }, [])

  // Close dropdowns on outside click
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

        {/* Polished Notification Bell & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            id="btn-notifications"
            name="btnNotifications"
            onClick={() => {
              setDropdownOpen(!dropdownOpen)
              if (!dropdownOpen) fetchNotifications()
            }}
            className="relative text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center rounded-full shadow-xs ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {/* Polished Notification Panel */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-84 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/90 dark:border-slate-800 z-50 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800 dark:text-white">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 hover:underline"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
              </div>

              {/* List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-10 px-4 text-center">
                    <BellOff size={28} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No notifications yet</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">System updates will appear here</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleMarkOneRead(n)}
                      className={`p-4 transition-colors cursor-pointer relative group ${
                        !n.is_read
                          ? 'bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 opacity-80 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          {!n.is_read ? (
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-0.5" />
                          ) : (
                            <CheckCheck size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          )}
                          <p className={`text-xs font-bold ${!n.is_read ? 'text-slate-900 dark:text-white font-extrabold' : 'text-slate-700 dark:text-slate-300'}`}>
                            {n.title}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {formatNotifTime(n.created_at)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed pl-4">
                        {n.message}
                      </p>
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
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shadow-blue-600/30 group-hover:scale-105 transition-transform">
              {initial}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                {displayName}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                {displayRole}
              </div>
            </div>
            <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
          </button>

          {/* Profile Dropdown Menu */}
          {profileMenuOpen && (
            <div className="absolute right-0 mt-2.5 w-52 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 z-50 overflow-hidden py-1.5">
              <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="text-xs font-bold text-slate-800 dark:text-white">{displayName}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">{user?.email}</p>
              </div>

              <button
                type="button"
                id="btn-logout"
                name="btnLogout"
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 transition-colors cursor-pointer"
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
