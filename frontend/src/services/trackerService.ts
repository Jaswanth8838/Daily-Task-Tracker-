import api from './api'

export const trackerService = {
  // Intern tracker access & daily states
  async getTodayState() {
    const res = await api.get('/tracker/today')
    return res.data
  },
  async getInternDashboard() {
    const res = await api.get('/intern/dashboard')
    return res.data
  },
  async createDailyUpdate(updateData: any) {
    const res = await api.post('/tracker/update', updateData)
    return res.data
  },
  async saveDailyTrackerDraft(data: { date?: string; sessions: any[] }) {
    const res = await api.post('/tracker/save', data)
    return res.data
  },
  async submitDailyTracker(data?: { date?: string; sessions?: any[] }) {
    const res = await api.post('/tracker/submit', data || {})
    return res.data
  },
  async deleteTrackerSession(sessionId: number) {
    const res = await api.delete(`/tracker/session/${sessionId}`)
    return res.data
  },
  async getMyUpdates() {
    const res = await api.get('/tracker/my-updates')
    return res.data
  },
  async getTeamUpdates(params?: any) {
    const res = await api.get('/tracker/team-updates', { params })
    return res.data
  },
  async toggleLockUpdate(updateId: number, status?: string) {
    const res = await api.put(`/tracker/update/${updateId}/lock`, { status })
    return res.data
  },
  async getRecentUpdates() {
    const res = await api.get('/tracker/recent')
    return res.data
  },

  // Admin access overrides
  async getTrackerAccessList() {
    const res = await api.get('/admin/tracker-access')
    return res.data
  },
  async grantTrackerAccess(internId: number, reason: string) {
    const res = await api.post(`/admin/tracker-access/${internId}/grant`, { reason })
    return res.data
  },
  async revokeTrackerAccess(internId: number, reason: string) {
    const res = await api.post(`/admin/tracker-access/${internId}/revoke`, { reason })
    return res.data
  },
  async reopenTracker(trackerId: number, reason: string) {
    const res = await api.post(`/admin/trackers/${trackerId}/reopen`, { reason })
    return res.data
  },

  // Sessions and meetings scheduling
  async getSessions() {
    const res = await api.get('/tracker/sessions')
    return res.data
  },
  async createSession(sessionData: any) {
    const res = await api.post('/tracker/sessions', sessionData)
    return res.data
  },
  async updateSession(sessionId: number, sessionData: any) {
    const res = await api.put(`/tracker/sessions/${sessionId}`, sessionData)
    return res.data
  },
  async getMeetings() {
    const res = await api.get('/tracker/meetings')
    return res.data
  },
  async createMeeting(meetingData: any) {
    const res = await api.post('/tracker/meetings', meetingData)
    return res.data
  },
  async updateMeeting(meetingId: number, meetingData: any) {
    const res = await api.put(`/tracker/meetings/${meetingId}`, meetingData)
    return res.data
  }
}
