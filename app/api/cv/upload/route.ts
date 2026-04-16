import { createClient } from '@/lib/supabase/server'
import { extractText } from '@/lib/pdf-extract'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const pastedText = formData.get('text') as string | null

  let content: string

  if (file) {
    const buffer = Buffer.from(await file.arrayBuffer())
    try {
      content = await extractText(buffer, file.name)
    } catch (err: unknown) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }
  } else if (pastedText?.trim()) {
    content = pastedText.trim()
  } else {
    return NextResponse.json({ error: 'No CV content provided' }, { status: 400 })
  }

  // Mark all previous CVs inactive
  await supabase.from('cvs').update({ is_active: false }).eq('user_id', user.id)

  // Insert new active CV
  const { data, error } = await supabase.from('cvs').insert({
    user_id: user.id,
    content,
    filename: file?.name ?? 'pasted-cv.txt',
    is_active: true,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cv: data })
}
