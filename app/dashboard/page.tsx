import { createClient } from '@/lib/supabase/server'
import CVUploader from '@/components/cv-uploader'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: cv } = await supabase
    .from('cvs')
    .select('filename, uploaded_at')
    .eq('user_id', user!.id)
    .eq('is_active', true)
    .single()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {cv && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-green-800">CV active: {cv.filename}</p>
            <p className="text-xs text-green-600">Uploaded {new Date(cv.uploaded_at).toLocaleDateString()}</p>
          </div>
          <Link
            href="/search"
            className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            Search jobs →
          </Link>
        </div>
      )}

      <CVUploader hasCV={!!cv} />
    </div>
  )
}
