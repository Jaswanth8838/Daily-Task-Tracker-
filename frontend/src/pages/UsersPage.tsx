import React, { useEffect, useState } from 'react'
import { Plus, CheckCircle2, XCircle, Users as UsersIcon, UserPlus } from 'lucide-react'
import api from '../lib/api'

interface User {
  id: number
  name: string
  email: string
  role: string
  status: string
}

interface InternProfile {
  id: number
  user_id: number
  manager_id: number | null
  employee_id: string | null
  department: string | null
  joining_date: string | null
  user: User
  manager: User | null
}

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [interns, setInterns] = useState<InternProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'users' | 'intern_mapping'>('users')

  // Form states
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'intern', password: '' })
  
  const fetchData = async () => {
    setLoading(true)
    try {
      const [uRes, iRes] = await Promise.all([
        api.get('/users'),
        api.get('/interns')
      ])
      setUsers(uRes.data)
      setInterns(iRes.data)
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
    try {
      await api.post('/users', userForm)
      setUserForm({ name: '', email: '', role: 'intern', password: '' })
      fetchData()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error creating user')
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

  const assignManager = async (internId: number, managerId: string) => {
    try {
      await api.put(`/interns/${internId}`, { manager_id: managerId ? parseInt(managerId) : null })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const managers = users.filter(u => u.role === 'manager' && u.status === 'active')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('users')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
            <div className="flex items-center gap-2"><UserPlus size={16} /> User Management</div>
          </button>
          <button onClick={() => setView('intern_mapping')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view === 'intern_mapping' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}>
            <div className="flex items-center gap-2"><UsersIcon size={16} /> Intern Assignments</div>
          </button>
        </div>
      </div>

      {loading ? (
         <div className="flex justify-center p-10"><span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span></div>
      ) : view === 'users' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add User Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-20">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Plus size={16} className="text-blue-600" /> Add New User
              </h3>
              <form onSubmit={handleAddUser} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Name *</label>
                  <input type="text" value={userForm.name} onChange={e => setUserForm({...userForm, name: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email *</label>
                  <input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role *</label>
                  <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 bg-white" required>
                    <option value="intern">Intern</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Temporary Password *</label>
                  <input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" required minLength={8}/>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors mt-2">Create User</button>
              </form>
            </div>
          </div>
          
          {/* Users List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left font-medium text-slate-600 px-5 py-3">Name</th>
                    <th className="text-left font-medium text-slate-600 px-5 py-3">Email</th>
                    <th className="text-left font-medium text-slate-600 px-5 py-3">Role</th>
                    <th className="text-center font-medium text-slate-600 px-5 py-3 w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{u.name}</td>
                      <td className="px-5 py-3 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'hr' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'manager' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                         <button onClick={() => toggleUserStatus(u.id, u.status)} className="transition-colors">
                          {u.status === 'active' ? <CheckCircle2 size={18} className="text-green-500 hover:text-red-500" /> : <XCircle size={18} className="text-slate-300 hover:text-green-500" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
           <h3 className="text-sm font-semibold text-slate-800 mb-4">Assign Interns to Managers</h3>
           <div className="overflow-x-auto">
             <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left font-medium text-slate-600 px-5 py-3">Intern Name</th>
                    <th className="text-left font-medium text-slate-600 px-5 py-3">Email</th>
                    <th className="text-left font-medium text-slate-600 px-5 py-3">Assigned Manager</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interns.map(intern => (
                    <tr key={intern.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{intern.user.name}</td>
                      <td className="px-5 py-3 text-slate-600">{intern.user.email}</td>
                      <td className="px-5 py-3">
                        <select 
                          value={intern.manager_id || ''} 
                          onChange={(e) => assignManager(intern.id, e.target.value)}
                          className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Unassigned</option>
                          {managers.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {interns.length === 0 && (
                     <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400">No interns found.</td></tr>
                  )}
                </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
