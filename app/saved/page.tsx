'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type AppWithJob = {
  id: string
  job_id: string
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
  updated_at: string
  jobs: { title: string; company: string; location: string }
  analysis: { score: number } | null
}

const STATUSES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const
const STATUS_LABELS: Record<string, string> = {
  saved: '🔖 Saved', applied: '📤 Applied', interview: '🎙 Interview',
  offer: '🎉 Offer', rejected: '❌ Rejected',
}
const STATUS_COLORS: Record<string, string> = {
  saved: 'bg-blue-100 text-blue-700',
  applied: 'bg-violet-100 text-violet-700',
  interview: 'bg-amber-100 text-amber-700',
  offer: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

function scoreColor(score: number) {
  if (score >= 85) return 'bg-green-100 text-green-700'
  if (score >= 70) return 'bg-blue-100 text-blue-700'
  if (score >= 50) return 'bg-amber-100 text-amber-700'
  if (score >= 35) return 'bg-orange-100 text-orange-700'
  return 'bg-red-100 text-red-700'
}

export default function SavedPage() {
  const [applications, setApplications] = useState<AppWithJob[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/applications')
      .then(r => r.json())
      .then(d => { setApplications(d.applications ?? []); setLoading(false) })
  }, [])

  async function updateStatus(jobId: string, status: string) {
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
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-gray-400">Loading…</div>
  )

  if (applications.length === 0) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <div className="text-5xl mb-4">🔖</div>
      <p className="font-semibold text-gray-700 text-lg">No saved jobs yet</p>
      <p className="text-gray-400 mt-1 mb-6">Search for jobs and save the ones you like</p>
      <Link href="/search" className="bg-blue-600 text-white rounded-xl px-6 py-3 font-bold hover:bg-blue-700 text-sm">
        Find jobs →
      </Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Saved Jobs</h1>
        <p className="text-gray-500">{applications.length} job{applications.length !== 1 ? 's' : ''} tracked</p>
      </div>

      <div className="flex flex-col gap-3">
        {applications.map(app => (
          <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-center shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center flex-shrink-0 ${app.analysis ? scoreColor(app.analysis.score) : 'bg-gray-100 text-gray-400'}`}>
              {app.analysis ? (
                <>
                  <span className="text-sm font-black leading-none">{app.analysis.score}%</span>
                  <span className="text-[10px] opacity-60 leading-none mt-0.5">match</span>
                </>
              ) : '—'}
            </div>

            <div className="flex-1 min-w-0">
              <Link href={`/jobs/${app.job_id}`} className="font-semibold text-gray-900 hover:text-blue-600 text-sm block">
                {app.jobs.title}
              </Link>
              <p className="text-xs text-gray-500 mt-0.5">{app.jobs.company} · {app.jobs.location}</p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <select
                value={app.status}
                onChange={e => updateStatus(app.job_id, e.target.value)}
                className={`text-xs px-2 py-1.5 rounded-lg font-semibold border-0 cursor-pointer ${STATUS_COLORS[app.status]}`}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <Link href={`/jobs/${app.job_id}`} className="text-xs text-gray-400 hover:text-gray-600 underline">
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
