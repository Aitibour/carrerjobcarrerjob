import { createClient } from '@/lib/supabase/server'
import { buildTailoredCV } from '@/lib/gemini'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get CV
  const { data: cv } = await supabase
    .from('cvs').select('content').eq('user_id', user.id).eq('is_active', true).single()
  if (!cv) return NextResponse.json({ error: 'No active CV found' }, { status: 400 })

  // Get job
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // Run Gemini
  let content: string
  try {
    content = await buildTailoredCV(cv.content, `${job.title} at ${job.company}\n${job.description}`)
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }

  // Store tailored CV
  const { data: tailoredCV, error } = await supabase
    .from('tailored_cvs')
    .insert({ user_id: user.id, job_id: jobId, content })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tailoredCV })
}
