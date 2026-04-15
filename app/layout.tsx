import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/nav'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RadarJobs — AI-powered job matching',
  description: 'Upload your CV, search jobs, get AI match scores, and build tailored CVs.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 text-gray-900`}>
        <Nav userEmail={user?.email ?? null} />
        <main>{children}</main>
      </body>
    </html>
  )
}
