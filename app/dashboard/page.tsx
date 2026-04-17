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

  const { count: savedCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .eq('status', 'saved')

  const { count: appliedCount } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user!.id)
    .neq('status', 'saved')

  const firstName = user?.email?.split('@')[0] ?? 'there'

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-1">
          Hey, {firstName} 👋
        </h1>
        <p className="text-gray-500">
          {cv ? 'Your CV is ready. Start searching for jobs.' : 'Upload your CV to get started.'}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'CV Status', value: cv ? 'Active' : 'Missing', color: cv ? 'text-emerald-600' : 'text-amber-600', bg: cv ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200' },
          { label: 'Saved Jobs', value: savedCount ?? 0, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Applications', value: appliedCount ?? 0, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200' },
        ].map(stat => (
          <div key={stat.label} className={`${stat.bg} border rounded-2xl p-5`}>
            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* CV card */}
      {cv ? (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-2xl">📄</div>
            <div>
              <p className="font-bold text-gray-900">{cv.filename}</p>
              <p className="text-sm text-gray-500">
                Uploaded {new Date(cv.uploaded_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <Link
            href="/search"
            className="bg-blue-600 text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200"
          >
            Search jobs →
          </Link>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <p className="text-sm text-amber-800 font-medium">
            Upload your CV below to unlock job search and AI match scoring.
          </p>
        </div>
      )}

      {/* Uploader */}
      <CVUploader hasCV={!!cv} />

      {/* Quick links */}
      {cv && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/search', icon: '🔍', label: 'Search Jobs' },
            { href: '/saved', icon: '🔖', label: 'Saved Jobs' },
            { href: '/tracker', icon: '📊', label: 'Tracker' },
            { href: '/cvs', icon: '✨', label: 'My CVs' },
          ].map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="card-hover bg-white border border-gray-200 rounded-2xl p-4 text-center hover:border-blue-200"
            >
              <div className="text-2xl mb-2">{link.icon}</div>
              <div className="text-sm font-semibold text-gray-700">{link.label}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
