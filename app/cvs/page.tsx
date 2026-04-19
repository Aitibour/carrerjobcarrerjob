'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type CV = {
  id: string
  filename: string
  uploaded_at: string
  is_active: boolean
  content: string
}

export default function CVsPage() {
  const [cvs, setCvs] = useState<CV[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/cvs')
      .then(r => r.json())
      .then(d => { setCvs(d.cvs ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function activate(id: string) {
    setActivating(id)
    const res = await fetch(`/api/cvs/${id}/activate`, { method: 'PATCH' })
    if (res.ok) {
      setCvs(prev => prev.map(cv => ({ ...cv, is_active: cv.id === id })))
    }
    setActivating(null)
  }

  async function deleteCv(id: string) {
    setDeleting(id)
    setError('')
    const res = await fetch(`/api/cvs/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCvs(prev => prev.filter(cv => cv.id !== id))
    } else {
      const data = await res.json()
      setError(data.error ?? 'Delete failed')
    }
    setDeleting(null)
  }

  if (loading) return (
    <div className="max-w-2xl mx-auto px-4 py-10 text-gray-400">Loading…</div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">My CVs</h1>
        <p className="text-gray-500">The active CV is used for all job analyses.</p>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">{error}</div>
      )}

      {cvs.length === 0 && (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-gray-500">No CVs uploaded yet.</p>
          <Link href="/dashboard" className="mt-4 inline-block text-blue-600 hover:underline text-sm">
            Go to dashboard to upload →
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {cvs.map(cv => (
          <div
            key={cv.id}
            className={`bg-white border-2 rounded-2xl p-5 flex items-center gap-4 transition-all ${cv.is_active ? 'border-blue-300 bg-blue-50/30' : 'border-gray-100'}`}
          >
            <div className="text-3xl flex-shrink-0">📄</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-gray-900 text-sm truncate">
                  {cv.filename || 'Pasted CV'}
                </span>
                {cv.is_active && (
                  <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(cv.uploaded_at).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
                {' · '}{(cv.content?.length ?? 0).toLocaleString()} characters
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {!cv.is_active && (
                <button
                  onClick={() => activate(cv.id)}
                  disabled={activating === cv.id}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold"
                >
                  {activating === cv.id ? 'Setting…' : 'Set active'}
                </button>
              )}
              <button
                onClick={() => deleteCv(cv.id)}
                disabled={deleting === cv.id || cvs.length <= 1}
                title={cvs.length <= 1 ? 'Cannot delete your only CV' : 'Delete this CV'}
                className="text-xs text-red-500 hover:text-red-700 px-2 py-1.5 rounded-lg hover:bg-red-50 disabled:opacity-30 font-semibold transition-colors"
              >
                {deleting === cv.id ? '…' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
          ← Upload a new CV from the dashboard
        </Link>
      </div>
    </div>
  )
}
