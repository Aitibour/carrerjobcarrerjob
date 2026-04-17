import type { AdzunaResult, Job } from '@/types'

interface SearchParams {
  title: string
  location: string
  jobType?: 'full_time' | 'part_time' | 'contract'
  resultsPerPage?: number
}

// Map location keywords → Adzuna country codes
const COUNTRY_MAP: Record<string, string> = {
  // North America
  usa: 'us', 'united states': 'us', america: 'us',
  canada: 'ca', toronto: 'ca', vancouver: 'ca', montreal: 'ca', calgary: 'ca', ottawa: 'ca',
  // UK
  uk: 'gb', 'united kingdom': 'gb', england: 'gb', london: 'gb', manchester: 'gb',
  birmingham: 'gb', leeds: 'gb', glasgow: 'gb', edinburgh: 'gb',
  // Australia
  australia: 'au', sydney: 'au', melbourne: 'au', brisbane: 'au', perth: 'au',
  // Germany
  germany: 'de', berlin: 'de', munich: 'de', hamburg: 'de', frankfurt: 'de',
  // France
  france: 'fr', paris: 'fr', lyon: 'fr', marseille: 'fr',
  // Netherlands
  netherlands: 'nl', amsterdam: 'nl', rotterdam: 'nl', 'the hague': 'nl',
  // India
  india: 'in', mumbai: 'in', delhi: 'in', bangalore: 'in', hyderabad: 'in', chennai: 'in',
  // New Zealand
  'new zealand': 'nz', auckland: 'nz', wellington: 'nz',
  // South Africa
  'south africa': 'za', johannesburg: 'za', capetown: 'za', 'cape town': 'za',
  // Brazil
  brazil: 'br', 'são paulo': 'br', 'sao paulo': 'br', 'rio de janeiro': 'br',
  // Singapore
  singapore: 'sg',
  // Poland
  poland: 'pl', warsaw: 'pl', krakow: 'pl',
}

function detectCountry(location: string): string {
  const lower = location.toLowerCase()
  for (const [keyword, code] of Object.entries(COUNTRY_MAP)) {
    if (lower.includes(keyword)) return code
  }
  return 'gb' // default UK
}

export async function searchAdzuna(params: SearchParams): Promise<Omit<Job, 'id' | 'cached_at'>[]> {
  const { title, location, jobType, resultsPerPage = 20 } = params
  const country = detectCountry(location)

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
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Adzuna API error (${res.status}): ${body.slice(0, 200)}`)
  }

  const data = await res.json()
  const results = data.results as AdzunaResult[]
  return results.map(r => normalise(r, country))
}

function normalise(r: AdzunaResult, country: string): Omit<Job, 'id' | 'cached_at'> {
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
