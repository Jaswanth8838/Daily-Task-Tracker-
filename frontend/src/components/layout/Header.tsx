import React, { useEffect, useState, useRef } from 'react'
import { Bell, ChevronDown, CheckCheck, Clock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import api from '../../lib/api'

interface HeaderProps {
  title: string
  sidebarWidth?: number
}

interface NotificationItem {
  id: number
  title: string
  message: string
  is_read: boolean
  created_at: string
}

const Header: React.FC<HeaderProps> = ({ title, sidebarWidth = 220 }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch (err) {
      console.error('Failed to fetch notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read')
      fetchNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  const markOneRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`)
      fetchNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <header
      className="fixed top-0 right-0 z-20 flex items-center justify-between bg-white border-b border-slate-200 px-6"
      style={{ left: sidebarWidth, height: 56, transition: 'left 0.3s' }}
    >
      <h1 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="relative text-slate-500 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-50"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2.5 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">Notifications ({unreadCount} unread)</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5"
                  >
                    <CheckCheck size={12} /> Mark all read
                  </button>
                )}
              </div>
              <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    onClick={() => {
                      if (!n.is_read) markOneRead(n.id)
                    }}
                    className={`p-3.5 hover:bg-slate-50/70 transition-colors cursor-pointer text-xs ${
                      !n.is_read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <p className={`font-bold ${!n.is_read ? 'text-blue-800' : 'text-slate-700'}`}>
                        {n.title}
                      </p>
                      {!n.is_read && <span className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0 mt-1" />}
                    </div>
                    <p className="text-slate-500 mt-1 leading-normal text-[11px]">{n.message}</p>
                    <span className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No notifications yet
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile info */}
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-blue-500/20">
            {user?.name?.charAt(0) ?? 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-slate-800 leading-none">{user?.name ?? ''}</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{user?.role ?? ''}</p>
          </div>
          <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>
      </div>
    </header>
  )
}

export default Header
