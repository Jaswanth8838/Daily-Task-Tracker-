import React, { useState, useEffect } from 'react'
import { Calendar, ChevronDown, X, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../../lib/api'

interface Trainer {
  id: number
  name: string
}

interface Technology {
  id: number
  name: string
}

interface Concept {
  id: number
  technology_id: number
  concept: string
}

const MultiSelectConcepts: React.FC<{
  selected: string[]
  options: string[]
  onChange: (val: string[]) => void
}> = ({ selected, options, onChange }) => {
  const [open, setOpen] = useState(false)
  const available = options.filter(o => !selected.includes(o))

  return (
    <div className="relative">
      <div
        className="min-h-10 border border-slate-300 rounded-lg px-3 py-2 flex flex-wrap gap-1.5 items-center cursor-pointer hover:border-blue-400 transition-colors bg-white"
        onClick={() => setOpen(!open)}
      >
        {selected.map(c => (
          <span key={c} className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-0.5 rounded-md font-medium">
            {c}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onChange(selected.filter(s => s !== c)) }}
              className="hover:text-blue-900 transition-colors"
            >
              <X size={11} />
            </button>
          </span>
        ))}
        {selected.length === 0 && (
          <span className="text-slate-400 text-xs">Select covered concepts…</span>
        )}
        <ChevronDown size={14} className={`ml-auto text-slate-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.length === 0 ? (
            <p className="text-xs text-slate-400 px-3 py-2">Select a technology first or add concepts in Master Data</p>
          ) : available.length === 0 ? (
            <p className="text-xs text-slate-400 px-3 py-2">All concepts selected</p>
          ) : (
            available.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => { onChange([...selected, opt]); setOpen(false) }}
                className="w-full text-left text-xs px-3 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                {opt}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

const DailyTrackerForm: React.FC<{ onUpdateSaved?: () => void }> = ({ onUpdateSaved }) => {
  const todayFormatted = new Date().toLocaleDateString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric',
  })
  const todayIso = new Date().toISOString().split('T')[0]

  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [allConcepts, setAllConcepts] = useState<Concept[]>([])
  const [availableConcepts, setAvailableConcepts] = useState<string[]>([])

  const [selectedTrainer, setSelectedTrainer] = useState('')
  const [selectedTech, setSelectedTech] = useState('')
  const [session, setSession] = useState('Session 1: Morning')
  const [concepts, setConcepts] = useState<string[]>([])
  const [duration, setDuration] = useState('2.0')
  const [update, setUpdate] = useState('')
  const [customDate, setCustomDate] = useState(todayIso)

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Fetch Master Data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [trRes, tcRes, coRes] = await Promise.all([
          api.get('/trainers'),
          api.get('/technologies'),
          api.get('/concepts')
        ])
        setTrainers(trRes.data)
        setTechnologies(tcRes.data)
        setAllConcepts(coRes.data)
      } catch (err) {
        console.error('Failed to load master data', err)
      }
    }
    fetchMasterData()
  }, [])

  // Update concepts list when technology changes
  useEffect(() => {
    if (!selectedTech) {
      setAvailableConcepts([])
      return
    }
    const matchingTech = technologies.find(t => t.name === selectedTech)
    if (matchingTech) {
      const filtered = allConcepts
        .filter(c => c.technology_id === matchingTech.id)
        .map(c => c.concept)
      setAvailableConcepts(filtered)
    } else {
      setAvailableConcepts([])
    }
  }, [selectedTech, technologies, allConcepts])

  const handleClear = () => {
    setSelectedTrainer('')
    setSelectedTech('')
    setSession('Session 1: Morning')
    setConcepts([])
    setDuration('2.0')
    setUpdate('')
    setMessage(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!selectedTrainer) {
      setMessage({ type: 'error', text: 'Please select a Trainer' })
      return
    }
    if (!selectedTech) {
      setMessage({ type: 'error', text: 'Please select a Technology' })
      return
    }
    if (!update.trim()) {
      setMessage({ type: 'error', text: 'Please enter your daily update details' })
      return
    }

    setLoading(true)
    try {
      await api.post('/tracker/update', {
        trainer_name: selectedTrainer,
        technology_name: selectedTech,
        session_name: session,
        concepts_covered: concepts.join(', '),
        duration_hrs: parseFloat(duration) || 2.0,
        update_text: update,
        date: customDate
      })
      setMessage({ type: 'success', text: 'Daily update recorded and submitted successfully!' })
      handleClear()
      if (onUpdateSaved) onUpdateSaved()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to submit daily update' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm font-bold text-slate-800">Add Daily Update</h2>
          <p className="text-xs text-slate-500">Record your learning activities for today</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <Calendar size={13} className="text-blue-600" />
          <span>{todayFormatted}</span>
        </div>
      </div>

      {message && (
        <div
          className={`mb-4 rounded-lg px-3.5 py-2.5 text-xs font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4">
        {/* Trainer */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Trainer Name <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedTrainer}
            onChange={e => setSelectedTrainer(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Select Trainer…</option>
            {trainers.map(t => (
              <option key={t.id} value={t.name}>{t.name}</option>
            ))}
          </select>
          {trainers.length === 0 && (
            <p className="text-[11px] text-amber-600 mt-1">
              Tip: Add Trainers in the Master Data tab first, or type below.
            </p>
          )}
        </div>

        {/* Technology + Session */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Technology / Domain <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTech}
              onChange={e => { setSelectedTech(e.target.value); setConcepts([]) }}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Select Technology…</option>
              {technologies.map(t => (
                <option key={t.id} value={t.name}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Session Slot <span className="text-red-500">*</span>
            </label>
            <select
              value={session}
              onChange={e => setSession(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="Session 1: Morning (10:00 - 12:00)">Session 1: Morning (10:00 - 12:00)</option>
              <option value="Session 2: Afternoon (14:00 - 16:00)">Session 2: Afternoon (14:00 - 16:00)</option>
              <option value="Session 3: Evening (16:30 - 18:30)">Session 3: Evening (16:30 - 18:30)</option>
              <option value="Hands-on Project Lab">Hands-on Project Lab</option>
            </select>
          </div>
        </div>

        {/* Concepts Covered + Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Concepts Covered
            </label>
            <MultiSelectConcepts
              selected={concepts}
              options={availableConcepts}
              onChange={setConcepts}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Duration (Hours) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="12"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Daily update textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Your Daily Update & Summary <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={update}
            onChange={e => setUpdate(e.target.value)}
            maxLength={1000}
            placeholder="Describe what you learned today, assignments completed, code written, challenges overcome..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <div className="flex justify-between items-center mt-1">
            <span className="text-[11px] text-slate-400">Keep it concise and accurate</span>
            <span className="text-[11px] text-slate-400">{update.length} / 1000</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-600/20 flex items-center gap-1.5"
          >
            {loading ? 'Saving…' : 'Save & Submit Update'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  )
}

export default DailyTrackerForm
