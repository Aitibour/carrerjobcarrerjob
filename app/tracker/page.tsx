'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type AppWithJob = {
  id: string
  job_id: string
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
  jobs: { title: string; company: string }
  analysis: { score: number } | null
}

const COLUMNS = [
  { key: 'saved',     label: 'Saved',     emoji: '🔖', bg: 'bg-blue-50',   border: 'border-blue-200'   },
  { key: 'applied',   label: 'Applied',   emoji: '📤', bg: 'bg-violet-50', border: 'border-violet-200' },
  { key: 'interview', label: 'Interview', emoji: '🎙', bg: 'bg-amber-50',  border: 'border-amber-200'  },
  { key: 'offer',     label: 'Offer',     emoji: '🎉', bg: 'bg-green-50',  border: 'border-green-200'  },
  { key: 'rejected',  label: 'Rejected',  emoji: '❌', bg: 'bg-red-50',    border: 'border-red-200'    },
] as const

function scoreColor(score: number) {
  if (score >= 85) return 'bg-green-100 text-green-700'
  if (score >= 70) return 'bg-blue-100 text-blue-700'
  if (score >= 50) return 'bg-amber-100 text-amber-700'
  if (score >= 35) return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

export default function TrackerPage() {
  const [applications, setApplications] = useState<AppWithJob[]>([])
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/applications')
      .then(r => r.json())
      .then(d => { setApplications(d.applications ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function move(jobId: string, status: string) {
    setMoving(jobId)
    const res = await fetch(`/api/applications/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      setApplications(prev =>
        prev.map(a => a.job_id === jobId ? { ...a, status: status as AppWithJob['status'] } : a)
      )
    }
    setMoving(null)
  }

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-10 text-gray-400">Loading…</div>
  )

  if (applications.length === 0) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">📊</div>
      <p className="font-semibold text-gray-700 text-lg">No applications tracked yet</p>
      <p className="text-gray-400 mt-1 mb-6">Save jobs from search to start tracking</p>
      <Link href="/search" className="bg-blue-600 text-white rounded-xl px-6 py-3 font-bold hover:bg-blue-700 text-sm">
        Find jobs →
      </Link>
    </div>
  )

  const grouped = Object.fromEntries(
    COLUMNS.map(c => [c.key, applications.filter(a => a.status === c.key)])
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Application Tracker</h1>
        <p className="text-gray-500">Move jobs through your pipeline as you progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {COLUMNS.map(col => (
          <div key={col.key} className={`rounded-2xl border-2 ${col.border} ${col.bg} p-3`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-sm text-gray-700">{col.emoji} {col.label}</span>
              <span className="bg-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
                {grouped[col.key]?.length ?? 0}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {(grouped[col.key] ?? []).map(app => (
                <div key={app.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <Link href={`/jobs/${app.job_id}`} className="text-sm font-semibold text-gray-900 hover:text-blue-600 block leading-tight">
                    {app.jobs.title}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5 mb-2">{app.jobs.company}</p>
                  {app.analysis && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded inline-block mb-2 ${scoreColor(app.analysis.score)}`}>
                      {app.analysis.score}%
                    </span>
                  )}
                  <select
                    value={app.status}
                    disabled={moving === app.job_id}
                    onChange={e => move(app.job_id, e.target.value)}
                    className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 w-full mt-1"
                  >
                    {COLUMNS.map(c => (
                      <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>
              ))}
              {(grouped[col.key] ?? []).length === 0 && (
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-300">
                  Empty
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
