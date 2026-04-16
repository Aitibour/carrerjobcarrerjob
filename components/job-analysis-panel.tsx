'use client'
import { useState } from 'react'
import type { Analysis, Job } from '@/types'
import Link from 'next/link'

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-green-600', 'A': 'text-green-600',
  'B+': 'text-emerald-600', 'B': 'text-yellow-600',
  'C':  'text-orange-600', 'D': 'text-red-600', 'F': 'text-red-600',
}

export default function JobAnalysisPanel({ job, initialAnalysis }: { job: Job; initialAnalysis: Analysis | null }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  async function runAnalysis() {
    setLoading(true)
    const res = await fetch(`/api/jobs/${job.id}/analyze`, { method: 'POST' })
    if (res.ok) setAnalysis((await res.json()).analysis)
    setLoading(false)
  }

  async function handleSave() {
    const method = saved ? 'DELETE' : 'POST'
    const res = await fetch(`/api/jobs/${job.id}/save`, { method })
    if (res.ok) setSaved(prev => !prev)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Grade card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
        {analysis ? (
          <>
            <div className={`text-5xl font-black ${GRADE_COLORS[analysis.grade]}`}>{analysis.grade}</div>
            <p className="text-sm text-gray-500 mt-1">{analysis.score}% match with your CV</p>
            <p className="text-xs text-gray-400 mt-2 italic">&ldquo;{analysis.verdict}&rdquo;</p>
          </>
        ) : (
          <div>
            <div className="text-4xl font-black text-gray-200">—</div>
            <p className="text-sm text-gray-500 mt-1">Not yet analyzed</p>
          </div>
        )}
        <div className="flex gap-2 mt-4 justify-center">
          {!analysis && (
            <button
              onClick={runAnalysis} disabled={loading}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing…' : 'Analyze match'}
            </button>
          )}
          {analysis && (
            <Link
              href={`/builder/${job.id}`}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              Build tailored CV
            </Link>
          )}
          <button
            onClick={handleSave}
            className={`border rounded-lg px-4 py-2 text-sm font-medium ${saved ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            {saved ? '✓ Saved' : 'Save job'}
          </button>
        </div>
      </div>

      {analysis && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Strengths</h3>
            <ul className="space-y-1">
              {analysis.strengths.map((s, i) => <li key={i} className="text-sm text-gray-700">✓ {s}</li>)}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Gaps</h3>
            <ul className="space-y-1">
              {analysis.gaps.map((g, i) => <li key={i} className="text-sm text-gray-700">⚠ {g}</li>)}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Keywords matched</h3>
            <div className="flex flex-wrap gap-1.5">
              {analysis.matched_keywords.map(kw => (
                <span key={kw} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{kw}</span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Keywords missing</h3>
            <div className="flex flex-wrap gap-1.5">
              {analysis.missing_keywords.map(kw => (
                <span key={kw} className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded">{kw}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
