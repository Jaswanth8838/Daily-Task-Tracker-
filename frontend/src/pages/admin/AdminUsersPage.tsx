import React, { useEffect, useState, useCallback } from 'react'
import { Search, Filter, CheckCircle2, XCircle, ChevronDown, User, Eye, X, Lock } from 'lucide-react'
import api from '../../lib/api'

interface UserItem {
  id: number
  name: string
  email: string
  role: string
  status: string
  department: string | null
  created_at: string
}

const ROLE_COLORS: Record<string, string> = {
  hr: 'bg-purple-100 text-purple-700',
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-amber-100 text-amber-700',
  employee: 'bg-amber-100 text-amber-700',
  intern: 'bg-blue-100 text-blue-700',
}

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [drawerLoading, setDrawerLoading] = useState(false)
  const [updating, setUpdating] = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), per_page: '20' })
      if (search) params.set('search', search)
      if (roleFilter) params.set('role', roleFilter)
      if (statusFilter) params.set('status', statusFilter)
      const res = await api.get(`/admin/users?${params}`)
      setUsers(res.data.users)
      setTotal(res.data.total)
      setPages(res.data.pages)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search, roleFilter, statusFilter, page])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const openUserDrawer = async (userId: number) => {
    setDrawerLoading(true)
    setSelectedUser({ id: userId })
    try {
      const res = await api.get(`/admin/users/${userId}`)
      setSelectedUser(res.data)
    } catch (e) { console.error(e) }
    finally { setDrawerLoading(false) }
  }

  const toggleStatus = async (userId: number, currentStatus: string) => {
    setUpdating(true)
    try {
      await api.put(`/admin/users/${userId}`, { status: currentStatus === 'active' ? 'inactive' : 'active' })
      fetchUsers()
      if (selectedUser?.user?.id === userId) {
        const res = await api.get(`/admin/users/${userId}`)
        setSelectedUser(res.data)
      }
    } catch (e) { console.error(e) }
    finally { setUpdating(false) }
  }

  const changeRole = async (userId: number, newRole: string) => {
    setUpdating(true)
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole })
      fetchUsers()
    } catch (e) { console.error(e) }
    finally { setUpdating(false) }
  }

  return (
    <div className="space-y-5 relative">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">User Management</h2>
          <p className="text-xs text-slate-500">{total} total users</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search name or email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500">
          <option value="">All Roles</option>
          <option value="intern">Intern</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="hr">HR / Admin</option>
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-10"><span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Department</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{u.name}</td>
                    <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{u.department || '-'}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button onClick={() => toggleStatus(u.id, u.status)} title="Toggle status">
                        {u.status === 'active'
                          ? <CheckCircle2 size={17} className="text-emerald-500 hover:text-red-500 transition-colors mx-auto" />
                          : <XCircle size={17} className="text-slate-300 hover:text-emerald-500 transition-colors mx-auto" />}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button onClick={() => openUserDrawer(u.id)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold mx-auto">
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400 text-xs">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {/* Pagination */}
        {pages > 1 && (
          <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Page {page} of {pages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">← Prev</button>
              <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50">Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex justify-end" onClick={() => setSelectedUser(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">User Profile</h3>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {drawerLoading ? (
              <div className="flex justify-center p-10"><span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
            ) : selectedUser.user ? (
              <div className="p-5 space-y-5">
                {/* Profile Info */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {selectedUser.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{selectedUser.user.name}</p>
                      <p className="text-xs text-slate-500">{selectedUser.user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-slate-400">Role:</span>
                      <select className="ml-2 border border-slate-300 rounded px-1.5 py-0.5 text-xs bg-white"
                        defaultValue={selectedUser.user.role}
                        onChange={e => changeRole(selectedUser.user.id, e.target.value)}>
                        <option value="intern">Intern</option>
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="hr">HR Admin</option>
                      </select>
                    </div>
                    <div><span className="text-slate-400">Status:</span> <strong className={selectedUser.user.status === 'active' ? 'text-emerald-600' : 'text-red-500'}>{selectedUser.user.status}</strong></div>
                    <div><span className="text-slate-400">Dept:</span> <strong>{selectedUser.user.department || '-'}</strong></div>
                    <div><span className="text-slate-400">Joined:</span> <strong>{new Date(selectedUser.user.created_at).toLocaleDateString()}</strong></div>
                  </div>
                </div>

                {/* Employee Reports */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Recent Employee Reports</h4>
                  {selectedUser.employee_reports?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.employee_reports.map((r: any) => (
                        <div key={r.id} className="bg-slate-50 rounded-lg border border-slate-100 px-3 py-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">{r.date}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              r.daily_status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              r.daily_status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              r.daily_status === 'blocked' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                            }`}>{r.daily_status.replace('_',' ')}</span>
                            <span className="text-xs text-slate-500">{r.overall_progress}%</span>
                            {r.is_frozen && <Lock size={11} className="text-amber-600" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-400">No employee reports yet</p>}
                </div>

                {/* Intern Reports */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2">Recent Intern Reports</h4>
                  {selectedUser.intern_reports?.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUser.intern_reports.map((r: any) => (
                        <div key={r.id} className="bg-slate-50 rounded-lg border border-slate-100 px-3 py-2 flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-700">{r.date}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              r.overall_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>{r.overall_status?.replace('_',' ')}</span>
                            {r.is_frozen && <Lock size={11} className="text-amber-600" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-400">No intern reports yet</p>}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsersPage
