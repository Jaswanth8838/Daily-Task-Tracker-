import React, { useEffect, useState } from 'react'
import { Plus, Edit2, CheckCircle2, XCircle } from 'lucide-react'
import api from '../lib/api'

interface Trainer {
  id: number
  name: string
  email: string | null
  specialization: string | null
  status: string
}

interface Technology {
  id: number
  name: string
  status: string
}

interface Concept {
  id: number
  technology_id: number
  concept: string
  status: string
}

type Tab = 'trainers' | 'technologies' | 'concepts'

const MasterDataPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('trainers')
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [concepts, setConcepts] = useState<Concept[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [trainerForm, setTrainerForm] = useState({ name: '', email: '', specialization: '' })
  const [techForm, setTechForm] = useState({ name: '' })
  const [conceptForm, setConceptForm] = useState({ technology_id: '', concept: '' })

  const fetchData = async () => {
    setLoading(true)
    try {
      const [trRes, tcRes, coRes] = await Promise.all([
        api.get('/trainers'),
        api.get('/technologies'),
        api.get('/concepts')
      ])
      setTrainers(trRes.data)
      setTechnologies(tcRes.data)
      setConcepts(coRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trainerForm.name) return
    try {
      await api.post('/trainers', trainerForm)
      setTrainerForm({ name: '', email: '', specialization: '' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddTech = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!techForm.name) return
    try {
      await api.post('/technologies', techForm)
      setTechForm({ name: '' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddConcept = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!conceptForm.concept || !conceptForm.technology_id) return
    try {
      await api.post('/concepts', conceptForm)
      setConceptForm({ technology_id: '', concept: '' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const toggleStatus = async (type: Tab, id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      if (type === 'trainers') await api.put(`/trainers/${id}`, { status: newStatus })
      if (type === 'technologies') await api.put(`/technologies/${id}`, { status: newStatus })
      if (type === 'concepts') await api.put(`/concepts/${id}`, { status: newStatus })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200">
        {(['trainers', 'technologies', 'concepts'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><span className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-20">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Plus size={16} className="text-blue-600" />
                Add New {activeTab === 'trainers' ? 'Trainer' : activeTab === 'technologies' ? 'Technology' : 'Concept'}
              </h3>

              {activeTab === 'trainers' && (
                <form onSubmit={handleAddTrainer} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Name *</label>
                    <input type="text" value={trainerForm.name} onChange={e => setTrainerForm({ ...trainerForm, name: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" value={trainerForm.email} onChange={e => setTrainerForm({ ...trainerForm, email: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Specialization</label>
                    <input type="text" value={trainerForm.specialization} onChange={e => setTrainerForm({ ...trainerForm, specialization: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors">Save Trainer</button>
                </form>
              )}

              {activeTab === 'technologies' && (
                <form onSubmit={handleAddTech} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Technology Name *</label>
                    <input type="text" value={techForm.name} onChange={e => setTechForm({ name: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors">Save Technology</button>
                </form>
              )}

              {activeTab === 'concepts' && (
                <form onSubmit={handleAddConcept} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Technology *</label>
                    <select value={conceptForm.technology_id} onChange={e => setConceptForm({ ...conceptForm, technology_id: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white" required>
                      <option value="">Select Technology...</option>
                      {technologies.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Concept Name *</label>
                    <input type="text" value={conceptForm.concept} onChange={e => setConceptForm({ ...conceptForm, concept: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 transition-colors">Save Concept</button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {activeTab === 'trainers' && (
                      <>
                        <th className="text-left font-medium text-slate-600 px-5 py-3">Name</th>
                        <th className="text-left font-medium text-slate-600 px-5 py-3">Email</th>
                        <th className="text-left font-medium text-slate-600 px-5 py-3">Specialization</th>
                      </>
                    )}
                    {activeTab === 'technologies' && (
                      <th className="text-left font-medium text-slate-600 px-5 py-3">Technology Name</th>
                    )}
                    {activeTab === 'concepts' && (
                      <>
                        <th className="text-left font-medium text-slate-600 px-5 py-3">Concept</th>
                        <th className="text-left font-medium text-slate-600 px-5 py-3">Technology</th>
                      </>
                    )}
                    <th className="text-center font-medium text-slate-600 px-5 py-3 w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeTab === 'trainers' && trainers.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{t.name}</td>
                      <td className="px-5 py-3 text-slate-600">{t.email || '-'}</td>
                      <td className="px-5 py-3 text-slate-600">{t.specialization || '-'}</td>
                      <td className="px-5 py-3 text-center">
                        <button onClick={() => toggleStatus('trainers', t.id, t.status)} className="transition-colors">
                          {t.status === 'active' ? <CheckCircle2 size={18} className="text-green-500 hover:text-red-500" /> : <XCircle size={18} className="text-slate-300 hover:text-green-500" />}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'technologies' && technologies.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{t.name}</td>
                      <td className="px-5 py-3 text-center">
                        <button onClick={() => toggleStatus('technologies', t.id, t.status)} className="transition-colors">
                          {t.status === 'active' ? <CheckCircle2 size={18} className="text-green-500 hover:text-red-500" /> : <XCircle size={18} className="text-slate-300 hover:text-green-500" />}
                        </button>
                      </td>
                    </tr>
                  ))}

                  {activeTab === 'concepts' && concepts.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium text-slate-800">{c.concept}</td>
                      <td className="px-5 py-3 text-slate-600">
                        {technologies.find(t => t.id === c.technology_id)?.name || 'Unknown'}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button onClick={() => toggleStatus('concepts', c.id, c.status)} className="transition-colors">
                          {c.status === 'active' ? <CheckCircle2 size={18} className="text-green-500 hover:text-red-500" /> : <XCircle size={18} className="text-slate-300 hover:text-green-500" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  {((activeTab === 'trainers' && trainers.length === 0) ||
                    (activeTab === 'technologies' && technologies.length === 0) ||
                    (activeTab === 'concepts' && concepts.length === 0)) && (
                    <tr>
                      <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                        No {activeTab} found. Add one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MasterDataPage
