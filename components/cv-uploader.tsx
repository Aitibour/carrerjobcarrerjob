'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function CVUploader({ hasCV }: { hasCV: boolean }) {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload')
  const [text, setText] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Job search fields
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')

  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function submit(file?: File) {
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const formData = new FormData()
      if (file) formData.append('file', file)
      else formData.append('text', text)

      const res = await fetch('/api/cv/upload', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) { setError(data.error ?? 'Upload failed. Please try again.'); return }
      setSuccess(true)
      router.refresh()
    } catch {
      setError('Something went wrong. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams({ title, location })
    router.push(`/search?${params}`)
  }

  return (
    <div className="space-y-4">
      {/* CV Uploader */}
      <div className="bg-white border-2 border-gray-100 rounded-3xl p-6">
        <h2 className="font-bold text-gray-900 mb-1">{hasCV ? 'Update your CV' : 'Upload your CV'}</h2>
        <p className="text-sm text-gray-400 mb-5">Required to search and analyze jobs</p>

        <div className="flex gap-2 mb-5">
          {(['upload', 'paste'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-sm px-4 py-2 rounded-xl font-semibold transition-colors ${
                mode === m ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {m === 'upload' ? '📎 Upload file' : '📋 Paste text'}
            </button>
          ))}
        </div>

        {mode === 'upload' ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) submit(f) }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
              dragging ? 'border-blue-400 bg-blue-50 scale-[1.01]' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="text-4xl mb-3">📄</div>
            <p className="text-sm font-semibold text-gray-700">Drag & drop your CV or <span className="text-blue-600">browse</span></p>
            <p className="text-xs text-gray-400 mt-1">.pdf · .txt · .md supported</p>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.md" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) submit(f) }} />
          </div>
        ) : (
          <div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste your CV text here…"
              rows={10}
              className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors font-mono resize-none"
            />
            <button
              onClick={() => submit()}
              disabled={!text.trim() || loading}
              className="mt-3 bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all"
            >
              {loading ? 'Saving…' : 'Save CV'}
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-3 bg-red-50 px-4 py-2 rounded-xl">{error}</p>}
        {success && <p className="text-sm text-emerald-600 mt-3 bg-emerald-50 px-4 py-2 rounded-xl font-semibold">✓ CV saved successfully!</p>}
        {loading && mode === 'upload' && <p className="text-sm text-gray-400 mt-3 text-center">Processing your CV…</p>}
      </div>

      {/* Quick Job Search */}
      <div className="bg-gradient-to-br from-blue-50 to-violet-50 border-2 border-blue-100 rounded-3xl p-6">
        <h2 className="font-bold text-gray-900 mb-1">Search for jobs</h2>
        <p className="text-sm text-gray-400 mb-5">Find matching roles and get your AI score instantly</p>

        <form onSubmit={handleSearch} className="flex flex-col gap-3">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Job title, e.g. Product Manager"
              required
              className="w-full border-2 border-white rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors bg-white shadow-sm"
            />
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📍</span>
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Location, e.g. London"
              required
              className="w-full border-2 border-white rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors bg-white shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={!hasCV}
            className="bg-blue-600 text-white rounded-xl px-5 py-3 text-sm font-bold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-blue-200"
          >
            {hasCV ? 'Find matching jobs →' : 'Upload your CV first'}
          </button>
        </form>
      </div>
    </div>
  )
}
