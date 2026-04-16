import { createClient } from '@/lib/supabase/server'
import JobAnalysisPanel from '@/components/job-analysis-panel'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: job } = await supabase.from('jobs').select('*').eq('id', id).single()
  if (!job) notFound()

  const { data: analysis } = await supabase
    .from('job_analyses')
    .select('*')
    .eq('user_id', user!.id)
    .eq('job_id', id)
    .single()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/search" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">← Back to search</Link>

      <div className="flex gap-6 items-start">
        {/* Left: job description */}
        <div className="flex-[1.5]">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {job.company} · {job.location}
              {job.salary_min && ` · £${(job.salary_min / 1000).toFixed(0)}k–£${(job.salary_max / 1000).toFixed(0)}k`}
            </p>
            <div className="mt-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {job.description}
            </div>
            <a
              href={job.url} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-blue-600 hover:underline"
            >
              View on Adzuna ↗
            </a>
          </div>
        </div>

        {/* Right: analysis panel */}
        <div className="w-72 flex-shrink-0">
          <JobAnalysisPanel job={job} initialAnalysis={analysis ?? null} />
        </div>
      </div>
    </div>
  )
}
