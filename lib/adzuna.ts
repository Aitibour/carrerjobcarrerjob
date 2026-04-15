import type { AdzunaResult, Job } from '@/types'

interface SearchParams {
  title: string
  location: string
  jobType?: 'full_time' | 'part_time' | 'contract'
  resultsPerPage?: number
}

export async function searchAdzuna(params: SearchParams): Promise<Omit<Job, 'id' | 'cached_at'>[]> {
  const { title, location, jobType, resultsPerPage = 20 } = params

  const country = 'gb' // default UK; extend later per location
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`)
  url.searchParams.set('app_id', process.env.ADZUNA_APP_ID!)
  url.searchParams.set('app_key', process.env.ADZUNA_API_KEY!)
  url.searchParams.set('what', title)
  url.searchParams.set('where', location)
  url.searchParams.set('results_per_page', String(resultsPerPage))
  url.searchParams.set('content-type', 'application/json')

  if (jobType === 'full_time') url.searchParams.set('full_time', '1')
  if (jobType === 'part_time') url.searchParams.set('part_time', '1')
  if (jobType === 'contract') url.searchParams.set('contract', '1')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Adzuna API error: ${res.status}`)

  const data = await res.json()
  return (data.results as AdzunaResult[]).map(normalise)
}

function normalise(r: AdzunaResult): Omit<Job, 'id' | 'cached_at'> {
  return {
    adzuna_id: r.id,
    title: r.title,
    company: r.company.display_name,
    location: r.location.display_name,
    salary_min: r.salary_min ?? null,
    salary_max: r.salary_max ?? null,
    description: r.description,
    url: r.redirect_url,
    job_type: r.contract_type ?? null,
    remote: /remote/i.test(r.title + r.location.display_name),
    posted_at: r.created,
  }
}
