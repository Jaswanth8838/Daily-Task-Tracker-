import React, { useEffect, useState } from 'react'
import { FileText, Calendar, Filter, Search, CheckCircle2, Lock, Clock, BookOpen, Users, Code2, Eye } from 'lucide-react'
import api from '../lib/api'
import { useAuth } from '../context/AuthContext'

// Employee Update Interface
interface UpdateItem {
  id: number
  date: string
  trainer_name: string
  technology_name: string
  session_name: string
  concepts_covered: string
  duration_hrs: number
  update_text: string
  status: string
  created_at: string
  today_work?: string
  what_learned?: string
  overall_progress?: number
  remarks?: string
}

// Intern Update Interface
interface InternUpdateItem {
  id: number
  date: string
  training_details: string
  training_status: string
  training_progress: number
  meeting_details: string
  meeting_status: string
  meeting_notes: string
  practice_details: string
  practice_status: string
  practice_progress: number
  overall_status: string
  is_frozen: boolean
  created_at: string
  updated_at: string
}

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-slate-100 text-slate-600 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
}

const MyUpdatesPage: React.FC = () => {
  const { user } = useAuth()
  const isIntern = user?.role === 'intern'

  const [empUpdates, setEmpUpdates] = useState<UpdateItem[]>([])
  const [internUpdates, setInternUpdates] = useState<InternUpdateItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [selectedEmpUpdate, setSelectedEmpUpdate] = useState<UpdateItem | null>(null)
  const [selectedInternUpdate, setSelectedInternUpdate] = useState<InternUpdateItem | null>(null)

  const fetchMyUpdates = async () => {
    setLoading(true)
    try {
      if (isIntern) {
        const res = await api.get('/intern-reports/my')
        setInternUpdates(res.data)
      } else {
        const res = await api.get('/reports/my')
        setEmpUpdates(res.data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyUpdates()
  }, [isIntern])

  // --- Filtering ---
  const filteredEmpUpdates = empUpdates.filter(u => {
    const matchesSearch =
      u.technology_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.trainer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.update_text.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || u.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const filteredInternUpdates = internUpdates.filter(u => {
    const matchesSearch =
      u.training_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.meeting_details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.practice_details.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || u.overall_status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">My Daily Updates History</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isIntern
              ? 'Track and verify all your submitted intern training and work logs'
              : 'Track and view all your daily employee reports'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-lg text-xs">
            <span className="text-slate-500">Total Submissions: </span>
            <strong className="text-slate-800 font-bold">
              {isIntern ? internUpdates.length : empUpdates.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={isIntern ? "Search details, meetings, practice..." : "Search technology, trainer, topics..."}
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter size={14} className="text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </div>

      {/* Updates History Grid / Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12">
            <span className="w-8 h-8 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></span>
          </div>
        ) : isIntern ? (
          /* Intern Report History Table */
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Training Progress</th>
                  <th className="px-5 py-3">Meeting Status</th>
                  <th className="px-5 py-3">Practice Progress</th>
                  <th className="px-5 py-3 text-center">Overall Status</th>
                  <th className="px-5 py-3 text-center">Freeze Status</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInternUpdates.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800 whitespace-nowrap">{u.date}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <BookOpen size={13} className="text-blue-500" />
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[u.training_status]}`}>
                          {u.training_progress}% ({u.training_status.replace('_', ' ')})
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Users size={13} className="text-purple-500" />
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[u.meeting_status]}`}>
                          {u.meeting_status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <Code2 size={13} className="text-emerald-500" />
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[u.practice_status]}`}>
                          {u.practice_progress}% ({u.practice_status.replace('_', ' ')})
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[u.overall_status]}`}>
                        {u.overall_status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {u.is_frozen ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                          <Lock size={10} /> FROZEN
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedInternUpdate(u)}
                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 mx-auto"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredInternUpdates.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      <FileText size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="font-medium">No intern reports found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Employee Update History Table */
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Today's Work</th>
                  <th className="px-5 py-3">What I Learned</th>
                  <th className="px-5 py-3">Overall Progress</th>
                  <th className="px-5 py-3 text-center">Status</th>
                  <th className="px-5 py-3 text-center">Freeze Status</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmpUpdates.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-800 whitespace-nowrap">{u.date}</td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-[200px] truncate">{u.today_work}</td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-[150px] truncate">{u.what_learned}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{u.overall_progress}%</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_COLORS[u.status]}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {u.status === 'locked' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-bold">
                          <Lock size={10} /> LOCKED
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedEmpUpdate(u)}
                        className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1.5 mx-auto"
                      >
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmpUpdates.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                      <FileText size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="font-medium">No reports found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Intern Report Detail Modal */}
      {selectedInternUpdate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setSelectedInternUpdate(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Intern Daily Report Detail</h3>
                <p className="text-xs text-slate-500">Submitted for Date: {selectedInternUpdate.date}</p>
              </div>
              <button onClick={() => setSelectedInternUpdate(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Training */}
              <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-700"><BookOpen size={14} className="text-blue-600" /> Training</div>
                <p className="text-slate-600 mb-2 whitespace-pre-wrap">{selectedInternUpdate.training_details || 'No training details logged'}</p>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[selectedInternUpdate.training_status]}`}>{selectedInternUpdate.training_status.replace('_',' ')}</span>
                  <span className="text-slate-500">Progress: <strong>{selectedInternUpdate.training_progress}%</strong></span>
                </div>
              </div>

              {/* Meeting */}
              <div className="rounded-lg border border-purple-200 bg-purple-50/40 p-4">
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-700"><Users size={14} className="text-purple-600" /> Meetings</div>
                <p className="text-slate-600 mb-2 whitespace-pre-wrap">{selectedInternUpdate.meeting_details || 'No meetings logged'}</p>
                {selectedInternUpdate.meeting_notes && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block mb-1">Notes:</span>
                    <p className="bg-white/80 p-2 rounded border border-purple-100 text-slate-600">{selectedInternUpdate.meeting_notes}</p>
                  </div>
                )}
                <div className="mt-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[selectedInternUpdate.meeting_status]}`}>{selectedInternUpdate.meeting_status.replace('_',' ')}</span>
                </div>
              </div>

              {/* Practice */}
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
                <div className="flex items-center gap-2 mb-2 font-bold text-slate-700"><Code2 size={14} className="text-emerald-600" /> Practice & Coding</div>
                <p className="text-slate-600 mb-2 whitespace-pre-wrap">{selectedInternUpdate.practice_details || 'No practice logged'}</p>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${STATUS_COLORS[selectedInternUpdate.practice_status]}`}>{selectedInternUpdate.practice_status.replace('_',' ')}</span>
                  <span className="text-slate-500">Progress: <strong>{selectedInternUpdate.practice_progress}%</strong></span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-slate-500">
                <div>Overall Day Status: <span className={`ml-1 font-bold px-2 py-0.5 rounded ${STATUS_COLORS[selectedInternUpdate.overall_status]}`}>{selectedInternUpdate.overall_status.replace('_',' ')}</span></div>
                {selectedInternUpdate.is_frozen && <span className="text-amber-700 font-bold flex items-center gap-1"><Lock size={12} /> LOCKED / FROZEN</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Detail Modal */}
      {selectedEmpUpdate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4" onClick={() => setSelectedEmpUpdate(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Daily Update Details</h3>
                <p className="text-xs text-slate-500">Date: {selectedEmpUpdate.date}</p>
              </div>
              <button onClick={() => setSelectedEmpUpdate(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>Technology: <strong>{selectedEmpUpdate.technology_name}</strong></div>
                <div>Trainer: <strong>{selectedEmpUpdate.trainer_name}</strong></div>
                <div>Session: <strong>{selectedEmpUpdate.session_name}</strong></div>
                <div>Duration: <strong>{selectedEmpUpdate.duration_hrs} hours</strong></div>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block mb-1">Today's Work:</span>
                <p className="bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-700 whitespace-pre-wrap">{selectedEmpUpdate.today_work || selectedEmpUpdate.update_text}</p>
              </div>
              {selectedEmpUpdate.what_learned && (
                <div>
                  <span className="text-slate-500 font-semibold block mb-1">What I Learned:</span>
                  <p className="bg-slate-50 p-2.5 rounded border border-slate-100 text-slate-700 whitespace-pre-wrap">{selectedEmpUpdate.what_learned}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyUpdatesPage
