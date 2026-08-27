import React, { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'

interface UpdateRow {
  id: number
  intern_name: string
  date: string
  session: string
  trainer: string
  technology: string
  duration: string
  status: 'Submitted' | 'Pending' | 'Locked' | string
  update_text?: string
}

const defaultRows: UpdateRow[] = [
  { id: 1, intern_name: 'Aarav Sharma', date: '22 May 2025', session: 'Session 1', trainer: 'Rajesh Kumar', technology: 'Python', duration: '2.00 hrs', status: 'Submitted' },
  { id: 2, intern_name: 'Ananya Patel', date: '22 May 2025', session: 'Session 1', trainer: 'Rajesh Kumar', technology: 'Python', duration: '2.00 hrs', status: 'Submitted' },
  { id: 3, intern_name: 'Rohan Mehta', date: '22 May 2025', session: 'Session 2', trainer: 'Rajesh Kumar', technology: 'Python', duration: '2.00 hrs', status: 'Submitted' },
  { id: 4, intern_name: 'Simran Kaur', date: '22 May 2025', session: 'Session 2', trainer: 'Rajesh Kumar', technology: 'Python', duration: '2.00 hrs', status: 'Pending' },
  { id: 5, intern_name: 'Vivek Singh', date: '22 May 2025', session: 'Session 1', trainer: 'Rajesh Kumar', technology: 'Python', duration: '2.00 hrs', status: 'Locked' },
]

const RecentUpdatesTable: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger }) => {
  const [updates, setUpdates] = useState<UpdateRow[]>(defaultRows)
  const [selectedModal, setSelectedModal] = useState<UpdateRow | null>(null)

  const fetchRecent = async () => {
    try {
      const res = await api.get('/tracker/recent')
      if (res.data && res.data.length > 0) {
        setUpdates(res.data)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchRecent()
  }, [refreshTrigger])

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-7">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pb-2 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800">Recent Updates</h2>
        <Link
          to="/my-updates"
          className="text-xs font-semibold text-blue-600 hover:text-blue-700 bg-white border border-blue-600/80 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors"
        >
          View All
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-700 font-bold text-left">
              <th className="pb-3.5 pr-3 font-semibold">Intern Name</th>
              <th className="pb-3.5 pr-3 font-semibold">Date</th>
              <th className="pb-3.5 pr-3 font-semibold">Session</th>
              <th className="pb-3.5 pr-3 font-semibold">Trainer</th>
              <th className="pb-3.5 pr-3 font-semibold">Technology</th>
              <th className="pb-3.5 pr-3 font-semibold">Duration</th>
              <th className="pb-3 text-center font-semibold">Status</th>
              <th className="pb-3 text-center font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {updates.map((u) => {
              const isSubmitted = u.status.toLowerCase() === 'submitted'
              const isPending = u.status.toLowerCase() === 'pending' || u.status.toLowerCase() === 'draft'
              const isLocked = u.status.toLowerCase() === 'locked' || u.status.toLowerCase() === 'frozen'

              return (
                <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-4 pr-3 font-medium text-slate-800 whitespace-nowrap">
                    {u.intern_name}
                  </td>
                  <td className="py-4 pr-3 text-slate-600 font-medium whitespace-nowrap">
                    {u.date}
                  </td>
                  <td className="py-4 pr-3 text-slate-700 font-medium whitespace-nowrap">
                    {u.session}
                  </td>
                  <td className="py-4 pr-3 text-slate-700 font-medium whitespace-nowrap">
                    {u.trainer}
                  </td>
                  <td className="py-4 pr-3 text-slate-700 font-medium whitespace-nowrap">
                    {u.technology}
                  </td>
                  <td className="py-4 pr-3 text-slate-700 font-medium whitespace-nowrap">
                    {u.duration}
                  </td>
                  <td className="py-4 text-center whitespace-nowrap">
                    {isSubmitted && (
                      <span className="inline-block bg-emerald-50 text-emerald-600 border border-emerald-200 font-semibold px-3 py-1 rounded-lg text-xs">
                        Submitted
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-block bg-amber-50 text-amber-600 border border-amber-200 font-semibold px-3 py-1 rounded-lg text-xs">
                        Pending
                      </span>
                    )}
                    {isLocked && (
                      <span className="inline-block bg-red-50 text-red-600 border border-red-200 font-semibold px-3 py-1 rounded-lg text-xs">
                        Locked
                      </span>
                    )}
                  </td>
                  <td className="py-4 text-center whitespace-nowrap">
                    {isSubmitted ? (
                      <button
                        type="button"
                        onClick={() => setSelectedModal(u)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                    ) : (
                      <span className="text-slate-400 font-semibold">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{selectedModal.intern_name} — {selectedModal.session}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedModal.date} • {selectedModal.technology} ({selectedModal.duration})</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModal(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3.5 text-sm">
              <div>
                <span className="text-slate-500 block font-semibold mb-1">Trainer:</span>
                <p className="text-slate-800 font-medium">{selectedModal.trainer}</p>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold mb-1">Daily Update Summary:</span>
                <p className="text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed font-normal">
                  {selectedModal.update_text || 'Completed scheduled exercises, code implementation, and functional testing.'}
                </p>
              </div>
            </div>
            <div className="mt-6 text-right">
              <button
                type="button"
                onClick={() => setSelectedModal(null)}
                className="bg-blue-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/30"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RecentUpdatesTable
