'use client'
import { useState } from 'react'
import type { Job, Analysis } from '@/types'
import Link from 'next/link'

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-green-100 text-green-700',
  'A':  'bg-green-100 text-green-700',
  'B+': 'bg-emerald-100 text-emerald-700',
  'B':  'bg-yellow-100 text-yellow-700',
  'C':  'bg-orange-100 text-orange-700',
  'D':  'bg-red-100 text-red-700',
  'F':  'bg-red-100 text-red-700',
}

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'Salary not listed'
  if (min && max) return `£${(min / 1000).toFixed(0)}k–£${(max / 1000).toFixed(0)}k`
  if (min) return `From £${(min / 1000).toFixed(0)}k`
  return `Up to £${(max! / 1000).toFixed(0)}k`
}

interface JobCardProps {
  job: Job
  analysis: Analysis | null
}

export default function JobCard({ job, analysis }: JobCardProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(analysis)
  const [saved, setSaved] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')

  async function handleAnalyze() {
    setAnalyzing(true)
    setAnalyzeError('')
    try {
      const res = await fetch(`/api/jobs/${job.id}/analyze`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { setAnalyzeError(data.error ?? `Error ${res.status}`); return }
      setCurrentAnalysis(data.analysis)
    } catch {
      setAnalyzeError('Network error — try again')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSave() {
    const method = saved ? 'DELETE' : 'POST'
    const res = await fetch(`/api/jobs/${job.id}/save`, { method })
    if (res.ok) setSaved(prev => !prev)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
      {/* Grade badge */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${currentAnalysis ? GRADE_COLORS[currentAnalysis.grade] : 'bg-gray-100 text-gray-400'}`}>
        {currentAnalysis ? currentAnalysis.grade : '—'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={`/jobs/${job.id}`} className="font-semibold text-gray-900 hover:text-blue-600 text-sm leading-tight block">
          {job.title}
        </Link>
        <p className="text-xs text-gray-500 mt-0.5">
          {job.company} · {job.location} · {formatSalary(job.salary_min, job.salary_max)}
          {job.remote && <span className="ml-1 bg-blue-50 text-blue-600 text-xs px-1.5 py-0.5 rounded">Remote</span>}
        </p>

        {currentAnalysis && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {currentAnalysis.matched_keywords.slice(0, 4).map(kw => (
              <span key={kw} className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded">{kw}</span>
            ))}
            {currentAnalysis.missing_keywords.slice(0, 2).map(kw => (
              <span key={kw} className="bg-amber-50 text-amber-700 text-xs px-1.5 py-0.5 rounded">⚠ {kw}</span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
        {currentAnalysis && (
          <span className="text-xs font-medium text-gray-600">{currentAnalysis.score}%</span>
        )}
        {!currentAnalysis && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing ? 'Analyzing…' : 'Analyze'}
          </button>
        )}
        {analyzeError && (
          <span className="text-xs text-red-500 max-w-24 text-right leading-tight">{analyzeError}</span>
        )}
        <button
          onClick={handleSave}
          className={`text-xs px-3 py-1.5 rounded-lg border ${saved ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
        <Link href={`/jobs/${job.id}`} className="text-xs text-gray-500 hover:text-gray-700 underline">
          View
        </Link>
      </div>
    </div>
  )
}
