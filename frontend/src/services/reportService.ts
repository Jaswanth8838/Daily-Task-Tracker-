import api from './api'

export const reportService = {
  async getReportsSummary() {
    const res = await api.get('/reports/summary')
    return res.data
  },
  async getEmployeeReports(params?: any) {
    const res = await api.get('/admin/reports', { params })
    return res.data
  },
  async updateEmployeeReport(reportId: number, data: any) {
    const res = await api.put(`/admin/reports/${reportId}`, data)
    return res.data
  },
  async freezeEmployeeReport(reportId: number) {
    const res = await api.put(`/admin/reports/${reportId}/freeze`)
    return res.data
  },
  async unfreezeEmployeeReport(reportId: number) {
    const res = await api.put(`/admin/reports/${reportId}/unfreeze`)
    return res.data
  },
  async getInternReports(params?: any) {
    const res = await api.get('/admin/intern-reports', { params })
    return res.data
  },
  async freezeInternReport(reportId: number) {
    const res = await api.put(`/admin/intern-reports/${reportId}/freeze`)
    return res.data
  },
  async unfreezeInternReport(reportId: number) {
    const res = await api.put(`/admin/intern-reports/${reportId}/unfreeze`)
    return res.data
  },
  async getActivityLogs(params?: any) {
    const res = await api.get('/admin/activity-logs', { params })
    return res.data
  },
  async exportReportsCsvUrl() {
    // Return relative URL for direct download or fetch via Axios
    return '/reports/export'
  },
  async getHRInterns(search?: string) {
    const res = await api.get('/hr/interns', { params: { q: search } })
    return res.data
  },
  async getInternPerformance(internId: number, params?: any) {
    const res = await api.get(`/hr/interns/${internId}/performance`, { params })
    return res.data
  },
  async getInternLanguageReports() {
    const res = await api.get('/intern/reports/languages')
    return res.data
  }
}
