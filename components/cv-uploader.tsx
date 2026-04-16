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
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function submit(file?: File) {
    setLoading(true)
    setError('')
    const formData = new FormData()
    if (file) formData.append('file', file)
    else formData.append('text', text)

    const res = await fetch('/api/cv/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) { setError(data.error); setLoading(false); return }
    setSuccess(true)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-1">{hasCV ? 'Update your CV' : 'Upload your CV'}</h2>
      <p className="text-sm text-gray-500 mb-4">Required to search and analyze jobs</p>

      <div className="flex gap-2 mb-4">
        {(['upload', 'paste'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-sm px-3 py-1.5 rounded-lg ${mode === m ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {m === 'upload' ? 'Upload file' : 'Paste text'}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) submit(f) }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <p className="text-sm text-gray-600">Drag & drop your CV or <span className="text-blue-600 font-medium">browse</span></p>
          <p className="text-xs text-gray-400 mt-1">.pdf, .txt, .md supported</p>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.md" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) submit(f) }} />
        </div>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your CV text here…"
            rows={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
          />
          <button
            onClick={() => submit()}
            disabled={!text.trim() || loading}
            className="mt-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save CV'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {success && <p className="text-sm text-green-600 mt-3">CV saved successfully!</p>}
      {loading && mode === 'upload' && <p className="text-sm text-gray-500 mt-3">Processing…</p>}
    </div>
  )
}
