'use client'
import { useState } from 'react'
import JobCard from '@/components/job-card'
import type { Job, Analysis } from '@/types'

type JobWithAnalysis = Job & { analysis: Analysis | null }

export default function SearchPage() {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [jobType, setJobType] = useState('')
  const [jobs, setJobs] = useState<JobWithAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSearched(true)

    const params = new URLSearchParams({ title, location })
    if (jobType) params.set('jobType', jobType)

    const res = await fetch(`/api/jobs/search?${params}`)
    const data = await res.json()

    if (!res.ok) { setError(data.error); setLoading(false); return }
    setJobs(data.jobs)
    setLoading(false)
  }

  async function analyzeAll() {
    setAnalyzing(true)
    const unanalyzed = jobs.filter(j => !j.analysis)
    await Promise.all(unanalyzed.map(j => fetch(`/api/jobs/${j.id}/analyze`, { method: 'POST' })))
    const params = new URLSearchParams({ title, location })
    if (jobType) params.set('jobType', jobType)
    const res = await fetch(`/api/jobs/search?${params}`)
    const data = await res.json()
    if (res.ok) setJobs(data.jobs)
    setAnalyzing(false)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Find your next job</h1>
        <p className="text-gray-500">Search live listings and get AI match scores for your CV</p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="bg-white border-2 border-gray-100 rounded-3xl p-5 mb-8 shadow-sm">
        <div className="flex gap-3 flex-wrap">
          <div className="flex-[2] min-w-48 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Job title, e.g. Product Manager"
              required
              className="w-full border-2 border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <div className="flex-1 min-w-32 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-base">📍</span>
            <input
              value={location} onChange={e => setLocation(e.target.value)}
              placeholder="Location, e.g. London"
              required
              className="w-full border-2 border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>
          <select
            value={jobType} onChange={e => setJobType(e.target.value)}
            className="border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors bg-white text-gray-600"
          >
            <option value="">Any type</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
          </select>
          <button
            type="submit" disabled={loading}
            className="bg-blue-600 text-white rounded-xl px-6 py-3 text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all hover:shadow-lg hover:shadow-blue-200 whitespace-nowrap"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Searching…
              </span>
            ) : 'Search jobs'}
          </button>
        </div>
      </form>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl px-5 py-4 mb-6 flex items-center gap-2">
          <span>⚠️</span> {error}
        </div>
      )}

      {searched && !loading && (
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="font-bold text-gray-900">{jobs.length} jobs found</span>
            {jobs.length > 0 && (
              <span className="text-gray-400 text-sm ml-2">· Click Analyze to see your match grade</span>
            )}
          </div>
          {jobs.some(j => !j.analysis) && (
            <button
              onClick={analyzeAll}
              disabled={analyzing}
              className="text-sm bg-violet-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-violet-700 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {analyzing ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Analyzing…
                </>
              ) : '🎯 Analyze all'}
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {searched && !loading && jobs.length === 0 && !error && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p className="font-semibold text-gray-600">No jobs found</p>
          <p className="text-sm mt-1">Try a different title or location</p>
        </div>
      )}

      {/* Initial state */}
      {!searched && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4 animate-float">🎯</div>
          <p className="font-semibold text-gray-600">Search for jobs above</p>
          <p className="text-sm mt-1">We&apos;ll match them against your CV and grade each one</p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {jobs.map(job => (
          <JobCard key={job.id} job={job} analysis={job.analysis} />
        ))}
      </div>
    </div>
  )
}
