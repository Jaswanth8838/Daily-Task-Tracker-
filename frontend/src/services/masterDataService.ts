import api from './api'

export const masterDataService = {
  // Trainers
  async getTrainers() {
    const res = await api.get('/trainers')
    return res.data
  },
  async createTrainer(data: any) {
    const res = await api.post('/trainers', data)
    return res.data
  },
  async updateTrainer(trainerId: number, data: any) {
    const res = await api.put(`/trainers/${trainerId}`, data)
    return res.data
  },
  async deleteTrainer(trainerId: number) {
    const res = await api.delete(`/trainers/${trainerId}`)
    return res.data
  },

  // Technologies
  async getTechnologies() {
    const res = await api.get('/technologies')
    return res.data
  },
  async createTechnology(data: any) {
    const res = await api.post('/technologies', data)
    return res.data
  },
  async updateTechnology(techId: number, data: any) {
    const res = await api.put(`/technologies/${techId}`, data)
    return res.data
  },
  async deleteTechnology(techId: number) {
    const res = await api.delete(`/technologies/${techId}`)
    return res.data
  },

  // Concepts
  async getConcepts(technologyId?: number) {
    const params = technologyId ? { technology_id: technologyId } : undefined
    const res = await api.get('/concepts', { params })
    return res.data
  },
  async createConcept(data: any) {
    const res = await api.post('/concepts', data)
    return res.data
  },
  async updateConcept(conceptId: number, data: any) {
    const res = await api.put(`/concepts/${conceptId}`, data)
    return res.data
  },
  async deleteConcept(conceptId: number) {
    const res = await api.delete(`/concepts/${conceptId}`)
    return res.data
  }
}
