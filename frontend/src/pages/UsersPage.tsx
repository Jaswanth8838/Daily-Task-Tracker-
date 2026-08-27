import React, { useEffect, useState } from 'react'
import { Plus, CheckCircle2, XCircle, Users as UsersIcon, UserPlus, AlertCircle } from 'lucide-react'
import api from '../lib/api'

interface User {
  id: number
  name: string
  email: string
  employee_id: string
  role: string
  status: string
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form state
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    employee_id: '',
    role: 'intern',
    password: ''
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const uRes = await api.get('/users')
      setUsers(uRes.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    try {
      await api.post('/users', userForm)
      setSuccessMsg(`User ${userForm.name} (${userForm.employee_id}) created successfully!`)
      setUserForm({ name: '', email: '', employee_id: '', role: 'intern', password: '' })
      fetchData()
    } catch (err: any) {
      const errDetail = err.response?.data?.error || 'Failed to create user.'
      setErrorMsg(errDetail)
    }
  }

  const toggleUserStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await api.put(`/users/${id}`, { status: newStatus })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <UserPlus className="text-blue-600 dark:text-blue-400" size={24} />
            User Management &amp; Provisioning
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Create and manage application accounts (Interns and HR admins) with mandatory unique Employee IDs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-3.5 py-2 rounded-xl font-bold border border-slate-200 dark:border-slate-700">
            Total Accounts: <strong className="text-blue-600 dark:text-blue-400">{users.length}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add User Form */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-6 sticky top-20">
            <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-600 dark:text-blue-400" />
              Add New User / Intern
            </h2>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle size={15} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 size={15} className="flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label htmlFor="user-full-name" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="user-full-name"
                  name="userFullName"
                  type="text"
                  value={userForm.name}
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="e.g. Suma Tirunamala"
                  className="w-full h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label htmlFor="user-employee-id" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <input
                  id="user-employee-id"
                  name="userEmployeeId"
                  type="text"
                  value={userForm.employee_id}
                  onChange={e => setUserForm({ ...userForm, employee_id: e.target.value })}
                  placeholder="e.g. INT-2026-001 or HR-WS-001"
                  className="w-full h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label htmlFor="user-email-addr" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="user-email-addr"
                  name="userEmailAddr"
                  type="email"
                  value={userForm.email}
                  onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="e.g. intern@wscs.ai"
                  className="w-full h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  required
                />
              </div>

              <div>
                <label htmlFor="user-role-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Application Role <span className="text-red-500">*</span>
                </label>
                <select
                  id="user-role-select"
                  name="userRoleSelect"
                  value={userForm.role}
                  onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                  className="w-full h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  required
                >
                  <option value="intern">Intern</option>
                  <option value="hr">HR Administrator</option>
                </select>
              </div>

              <div>
                <label htmlFor="user-password-input" className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Initial Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="user-password-input"
                  name="userPasswordInput"
                  type="password"
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                id="btn-submit-create-user"
                name="btnSubmitCreateUser"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shadow-blue-600/30 mt-2"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            {loading ? (
              <div className="py-20 text-center">
                <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading accounts…</p>
              </div>
            ) : users.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No users found</p>
                <p className="text-xs text-slate-400 mt-1">Create your first account using the form on the left.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="px-6 py-4">Name</th>
                      <th className="px-4 py-4">Employee ID</th>
                      <th className="px-4 py-4">Email</th>
                      <th className="px-4 py-4">Role</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-sm">{u.name}</td>
                        <td className="px-4 py-4 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">{u.employee_id || `EMP-${String(u.id).padStart(4, '0')}`}</td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300 font-medium">{u.email}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider border ${
                            u.role === 'hr'
                              ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900/60'
                              : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleUserStatus(u.id, u.status)}
                            className="transition-colors"
                            title={u.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                          >
                            {u.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                                <CheckCircle2 size={18} />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500 font-bold">
                                <XCircle size={18} />
                                Inactive
                              </span>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UsersPage
