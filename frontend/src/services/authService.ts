import api from './api'

export const authService = {
  async login(credentials: any) {
    const res = await api.post('/auth/login', credentials)
    return res.data
  },
  async signup(data: any) {
    const res = await api.post('/auth/signup', data)
    return res.data
  },
  async getMe() {
    const res = await api.get('/auth/me')
    return res.data
  },
  async updateProfile(data: any) {
    const res = await api.put('/auth/profile', data)
    return res.data
  }
}
