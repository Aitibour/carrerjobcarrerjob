import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: applications } = await supabase
    .from('applications')
    .select('*, jobs(*)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const jobIds = (applications ?? []).map((a: { job_id: string }) => a.job_id)

  const { data: analyses } = jobIds.length
    ? await supabase
        .from('job_analyses')
        .select('*')
        .eq('user_id', user.id)
        .in('job_id', jobIds)
    : { data: [] }

  const analysisMap = Object.fromEntries(
    (analyses ?? []).map((a: { job_id: string }) => [a.job_id, a])
  )

  return NextResponse.json({
    applications: (applications ?? []).map((a: { job_id: string }) => ({
      ...a,
      analysis: analysisMap[a.job_id] ?? null,
    })),
  })
}
