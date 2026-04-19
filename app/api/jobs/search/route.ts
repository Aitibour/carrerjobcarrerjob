import { createClient } from '@/lib/supabase/server'
import { searchAdzuna } from '@/lib/adzuna'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check user has a CV
  const { data: cv } = await supabase.from('cvs').select('id').eq('user_id', user.id).eq('is_active', true).single()
  if (!cv) return NextResponse.json({ error: 'Upload a CV before searching' }, { status: 400 })

  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title')?.trim()
  const location = searchParams.get('location')?.trim()
  const jobType = searchParams.get('jobType') as 'full_time' | 'part_time' | 'contract' | undefined
  const postedWithinRaw = searchParams.get('postedWithin')
  const postedWithin = postedWithinRaw ? parseInt(postedWithinRaw, 10) : undefined
  const remoteOnly = searchParams.get('remote') === '1'

  if (!title || !location) return NextResponse.json({ error: 'title and location are required' }, { status: 400 })

  // Fetch from Adzuna
  let rawJobs
  try {
    rawJobs = await searchAdzuna({ title, location, jobType, postedWithin })
    if (remoteOnly) rawJobs = rawJobs.filter(j => j.remote)
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }

  // Upsert jobs into DB (cache them)
  const { error: upsertError } = await supabase.from('jobs').upsert(
    rawJobs.map(j => ({ ...j, cached_at: new Date().toISOString() })),
    { onConflict: 'adzuna_id', ignoreDuplicates: false }
  )
  if (upsertError) console.error('Job upsert error:', upsertError)

  // Fetch back from DB (with IDs) + any existing analyses for this user
  const { data: jobs } = await supabase
    .from('jobs')
    .select('*')
    .in('adzuna_id', rawJobs.map(j => j.adzuna_id))
    .order('cached_at', { ascending: false })

  // Get existing analyses for this user for these jobs
  const jobIds = (jobs ?? []).map(j => j.id)
  const { data: analyses } = await supabase
    .from('job_analyses')
    .select('*')
    .eq('user_id', user.id)
    .in('job_id', jobIds)

  const analysisMap = Object.fromEntries((analyses ?? []).map(a => [a.job_id, a]))

  return NextResponse.json({
    jobs: (jobs ?? []).map(j => ({ ...j, analysis: analysisMap[j.id] ?? null })),
  })
}
