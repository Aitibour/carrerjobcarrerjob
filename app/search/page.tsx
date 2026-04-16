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
    const unanalyzed = jobs.filter(j => !j.analysis)
    await Promise.all(unanalyzed.map(j => fetch(`/api/jobs/${j.id}/analyze`, { method: 'POST' })))
    // Refresh results
    const params = new URLSearchParams({ title, location })
    if (jobType) params.set('jobType', jobType)
    const res = await fetch(`/api/jobs/search?${params}`)
    const data = await res.json()
    if (res.ok) setJobs(data.jobs)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Find jobs</h1>

      <form onSubmit={handleSearch} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-3 flex-wrap">
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Job title, e.g. Product Manager"
          required
          className="flex-[2] min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          value={location} onChange={e => setLocation(e.target.value)}
          placeholder="Location, e.g. London"
          required
          className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={jobType} onChange={e => setJobType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any type</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
        </select>
        <button
          type="submit" disabled={loading}
          className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

      {searched && !loading && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{jobs.length} jobs found{jobs.length > 0 && ' · Analyze to see match grades'}</p>
          {jobs.some(j => !j.analysis) && (
            <button
              onClick={analyzeAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Analyze all
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {jobs.map(job => (
          <JobCard key={job.id} job={job} analysis={job.analysis} />
        ))}
      </div>
    </div>
  )
}
