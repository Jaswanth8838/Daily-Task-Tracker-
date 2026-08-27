import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronDown, X, CheckCircle2, AlertCircle, Save, Send, RotateCcw, Clock } from 'lucide-react'
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

interface SessionItem {
  id?: number
  session_number?: number
  session_name?: string
  trainer_name?: string
  technology_name?: string
  concepts_covered?: string
  duration_hrs?: number
  update_text?: string
}

interface TrackerData {
  id?: number
  date?: string
  status?: string
  sessions?: SessionItem[]
}

interface DailyTrackerFormProps {
  tracker?: TrackerData | null
  accessStatus?: string
  isBlocked?: boolean
  isFrozen?: boolean
  isSubmitted?: boolean
  onUpdateSaved?: () => void
}

interface SessionFormState {
  session_number: number
  trainer_name: string
  technology_name: string
  concepts: string[]
  duration_hrs: string
  update_text: string
}

const defaultSessionState = (num: number): SessionFormState => ({
  session_number: num,
  trainer_name: 'Rajesh Kumar',
  technology_name: 'Python',
  concepts: [],
  duration_hrs: '2.00',
  update_text: '',
})

const DailyTrackerForm: React.FC<DailyTrackerFormProps> = ({
  tracker,
  isBlocked = false,
  isFrozen = false,
  isSubmitted = false,
  onUpdateSaved,
}) => {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [allConcepts, setAllConcepts] = useState<Concept[]>([])

  const [session1, setSession1] = useState<SessionFormState>(defaultSessionState(1))
  const [session2, setSession2] = useState<SessionFormState>(defaultSessionState(2))
  const [session3, setSession3] = useState<SessionFormState>(defaultSessionState(3))

  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [loadingSave, setLoadingSave] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const formattedDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  // Load Master Data
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [trRes, tcRes, coRes] = await Promise.all([
          api.get('/trainers'),
          api.get('/technologies'),
          api.get('/concepts')
        ])
        if (trRes.data?.length) setTrainers(trRes.data)
        if (tcRes.data?.length) setTechnologies(tcRes.data)
        if (coRes.data?.length) setAllConcepts(coRes.data)
      } catch (err) {
        console.error('Failed to load master data', err)
      }
    }
    fetchMasterData()
  }, [])

  // Sync state from persisted backend tracker object
  useEffect(() => {
    if (tracker?.sessions && tracker.sessions.length > 0) {
      const sMap = new Map<number, SessionItem>()
      tracker.sessions.forEach(s => {
        const sNum = s.session_number || (s.session_name?.includes('1') ? 1 : s.session_name?.includes('2') ? 2 : 3)
        sMap.set(sNum, s)
      })

      const mapToState = (num: number): SessionFormState => {
        const dbItem = sMap.get(num)
        if (!dbItem) return defaultSessionState(num)
        const conceptsArr = dbItem.concepts_covered
          ? dbItem.concepts_covered.split(',').map(c => c.trim()).filter(Boolean)
          : []
        return {
          session_number: num,
          trainer_name: dbItem.trainer_name || 'Rajesh Kumar',
          technology_name: dbItem.technology_name || 'Python',
          concepts: conceptsArr,
          duration_hrs: dbItem.duration_hrs !== undefined ? dbItem.duration_hrs.toString() : '2.00',
          update_text: dbItem.update_text || '',
        }
      }

      setSession1(mapToState(1))
      setSession2(mapToState(2))
      setSession3(mapToState(3))
    }
  }, [tracker])

  const getAvailableConcepts = (techName: string) => {
    if (!techName) return ['List Comprehension', 'Functions', 'Modules', 'File Handling', 'OOP Basics']
    const matching = technologies.find(t => t.name.toLowerCase().includes(techName.toLowerCase()))
    if (matching) {
      const filtered = allConcepts.filter(c => c.technology_id === matching.id).map(c => c.concept)
      return filtered.length ? filtered : ['List Comprehension', 'Functions', 'Modules', 'File Handling', 'OOP Basics']
    }
    return ['List Comprehension', 'Functions', 'Modules', 'File Handling', 'OOP Basics']
  }

  const isSessionComplete = (s: SessionFormState) => {
    return (
      Boolean(s.trainer_name.trim()) &&
      Boolean(s.technology_name.trim()) &&
      s.concepts.length > 0 &&
      Boolean(s.update_text.trim()) &&
      parseFloat(s.duration_hrs) > 0
    )
  }

  const s1Complete = isSessionComplete(session1)
  const s2Complete = isSessionComplete(session2)
  const s3Complete = isSessionComplete(session3)
  const allSessionsComplete = s1Complete && s2Complete && s3Complete

  const totalDuration = (
    (parseFloat(session1.duration_hrs) || 0) +
    (parseFloat(session2.duration_hrs) || 0) +
    (parseFloat(session3.duration_hrs) || 0)
  )

  const isDisabled = isBlocked || isFrozen || isSubmitted

  const handleClear = () => {
    setSession1(defaultSessionState(1))
    setSession2(defaultSessionState(2))
    setSession3(defaultSessionState(3))
    setMessage(null)
  }

  const preparePayload = () => ({
    sessions: [
      {
        session_number: 1,
        trainer_name: session1.trainer_name,
        technology_name: session1.technology_name,
        concepts_covered: session1.concepts.join(', '),
        duration_hrs: parseFloat(session1.duration_hrs) || 0,
        update_text: session1.update_text,
      },
      {
        session_number: 2,
        trainer_name: session2.trainer_name,
        technology_name: session2.technology_name,
        concepts_covered: session2.concepts.join(', '),
        duration_hrs: parseFloat(session2.duration_hrs) || 0,
        update_text: session2.update_text,
      },
      {
        session_number: 3,
        trainer_name: session3.trainer_name,
        technology_name: session3.technology_name,
        concepts_covered: session3.concepts.join(', '),
        duration_hrs: parseFloat(session3.duration_hrs) || 0,
        update_text: session3.update_text,
      },
    ]
  })

  const handleSaveDraft = async () => {
    setMessage(null)
    if (isDisabled) return
    setLoadingSave(true)
    try {
      await api.post('/tracker/save', preparePayload())
      setMessage({ type: 'success', text: 'Draft saved successfully to PostgreSQL database!' })
      if (onUpdateSaved) onUpdateSaved()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to save draft.' })
    } finally {
      setLoadingSave(false)
    }
  }

  const handleSubmitDay = async () => {
    setMessage(null)
    if (isDisabled) return

    if (!allSessionsComplete) {
      setMessage({
        type: 'error',
        text: 'All three training sessions (Session 1, Session 2, Session 3) must be completed before submitting.'
      })
      return
    }

    setLoadingSubmit(true)
    try {
      await api.post('/tracker/submit', preparePayload())
      setMessage({ type: 'success', text: 'Daily Tracker submitted successfully!' })
      if (onUpdateSaved) onUpdateSaved()
    } catch (err: any) {
      const errObj = err.response?.data?.error
      const errorMsg = typeof errObj === 'object' ? errObj.message : (errObj || 'Failed to submit daily tracker.')
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setLoadingSubmit(false)
    }
  }

  const renderSessionCard = (
    sNum: number,
    state: SessionFormState,
    setState: React.Dispatch<React.SetStateAction<SessionFormState>>,
    isComplete: boolean
  ) => {
    const sId = `session${sNum}`
    const available = getAvailableConcepts(state.technology_name)
    const isDropdownOpen = activeDropdown === sNum

    return (
      <div key={sNum} className="bg-slate-50/70 dark:bg-slate-800/50 border border-slate-200/90 dark:border-slate-700/80 rounded-2xl p-6 transition-all">
        {/* Session Card Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/80 dark:border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-sm shadow-blue-600/30">
              {sNum}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Session {sNum}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Required Training Session #{sNum}</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border ${
              isComplete
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60'
            }`}
          >
            {isComplete ? (
              <>
                <CheckCircle2 size={13} className="text-emerald-500" />
                ✓ Complete
              </>
            ) : (
              <>
                <AlertCircle size={13} className="text-amber-500" />
                ! Incomplete
              </>
            )}
          </span>
        </div>

        {/* Controls Grid */}
        <div className="space-y-4">
          {/* Row 1: Trainer & Tech */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${sId}-trainer`} className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Trainer Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id={`${sId}-trainer`}
                  name={`${sId}Trainer`}
                  disabled={isDisabled}
                  value={state.trainer_name}
                  onChange={e => setState(prev => ({ ...prev, trainer_name: e.target.value }))}
                  className="w-full h-11 appearance-none border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed pr-9 font-medium"
                >
                  <option value="Rajesh Kumar">Rajesh Kumar</option>
                  <option value="Priya Sharma">Priya Sharma</option>
                  <option value="Anil Verma">Anil Verma</option>
                  {trainers.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor={`${sId}-technology`} className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Technology / Domain <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  id={`${sId}-technology`}
                  name={`${sId}Technology`}
                  disabled={isDisabled}
                  value={state.technology_name}
                  onChange={e => setState(prev => ({ ...prev, technology_name: e.target.value }))}
                  className="w-full h-11 appearance-none border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed pr-9 font-medium"
                >
                  <option value="Python">Python</option>
                  <option value="React">React</option>
                  <option value="Java">Java</option>
                  <option value="SQL">SQL</option>
                  {technologies.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: Concepts & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`${sId}-concepts`} className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Concepts Covered <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div
                  id={`${sId}-concepts`}
                  onClick={() => !isDisabled && setActiveDropdown(isDropdownOpen ? null : sNum)}
                  className="min-h-[44px] border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 flex flex-wrap items-center gap-1.5 cursor-pointer bg-white dark:bg-slate-800 pr-8"
                >
                  {state.concepts.map(c => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-900/60"
                    >
                      {c}
                      {!isDisabled && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setState(prev => ({ ...prev, concepts: prev.concepts.filter(item => item !== c) }))
                          }}
                          className="text-blue-500 hover:text-blue-800 dark:hover:text-blue-200 ml-0.5"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </span>
                  ))}
                  {state.concepts.length === 0 && (
                    <span className="text-xs text-slate-400">Select concepts…</span>
                  )}
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {isDropdownOpen && !isDisabled && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto p-1 text-xs">
                    {available.map(opt => (
                      <div
                        key={opt}
                        onClick={() => {
                          if (!state.concepts.includes(opt)) {
                            setState(prev => ({ ...prev, concepts: [...prev.concepts, opt] }))
                          }
                          setActiveDropdown(null)
                        }}
                        className="px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-700 dark:hover:text-white cursor-pointer font-medium text-slate-800 dark:text-slate-100"
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label htmlFor={`${sId}-duration`} className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Duration (hrs) <span className="text-red-500">*</span>
              </label>
              <input
                id={`${sId}-duration`}
                name={`${sId}Duration`}
                type="number"
                step="0.5"
                min="0.5"
                max="12"
                disabled={isDisabled}
                value={state.duration_hrs}
                onChange={e => setState(prev => ({ ...prev, duration_hrs: e.target.value }))}
                className="w-full h-11 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 font-medium disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
                placeholder="2.00"
              />
            </div>
          </div>

          {/* Row 3: Daily Update Textarea */}
          <div>
            <label htmlFor={`${sId}-update`} className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Your Daily Update <span className="text-red-500">*</span>
            </label>
            <textarea
              id={`${sId}-update`}
              name={`${sId}Update`}
              rows={3}
              disabled={isDisabled}
              value={state.update_text}
              onChange={e => setState(prev => ({ ...prev, update_text: e.target.value }))}
              maxLength={1000}
              placeholder={`Enter training details, tasks completed, and challenges for Session ${sNum}…`}
              className="w-full min-h-[90px] border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-normal leading-relaxed bg-white dark:bg-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              <span>Required for Session {sNum}</span>
              <span>{state.update_text.length} / 1000</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-7 space-y-6">
      {/* Top Banner / Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Intern Daily Training Tracker</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
            <CalendarIcon size={14} className="text-slate-400" />
            Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{formattedDate}</span>
          </p>
        </div>

        {/* Completion Progress Badge Header */}
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 px-4 py-2 rounded-xl">
          <Clock size={15} className="text-blue-600 dark:text-blue-400" />
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Sessions Completed:{' '}
            <span className={allSessionsComplete ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
              {[s1Complete, s2Complete, s3Complete].filter(Boolean).length} / 3
            </span>
          </div>
        </div>
      </div>

      {/* Message Box */}
      {message && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2.5 ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Blocked / Frozen Notice */}
      {isBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-xs text-red-700 font-medium">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
          <p>
            Your daily tracker access is <span className="font-bold uppercase">BLOCKED</span>. You missed one or more past daily updates. Please contact HR/Admin to grant access.
          </p>
        </div>
      )}

      {/* Render All Three Mandatory Sessions */}
      <div className="space-y-5">
        {renderSessionCard(1, session1, setSession1, s1Complete)}
        {renderSessionCard(2, session2, setSession2, s2Complete)}
        {renderSessionCard(3, session3, setSession3, s3Complete)}
      </div>

      {/* Bottom Summary & Actions Bar */}
      <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Total Calculated Duration */}
        <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
          <span>Total Calculated Duration:</span>
          <span className="text-base font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
            {totalDuration.toFixed(1)} hrs
          </span>
        </div>

        {/* Buttons Bar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            id="btn-clear-tracker"
            name="btnClearTracker"
            onClick={handleClear}
            disabled={isDisabled || loadingSave || loadingSubmit}
            className="h-11 px-5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RotateCcw size={15} />
            Clear
          </button>

          <button
            type="button"
            id="btn-save-draft"
            name="btnSaveDraft"
            onClick={handleSaveDraft}
            disabled={isDisabled || loadingSave || loadingSubmit}
            className="h-11 px-5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            <Save size={15} />
            {loadingSave ? 'Saving…' : 'Save Draft'}
          </button>

          <button
            type="button"
            id="btn-submit-day"
            name="btnSubmitDay"
            onClick={handleSubmitDay}
            disabled={isDisabled || loadingSave || loadingSubmit || !allSessionsComplete}
            className="h-11 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-emerald-600/30 flex items-center gap-2 disabled:cursor-not-allowed"
          >
            <Send size={15} />
            {loadingSubmit ? 'Submitting…' : 'Submit Day'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DailyTrackerForm
