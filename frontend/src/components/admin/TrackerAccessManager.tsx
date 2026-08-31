import React, { useState, useEffect } from 'react'
import { ShieldCheck, ShieldAlert, CheckCircle2, RefreshCw, Unlock, Lock, UserCheck, AlertCircle, X } from 'lucide-react'
import api from '../../lib/api'

interface InternAccessRecord {
  intern_id: number
  intern_name: string
  intern_email: string
  employee_id: string
  manager_name: string
  tracker_access_status: string
  last_submission_date: string
  frozen_date?: string | null
  frozen_status?: string | null
  latest_reason: string
}

const TrackerAccessManager: React.FC = () => {
  const [records, setRecords] = useState<InternAccessRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [search, setSearch] = useState('')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedIntern, setSelectedIntern] = useState<InternAccessRecord | null>(null)
  const [modalAction, setModalAction] = useState<'grant' | 'revoke'>('grant')
  const [reason, setReason] = useState('')
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchAccessList = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admin/tracker-access')
      setRecords(res.data)
    } catch (err) {
      console.error('Failed to load tracker access records', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccessList()
  }, [])

  const handleOpenModal = (intern: InternAccessRecord, action: 'grant' | 'revoke') => {
    setSelectedIntern(intern)
    setModalAction(action)
    setReason(action === 'grant' ? 'Approved by HR/Admin for tracker submission resumption' : 'Administrative block')
    setModalOpen(true)
  }

  const handleConfirmAction = async () => {
    if (!selectedIntern) return
    setActionLoading(true)
    try {
      if (modalAction === 'grant') {
        await api.post(`/admin/tracker-access/${selectedIntern.intern_id}/grant`, { reason })
        setToastMessage({ type: 'success', text: `Tracker access successfully granted to ${selectedIntern.intern_name}` })
      } else {
        await api.post(`/admin/tracker-access/${selectedIntern.intern_id}/revoke`, { reason })
        setToastMessage({ type: 'success', text: `Tracker access revoked for ${selectedIntern.intern_name}` })
      }
      setModalOpen(false)
      fetchAccessList()
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update access status' })
    } finally {
      setActionLoading(false)
    }
  }

  const filteredRecords = records.filter(r =>
    r.intern_name.toLowerCase().includes(search.toLowerCase()) ||
    r.intern_email.toLowerCase().includes(search.toLowerCase()) ||
    (r.employee_id || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-800 p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 dark:text-white">Access Control &amp; Overrides Management</h2>
            <span className="bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-900/60 text-[10px] font-bold px-2 py-0.5 rounded-full">
              HR Security Control
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor submission status, auto-frozen update locks, and grant re-access overrides from PostgreSQL
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="tracker-access-search"
            name="trackerAccessSearch"
            type="text"
            placeholder="Search intern, ID, domain…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={fetchAccessList}
            disabled={loading}
            className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {toastMessage && (
        <div
          className={`rounded-xl px-3.5 py-2.5 text-xs font-medium flex items-center justify-between ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{toastMessage.text}</span>
          </div>
          <button type="button" onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Access Grid / Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-left uppercase tracking-wider">
              <th className="pb-3 pr-3">Intern Profile</th>
              <th className="pb-3 pr-3">Missed Date</th>
              <th className="pb-3 pr-3">Tracker Status</th>
              <th className="pb-3 pr-3">Access Status</th>
              <th className="pb-3 pr-3">Reason / Details</th>
              <th className="pb-3 text-right">Access Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRecords.map((r) => {
              const isBlocked = r.tracker_access_status === 'BLOCKED'
              return (
                <tr key={r.intern_id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 pr-3">
                    <div className="font-bold text-slate-800 dark:text-slate-100">{r.intern_name}</div>
                    <div className="text-[11px] text-slate-400 font-normal">
                      {r.intern_email} • <span className="font-semibold text-blue-600 dark:text-blue-400">{r.employee_id}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                    {r.frozen_date || '—'}
                  </td>
                  <td className="py-3 pr-3">
                    {r.frozen_status ? (
                      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-bold ${
                        r.frozen_status === 'FROZEN' || r.frozen_status === 'MISSED'
                          ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60'
                          : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60'
                      }`}>
                        {r.frozen_status}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    {isBlocked ? (
                      <span className="inline-flex items-center gap-1 bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/60 text-[11px] px-2.5 py-0.5 rounded-md font-extrabold">
                        <ShieldAlert size={12} /> BLOCKED
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 text-[11px] px-2.5 py-0.5 rounded-md font-bold">
                        <ShieldCheck size={12} /> ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-slate-600 dark:text-slate-300 max-w-[240px] truncate" title={r.latest_reason}>
                    {r.latest_reason}
                  </td>
                  <td className="py-3 text-right">
                    {isBlocked ? (
                      <button
                        type="button"
                        onClick={() => handleOpenModal(r, 'grant')}
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors shadow-sm shadow-emerald-600/20 active:scale-95"
                      >
                        <Unlock size={12} />
                        Grant Access
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleOpenModal(r, 'revoke')}
                        className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 font-semibold px-2.5 py-1.5 rounded-xl text-xs transition-colors"
                      >
                        <Lock size={12} />
                        Revoke Access
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {filteredRecords.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                  No interns found matching filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {modalOpen && selectedIntern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${modalAction === 'grant' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300' : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300'}`}>
                  {modalAction === 'grant' ? <Unlock size={18} /> : <Lock size={18} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                    {modalAction === 'grant' ? 'Grant Tracker Re-Access' : 'Revoke Tracker Access'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{selectedIntern.intern_name} ({selectedIntern.intern_email})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {modalAction === 'grant'
                  ? 'Granting access restores the intern’s capability to submit today’s and future daily trackers. Historical missed dates remain frozen unless explicitly reopened. This action is logged in the audit trail.'
                  : 'Revoking access blocks the intern from submitting further daily updates until explicitly re-granted by HR/Admin.'}
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Override <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="State the justification, approved leave, or administrative rationale..."
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading || !reason.trim()}
                  onClick={handleConfirmAction}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-colors flex items-center gap-1.5 ${
                    modalAction === 'grant'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20'
                      : 'bg-red-600 hover:bg-red-700 shadow-sm shadow-red-600/20'
                  }`}
                >
                  {actionLoading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : modalAction === 'grant' ? (
                    'Confirm & Grant Access'
                  ) : (
                    'Confirm & Revoke Access'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TrackerAccessManager
