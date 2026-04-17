'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const AUTH_LINKS = [
  { href: '/search', label: 'Search' },
  { href: '/saved', label: 'Saved' },
  { href: '/cvs', label: 'My CVs' },
  { href: '/tracker', label: 'Tracker' },
]

export default function Nav({ userEmail }: { userEmail: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // Landing page nav (not logged in)
  if (!userEmail) {
    if (pathname === '/') {
      return (
        <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 flex items-center h-16 justify-between">
            <Link href="/" className="font-black text-blue-600 text-xl tracking-tight">
              Radar<span className="text-gray-900">Jobs</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-semibold text-gray-600 hover:text-gray-900 px-4 py-2 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="text-sm font-bold bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-all hover:shadow-lg hover:shadow-blue-200"
              >
                Get started
              </Link>
            </div>
          </div>
        </nav>
      )
    }
    return null
  }

  // Logged-in nav
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-6">
        <Link href="/dashboard" className="font-black text-blue-600 text-lg tracking-tight">
          Radar<span className="text-gray-900">Jobs</span>
        </Link>

        <div className="flex items-center gap-1 flex-1">
          {AUTH_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith(link.href)
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="text-xs text-gray-400 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors max-w-32 truncate"
          >
            {userEmail}
          </Link>
          <button
            onClick={handleSignOut}
            className="text-xs font-semibold text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
