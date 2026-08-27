import api from './api'

export const userService = {
  // HR/Admin User Management APIs
  async getAdminUsers(params?: any) {
    const res = await api.get('/admin/users', { params })
    return res.data
  },
  async getAdminUserDetail(userId: number) {
    const res = await api.get(`/admin/users/${userId}`)
    return res.data
  },
  async updateAdminUser(userId: number, userData: any) {
    const res = await api.put(`/admin/users/${userId}`, userData)
    return res.data
  },

  // General Users APIs (from users blueprint)
  async getUsers(role?: string) {
    const res = await api.get('/users', { params: { role } })
    return res.data
  },
  async createUser(userData: any) {
    const res = await api.post('/users', userData)
    return res.data
  },
  async updateUser(userId: number, userData: any) {
    const res = await api.put(`/users/${userId}`, userData)
    return res.data
  },
  async getInterns() {
    const res = await api.get('/interns')
    return res.data
  },
  async updateIntern(internId: number, internData: any) {
    const res = await api.put(`/interns/${internId}`, internData)
    return res.data
  }
}
