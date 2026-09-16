import React, { useEffect, useState } from 'react'
import { Plus, Edit2, CheckCircle2, XCircle, Database, Layers, BookOpen, UserCheck, RefreshCw } from 'lucide-react'
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
  const [refreshing, setRefreshing] = useState(false)

  // Form states
  const [trainerForm, setTrainerForm] = useState({ name: '', email: '', specialization: '' })
  const [techForm, setTechForm] = useState({ name: '' })
  const [conceptForm, setConceptForm] = useState({ technology_id: '', concept: '' })

  const fetchData = async () => {
    try {
      const [trRes, tcRes, coRes] = await Promise.all([
        api.get('/trainers'),
        api.get('/technologies'),
        api.get('/concepts')
      ])
      const trData = trRes.data?.data || trRes.data
      const tcData = tcRes.data?.data || tcRes.data
      const coData = coRes.data?.data || coRes.data
      setTrainers(Array.isArray(trData) ? trData : [])
      setTechnologies(Array.isArray(tcData) ? tcData : [])
      setConcepts(Array.isArray(coData) ? coData : [])
    } catch (err) {
      console.error('Failed to load master data', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

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
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight flex items-center gap-2.5">
            <Database className="text-blue-600 dark:text-blue-400" size={24} />
            Master Data Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure system-wide master catalogs including assigned trainers, training technologies, and syllabus concepts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Refresh Master Data"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('trainers')}
          className={`px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'trainers'
              ? 'bg-white dark:bg-slate-900 border border-b-0 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <UserCheck size={16} />
          Trainers ({trainers.length})
        </button>
        <button
          onClick={() => setActiveTab('technologies')}
          className={`px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'technologies'
              ? 'bg-white dark:bg-slate-900 border border-b-0 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Layers size={16} />
          Technologies ({technologies.length})
        </button>
        <button
          onClick={() => setActiveTab('concepts')}
          className={`px-4 py-2.5 text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'concepts'
              ? 'bg-white dark:bg-slate-900 border border-b-0 border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <BookOpen size={16} />
          Concepts ({concepts.length})
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading master records…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Form */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-6 sticky top-24">
              <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Plus size={18} className="text-blue-600 dark:text-blue-400" />
                Add New {activeTab === 'trainers' ? 'Trainer' : activeTab === 'technologies' ? 'Technology' : 'Concept'}
              </h2>

              {activeTab === 'trainers' && (
                <form onSubmit={handleAddTrainer} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Trainer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={trainerForm.name}
                      onChange={e => setTrainerForm({ ...trainerForm, name: e.target.value })}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={trainerForm.email}
                      onChange={e => setTrainerForm({ ...trainerForm, email: e.target.value })}
                      placeholder="e.g. trainer@wscs.ai"
                      className="w-full h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Specialization Domain
                    </label>
                    <input
                      type="text"
                      value={trainerForm.specialization}
                      onChange={e => setTrainerForm({ ...trainerForm, specialization: e.target.value })}
                      placeholder="e.g. Python / Cloud / DevOps"
                      className="w-full h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shadow-blue-600/30 mt-2 cursor-pointer"
                  >
                    Save Trainer
                  </button>
                </form>
              )}

              {activeTab === 'technologies' && (
                <form onSubmit={handleAddTech} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Technology Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={techForm.name}
                      onChange={e => setTechForm({ name: e.target.value })}
                      placeholder="e.g. React / TypeScript / PostgreSQL"
                      className="w-full h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shadow-blue-600/30 mt-2 cursor-pointer"
                  >
                    Save Technology
                  </button>
                </form>
              )}

              {activeTab === 'concepts' && (
                <form onSubmit={handleAddConcept} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Parent Technology <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={conceptForm.technology_id}
                      onChange={e => setConceptForm({ ...conceptForm, technology_id: e.target.value })}
                      className="w-full h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      required
                    >
                      <option value="">Select Technology…</option>
                      {technologies.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Concept Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={conceptForm.concept}
                      onChange={e => setConceptForm({ ...conceptForm, concept: e.target.value })}
                      placeholder="e.g. Async / Await and Event Loop"
                      className="w-full h-11 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs shadow-blue-600/30 mt-2 cursor-pointer"
                  >
                    Save Concept
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: List */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                      {activeTab === 'trainers' && (
                        <>
                          <th className="px-6 py-4">Name</th>
                          <th className="px-4 py-4">Email</th>
                          <th className="px-4 py-4">Specialization</th>
                        </>
                      )}
                      {activeTab === 'technologies' && (
                        <th className="px-6 py-4">Technology Name</th>
                      )}
                      {activeTab === 'concepts' && (
                        <>
                          <th className="px-6 py-4">Concept</th>
                          <th className="px-4 py-4">Technology</th>
                        </>
                      )}
                      <th className="px-6 py-4 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {activeTab === 'trainers' && trainers.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-sm">{t.name}</td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300 font-medium">{t.email || '—'}</td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300 font-medium">{t.specialization || '—'}</td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleStatus('trainers', t.id, t.status)}
                            className="transition-colors cursor-pointer"
                            title={t.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {t.status === 'active' ? (
                              <CheckCircle2 size={18} className="text-emerald-500 hover:text-red-500 transition-colors" />
                            ) : (
                              <XCircle size={18} className="text-slate-300 dark:text-slate-600 hover:text-emerald-500 transition-colors" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'technologies' && technologies.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-sm">{t.name}</td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleStatus('technologies', t.id, t.status)}
                            className="transition-colors cursor-pointer"
                            title={t.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {t.status === 'active' ? (
                              <CheckCircle2 size={18} className="text-emerald-500 hover:text-red-500 transition-colors" />
                            ) : (
                              <XCircle size={18} className="text-slate-300 dark:text-slate-600 hover:text-emerald-500 transition-colors" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}

                    {activeTab === 'concepts' && concepts.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white text-sm">{c.concept}</td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300 font-medium">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                            {technologies.find(t => t.id === c.technology_id)?.name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => toggleStatus('concepts', c.id, c.status)}
                            className="transition-colors cursor-pointer"
                            title={c.status === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            {c.status === 'active' ? (
                              <CheckCircle2 size={18} className="text-emerald-500 hover:text-red-500 transition-colors" />
                            ) : (
                              <XCircle size={18} className="text-slate-300 dark:text-slate-600 hover:text-emerald-500 transition-colors" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}

                    {((activeTab === 'trainers' && trainers.length === 0) ||
                      (activeTab === 'technologies' && technologies.length === 0) ||
                      (activeTab === 'concepts' && concepts.length === 0)) && (
                      <tr>
                        <td colSpan={4} className="px-6 py-16 text-center text-slate-400 dark:text-slate-500">
                          <p className="text-sm font-medium">No {activeTab} found in master catalog</p>
                          <p className="text-xs text-slate-400 mt-1">Add your first entry using the form on the left.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MasterDataPage
