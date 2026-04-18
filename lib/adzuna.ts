import type { AdzunaResult, Job } from '@/types'

interface SearchParams {
  title: string
  location: string
  jobType?: 'full_time' | 'part_time' | 'contract'
  postedWithin?: number
  resultsPerPage?: number
}

const COUNTRY_MAP: Record<string, string> = {
  // North America
  usa: 'us', 'united states': 'us', america: 'us', 'new york': 'us', 'san francisco': 'us',
  chicago: 'us', boston: 'us', seattle: 'us', austin: 'us', denver: 'us', miami: 'us',
  canada: 'ca', toronto: 'ca', vancouver: 'ca', montreal: 'ca', calgary: 'ca', ottawa: 'ca',
  // UK
  uk: 'gb', 'united kingdom': 'gb', england: 'gb', london: 'gb', manchester: 'gb',
  birmingham: 'gb', leeds: 'gb', glasgow: 'gb', edinburgh: 'gb', liverpool: 'gb',
  // Australia
  australia: 'au', sydney: 'au', melbourne: 'au', brisbane: 'au', perth: 'au', adelaide: 'au',
  // Germany
  germany: 'de', berlin: 'de', munich: 'de', hamburg: 'de', frankfurt: 'de', cologne: 'de',
  // France
  france: 'fr', paris: 'fr', lyon: 'fr', marseille: 'fr', toulouse: 'fr',
  // Netherlands
  netherlands: 'nl', amsterdam: 'nl', rotterdam: 'nl', 'the hague': 'nl', utrecht: 'nl',
  // India
  india: 'in', mumbai: 'in', delhi: 'in', bangalore: 'in', hyderabad: 'in', chennai: 'in', pune: 'in',
  // New Zealand
  'new zealand': 'nz', auckland: 'nz', wellington: 'nz',
  // South Africa
  'south africa': 'za', johannesburg: 'za', 'cape town': 'za', durban: 'za',
  // Brazil
  brazil: 'br', 'sao paulo': 'br', 'rio de janeiro': 'br',
  // Singapore
  singapore: 'sg',
  // Poland
  poland: 'pl', warsaw: 'pl', krakow: 'pl',
  // Italy
  italy: 'it', rome: 'it', milan: 'it',
  // Spain
  spain: 'es', madrid: 'es', barcelona: 'es',
}

const WORLDWIDE_COUNTRIES = ['us', 'ca']

function isWorldwide(location: string): boolean {
  return /worldwid|global|remote|anywhere|international/i.test(location)
}

function detectCountry(location: string): string {
  const lower = location.toLowerCase()
  for (const [keyword, code] of Object.entries(COUNTRY_MAP)) {
    if (lower.includes(keyword)) return code
  }
  return 'us'
}

export async function searchAdzuna(params: SearchParams): Promise<Omit<Job, 'id' | 'cached_at'>[]> {
  const { title, location, jobType, postedWithin, resultsPerPage = 20 } = params

  if (isWorldwide(location)) {
    return searchMultipleCountries(title, WORLDWIDE_COUNTRIES, jobType, postedWithin, Math.ceil(resultsPerPage / 2))
  }

  const country = detectCountry(location)
  const results = await fetchCountry(title, location, country, jobType, postedWithin, resultsPerPage)

  // If primary country returns < 5 results, supplement with worldwide
  if (results.length < 5) {
    const extra = await searchMultipleCountries(title, WORLDWIDE_COUNTRIES.filter(c => c !== country), jobType, postedWithin, 5)
    const seen = new Set(results.map(r => r.adzuna_id))
    return [...results, ...extra.filter(r => !seen.has(r.adzuna_id))].slice(0, resultsPerPage)
  }

  return results
}

async function searchMultipleCountries(
  title: string,
  countries: string[],
  jobType?: 'full_time' | 'part_time' | 'contract',
  postedWithin?: number,
  perCountry = 5,
): Promise<Omit<Job, 'id' | 'cached_at'>[]> {
  const settled = await Promise.allSettled(
    countries.map(c => fetchCountry(title, '', c, jobType, postedWithin, perCountry))
  )
  const seen = new Set<string>()
  const merged: Omit<Job, 'id' | 'cached_at'>[] = []
  for (const r of settled) {
    if (r.status === 'fulfilled') {
      for (const job of r.value) {
        if (!seen.has(job.adzuna_id)) {
          seen.add(job.adzuna_id)
          merged.push(job)
        }
      }
    }
  }
  return merged
}

async function fetchCountry(
  title: string,
  location: string,
  country: string,
  jobType?: 'full_time' | 'part_time' | 'contract',
  postedWithin?: number,
  resultsPerPage = 20,
): Promise<Omit<Job, 'id' | 'cached_at'>[]> {
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`)
  url.searchParams.set('app_id', process.env.ADZUNA_APP_ID!)
  url.searchParams.set('app_key', process.env.ADZUNA_API_KEY!)
  url.searchParams.set('what', title)
  if (location) url.searchParams.set('where', location)
  url.searchParams.set('results_per_page', String(resultsPerPage))
  url.searchParams.set('content-type', 'application/json')
  if (jobType === 'full_time') url.searchParams.set('full_time', '1')
  if (jobType === 'part_time') url.searchParams.set('part_time', '1')
  if (jobType === 'contract') url.searchParams.set('contract', '1')
  if (postedWithin) url.searchParams.set('max_days_old', String(postedWithin))

  const res = await fetch(url.toString())
  if (!res.ok) return []

  const data = await res.json()
  return ((data.results ?? []) as AdzunaResult[]).map(r => normalise(r))
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
