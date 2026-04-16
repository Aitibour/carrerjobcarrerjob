'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function BuilderPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState(false)

  async function generate() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/jobs/${jobId}/build-cv`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setContent(data.tailoredCV.content)
    setGenerated(true)
    setLoading(false)
  }

  function download() {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tailored-cv.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={`/jobs/${jobId}`} className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">← Back to job</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Tailored CV Builder</h1>
      <p className="text-sm text-gray-500 mb-6">Gemini will rewrite your CV optimised for this specific role.</p>

      {!generated && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-600 mb-4">Ready to generate your tailored CV?</p>
          <button
            onClick={generate} disabled={loading}
            className="bg-blue-600 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating… (this may take 10–20s)' : 'Generate tailored CV'}
          </button>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>
      )}

      {generated && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-green-600 font-medium">CV generated</p>
            <div className="flex gap-2">
              <button
                onClick={generate} disabled={loading}
                className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5"
              >
                Regenerate
              </button>
              <button
                onClick={download}
                className="text-sm bg-blue-600 text-white rounded-lg px-4 py-1.5 font-medium hover:bg-blue-700"
              >
                Download .md
              </button>
            </div>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={30}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      )}
    </div>
  )
}
