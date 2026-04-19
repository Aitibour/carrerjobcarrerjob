import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: cvs } = await supabase
    .from('cvs')
    .select('id, filename, uploaded_at, is_active, content')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })

  return NextResponse.json({ cvs: cvs ?? [] })
}
