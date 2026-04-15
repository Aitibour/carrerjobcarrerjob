'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const LINKS = [
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

  if (!userEmail) return null

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex items-center h-14 gap-6">
        <Link href="/dashboard" className="font-bold text-blue-600 text-sm">RadarJobs</Link>

        <div className="flex items-center gap-4 flex-1">
          {LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium ${
                pathname.startsWith(link.href)
                  ? 'text-blue-600 border-b-2 border-blue-600 pb-0.5'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/settings" className="text-xs text-gray-500 hover:text-gray-700">{userEmail}</Link>
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  )
}
