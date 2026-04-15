# RadarJobs — Core Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core RadarJobs loop — auth, CV upload, Adzuna job search, Gemini match analysis, and tailored CV builder — deployed on Netlify.

**Architecture:** Next.js 14 App Router on Netlify (`@netlify/plugin-nextjs`). Supabase handles auth (Google OAuth + email/password), PostgreSQL, and file storage. All Adzuna and Gemini calls are server-side in Route Handlers. Analyses are cached per user+job to protect free tier quotas.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Supabase (`@supabase/ssr`), Google Gemini (`@google/generative-ai`), Adzuna REST API, `pdf-parse`, `@netlify/plugin-nextjs`, Jest

---

## File Map

```
radarjobs/
├── package.json
├── next.config.ts
├── netlify.toml
├── tailwind.config.ts
├── tsconfig.json
├── .env.local.example
├── .gitignore
├── jest.config.ts
├── jest.setup.ts
│
├── supabase/
│   └── migrations/
│       └── 001_initial.sql
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts          # Browser Supabase client (singleton)
│   │   └── server.ts          # Server-side Supabase client (per-request)
│   ├── gemini.ts              # Gemini client + analyzeMatch() + buildTailoredCV()
│   ├── adzuna.ts              # searchJobs() — fetches + normalises Adzuna results
│   └── pdf-extract.ts         # extractText(buffer) — PDF → plain text
│
├── types/
│   └── index.ts               # Job, Analysis, TailoredCV, Application types
│
├── middleware.ts               # Protect /dashboard /search /jobs /builder /saved /cvs /tracker /settings
│
├── app/
│   ├── globals.css
│   ├── layout.tsx             # Root layout — nav + Supabase session provider
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── callback/route.ts  # Supabase OAuth callback
│   ├── dashboard/page.tsx     # CV status card + quick search
│   ├── search/page.tsx        # Search form + job result cards
│   ├── jobs/[id]/page.tsx     # Job detail + analysis panel
│   └── builder/[jobId]/page.tsx  # Tailored CV output + download
│
│   └── api/
│       ├── cv/upload/route.ts
│       ├── jobs/search/route.ts
│       ├── jobs/[id]/analyze/route.ts
│       └── jobs/[id]/build-cv/route.ts
│
├── components/
│   ├── nav.tsx
│   ├── cv-uploader.tsx
│   ├── job-card.tsx
│   └── job-analysis-panel.tsx
│
└── __tests__/
    ├── lib/gemini.test.ts
    ├── lib/adzuna.test.ts
    └── lib/pdf-extract.test.ts
```

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `netlify.toml`, `tailwind.config.ts`, `tsconfig.json`, `.env.local.example`, `.gitignore`, `jest.config.ts`, `jest.setup.ts`, `app/globals.css`

- [ ] **Step 1: Scaffold Next.js app**

```bash
cd "c:/Users/Abdel/Documents/Claude Code/Carrer Job ==RadarJobs"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*" --yes
```

Expected output: `Success! Created ... at ...`

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/ssr @supabase/supabase-js @google/generative-ai pdf-parse
npm install --save-dev jest @types/jest ts-jest jest-environment-node @types/pdf-parse
```

- [ ] **Step 3: Install Netlify Next.js plugin**

```bash
npm install --save-dev @netlify/plugin-nextjs
```

- [ ] **Step 4: Write `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "20"
```

- [ ] **Step 5: Write `jest.config.ts`**

```typescript
import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
}

export default config
```

- [ ] **Step 6: Write `jest.setup.ts`**

```typescript
// Silence console.error in tests unless explicitly testing for it
jest.spyOn(console, 'error').mockImplementation(() => {})
```

- [ ] **Step 7: Write `.env.local.example`**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Gemini (get free key at https://aistudio.google.com)
GEMINI_API_KEY=your-gemini-api-key

# Adzuna (register at https://developer.adzuna.com)
ADZUNA_APP_ID=your-app-id
ADZUNA_API_KEY=your-api-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- [ ] **Step 8: Update `.gitignore`** (add to existing)

```
.env.local
.env.*.local
.netlify/
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Netlify + Jest config"
```

---

## Task 2: TypeScript types

**Files:**
- Create: `types/index.ts`

- [ ] **Step 1: Write types**

```typescript
// types/index.ts

export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D' | 'F'

export interface Job {
  id: string
  adzuna_id: string
  title: string
  company: string
  location: string
  salary_min: number | null
  salary_max: number | null
  description: string
  url: string
  job_type: string | null
  remote: boolean
  posted_at: string
  cached_at: string
}

export interface Analysis {
  id: string
  user_id: string
  job_id: string
  grade: Grade
  score: number
  strengths: string[]
  gaps: string[]
  matched_keywords: string[]
  missing_keywords: string[]
  verdict: string
  created_at: string
}

export interface TailoredCV {
  id: string
  user_id: string
  job_id: string
  content: string
  created_at: string
}

export interface Application {
  id: string
  user_id: string
  job_id: string
  status: 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'
  notes: string | null
  applied_at: string | null
  updated_at: string
}

export interface CV {
  id: string
  user_id: string
  content: string
  filename: string
  uploaded_at: string
  is_active: boolean
}

// Adzuna raw API response shape
export interface AdzunaResult {
  id: string
  title: string
  company: { display_name: string }
  location: { display_name: string }
  salary_min?: number
  salary_max?: number
  description: string
  redirect_url: string
  contract_type?: string
  created: string
}
```

- [ ] **Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Supabase database schema

**Files:**
- Create: `supabase/migrations/001_initial.sql`

You need a Supabase project. Create one at https://supabase.com/dashboard → New project. Copy the project URL and anon/service role keys into `.env.local`.

- [ ] **Step 1: Write migration**

```sql
-- supabase/migrations/001_initial.sql

-- CVs (one active CV per user)
create table cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  filename text not null,
  uploaded_at timestamptz default now() not null,
  is_active boolean default true not null
);

-- Jobs (cached from Adzuna, shared across users)
create table jobs (
  id uuid primary key default gen_random_uuid(),
  adzuna_id text unique not null,
  title text not null,
  company text not null,
  location text not null,
  salary_min numeric,
  salary_max numeric,
  description text not null,
  url text not null,
  job_type text,
  remote boolean default false,
  posted_at timestamptz,
  cached_at timestamptz default now() not null
);

-- Gemini match analyses (cached per user+job)
create table job_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete cascade not null,
  grade varchar(2) not null,
  score integer not null check (score between 0 and 100),
  strengths text[] not null default '{}',
  gaps text[] not null default '{}',
  matched_keywords text[] not null default '{}',
  missing_keywords text[] not null default '{}',
  verdict text not null,
  created_at timestamptz default now() not null,
  unique (user_id, job_id)
);

-- Tailored CVs (Gemini output)
create table tailored_cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- Application tracker (status=saved doubles as bookmarks)
create table applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete cascade not null,
  status text not null default 'saved'
    check (status in ('saved','applied','interview','offer','rejected')),
  notes text,
  applied_at timestamptz,
  updated_at timestamptz default now() not null,
  unique (user_id, job_id)
);

-- Row Level Security
alter table cvs enable row level security;
alter table job_analyses enable row level security;
alter table tailored_cvs enable row level security;
alter table applications enable row level security;
-- jobs table is public read (no user-specific data)
alter table jobs enable row level security;
create policy "Jobs are readable by authenticated users"
  on jobs for select to authenticated using (true);
create policy "Jobs are insertable by authenticated users"
  on jobs for insert to authenticated with check (true);

create policy "Users manage own CVs"
  on cvs for all using (auth.uid() = user_id);
create policy "Users manage own analyses"
  on job_analyses for all using (auth.uid() = user_id);
create policy "Users manage own tailored CVs"
  on tailored_cvs for all using (auth.uid() = user_id);
create policy "Users manage own applications"
  on applications for all using (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration via Supabase dashboard**

Go to Supabase Dashboard → SQL Editor → paste the migration SQL → Run.

Verify: Table Editor shows `cvs`, `jobs`, `job_analyses`, `tailored_cvs`, `applications`.

- [ ] **Step 3: Enable Google OAuth in Supabase**

Supabase Dashboard → Authentication → Providers → Google → Enable.
Enter your Google OAuth Client ID and Secret (create at https://console.cloud.google.com → APIs & Services → Credentials → OAuth 2.0 Client).
Authorized redirect URI: `https://your-project.supabase.co/auth/v1/callback`

- [ ] **Step 4: Commit migration file**

```bash
git add supabase/migrations/001_initial.sql
git commit -m "feat: add Supabase database schema with RLS"
```

---

## Task 4: Supabase client helpers

**Files:**
- Create: `lib/supabase/client.ts`, `lib/supabase/server.ts`

- [ ] **Step 1: Write browser client**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: Write server client**

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/
git commit -m "feat: add Supabase client helpers (browser + server)"
```

---

## Task 5: Auth middleware + pages

**Files:**
- Create: `middleware.ts`, `app/auth/login/page.tsx`, `app/auth/signup/page.tsx`, `app/auth/callback/route.ts`

- [ ] **Step 1: Write middleware**

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED = ['/dashboard', '/search', '/jobs', '/builder', '/saved', '/cvs', '/tracker', '/settings']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname
  const isProtected = PROTECTED.some(p => path.startsWith(p))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
```

- [ ] **Step 2: Write OAuth callback route**

```typescript
// app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`)
}
```

- [ ] **Step 3: Write login page**

```typescript
// app/auth/login/page.tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sign in to RadarJobs</h1>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-xs text-gray-500 bg-white px-2">or</div>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password" required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4 text-center">
          No account? <Link href="/auth/signup" className="text-blue-600 hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Write signup page**

```typescript
// app/auth/signup/page.tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Create your account</h1>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
          <div className="relative flex justify-center text-xs text-gray-500 bg-white px-2">or</div>
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="Email" required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="Password (min 8 characters)" minLength={8} required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4 text-center">
          Have an account? <Link href="/auth/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add middleware.ts app/auth/
git commit -m "feat: add auth middleware, login, signup, and OAuth callback"
```

---

## Task 6: Root layout + nav

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`
- Create: `components/nav.tsx`

- [ ] **Step 1: Write nav component**

```typescript
// components/nav.tsx
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
```

- [ ] **Step 2: Update root layout**

```typescript
// app/layout.tsx
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
```

- [ ] **Step 3: Commit**

```bash
git add components/nav.tsx app/layout.tsx app/globals.css
git commit -m "feat: add root layout with sticky nav"
```

---

## Task 7: PDF text extraction lib

**Files:**
- Create: `lib/pdf-extract.ts`, `__tests__/lib/pdf-extract.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/lib/pdf-extract.test.ts
import { extractText } from '@/lib/pdf-extract'

describe('extractText', () => {
  it('returns text from a plain text buffer', async () => {
    const buffer = Buffer.from('John Smith\nSoftware Engineer\n5 years experience')
    const result = await extractText(buffer, 'cv.txt')
    expect(result).toContain('John Smith')
    expect(result).toContain('Software Engineer')
  })

  it('handles markdown buffer', async () => {
    const buffer = Buffer.from('# John Smith\n\n## Experience\n- Built things')
    const result = await extractText(buffer, 'cv.md')
    expect(result).toContain('John Smith')
  })

  it('throws on unsupported file type', async () => {
    const buffer = Buffer.from('content')
    await expect(extractText(buffer, 'cv.docx')).rejects.toThrow('Unsupported file type')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest __tests__/lib/pdf-extract.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/pdf-extract'`

- [ ] **Step 3: Write implementation**

```typescript
// lib/pdf-extract.ts
import pdf from 'pdf-parse'

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop()

  if (ext === 'pdf') {
    const data = await pdf(buffer)
    return data.text
  }

  if (ext === 'txt' || ext === 'md') {
    return buffer.toString('utf-8')
  }

  throw new Error(`Unsupported file type: .${ext}. Use .pdf, .txt, or .md`)
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest __tests__/lib/pdf-extract.test.ts --no-coverage
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/pdf-extract.ts __tests__/lib/pdf-extract.test.ts
git commit -m "feat: add PDF/text extraction lib with tests"
```

---

## Task 8: Adzuna job search lib

**Files:**
- Create: `lib/adzuna.ts`, `__tests__/lib/adzuna.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// __tests__/lib/adzuna.test.ts
import { searchAdzuna } from '@/lib/adzuna'

const mockFetch = jest.fn()
global.fetch = mockFetch

const MOCK_RESPONSE = {
  results: [
    {
      id: 'adzuna-123',
      title: 'Senior Product Manager',
      company: { display_name: 'Google' },
      location: { display_name: 'London' },
      salary_min: 85000,
      salary_max: 110000,
      description: 'We are looking for a Senior PM...',
      redirect_url: 'https://www.adzuna.co.uk/jobs/details/123',
      contract_type: 'permanent',
      created: '2026-04-14T10:00:00Z',
    },
  ],
}

describe('searchAdzuna', () => {
  beforeEach(() => mockFetch.mockReset())

  it('returns normalised job objects', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => MOCK_RESPONSE,
    })

    const jobs = await searchAdzuna({ title: 'Product Manager', location: 'London' })

    expect(jobs).toHaveLength(1)
    expect(jobs[0]).toMatchObject({
      adzuna_id: 'adzuna-123',
      title: 'Senior Product Manager',
      company: 'Google',
      location: 'London',
      salary_min: 85000,
      salary_max: 110000,
    })
  })

  it('throws on Adzuna API error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 401 })
    await expect(searchAdzuna({ title: 'PM', location: 'London' })).rejects.toThrow('Adzuna API error: 401')
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest __tests__/lib/adzuna.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/adzuna'`

- [ ] **Step 3: Write implementation**

```typescript
// lib/adzuna.ts
import type { AdzunaResult, Job } from '@/types'

interface SearchParams {
  title: string
  location: string
  jobType?: 'full_time' | 'part_time' | 'contract'
  resultsPerPage?: number
}

export async function searchAdzuna(params: SearchParams): Promise<Omit<Job, 'id' | 'cached_at'>[]> {
  const { title, location, jobType, resultsPerPage = 20 } = params

  const country = 'gb' // default UK; extend later per location
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`)
  url.searchParams.set('app_id', process.env.ADZUNA_APP_ID!)
  url.searchParams.set('app_key', process.env.ADZUNA_API_KEY!)
  url.searchParams.set('what', title)
  url.searchParams.set('where', location)
  url.searchParams.set('results_per_page', String(resultsPerPage))
  url.searchParams.set('content-type', 'application/json')

  if (jobType === 'full_time') url.searchParams.set('full_time', '1')
  if (jobType === 'part_time') url.searchParams.set('part_time', '1')
  if (jobType === 'contract') url.searchParams.set('contract', '1')

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Adzuna API error: ${res.status}`)

  const data = await res.json()
  return (data.results as AdzunaResult[]).map(normalise)
}

function normalise(r: AdzunaResult): Omit<Job, 'id' | 'cached_at'> {
  return {
    adzuna_id: r.id,
    title: r.title,
    company: r.company.display_name,
    location: r.location.display_name,
    salary_min: r.salary_min ?? null,
    salary_max: r.salary_max ?? null,
    description: r.description,
    url: r.redirect_url,
    job_type: r.contract_type ?? null,
    remote: /remote/i.test(r.title + r.location.display_name),
    posted_at: r.created,
  }
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest __tests__/lib/adzuna.test.ts --no-coverage
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/adzuna.ts __tests__/lib/adzuna.test.ts
git commit -m "feat: add Adzuna job search lib with tests"
```

---

## Task 9: Gemini AI lib

**Files:**
- Create: `lib/gemini.ts`, `__tests__/lib/gemini.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// __tests__/lib/gemini.test.ts
import { analyzeMatch, buildTailoredCV } from '@/lib/gemini'

// Mock the Gemini SDK
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            grade: 'A',
            score: 92,
            strengths: ['5 years PM experience', 'Strong Agile background'],
            gaps: ['No SQL mentioned'],
            matched_keywords: ['Product Strategy', 'Agile', 'Roadmapping'],
            missing_keywords: ['SQL', 'OKRs'],
            verdict: 'Strong match — address SQL gap before applying.',
          }),
        },
      }),
    }),
  })),
}))

const MOCK_CV = 'John Smith, Senior PM at Acme Corp. 5 years product management experience. Agile, roadmapping, B2C.'
const MOCK_JOB = 'Senior Product Manager at Google. Requirements: product strategy, agile, roadmapping, SQL, OKR frameworks.'

describe('analyzeMatch', () => {
  it('returns a parsed analysis object', async () => {
    const result = await analyzeMatch(MOCK_CV, MOCK_JOB)
    expect(result.grade).toBe('A')
    expect(result.score).toBe(92)
    expect(result.strengths).toHaveLength(2)
    expect(result.matched_keywords).toContain('Agile')
    expect(result.verdict).toBeTruthy()
  })
})

describe('buildTailoredCV', () => {
  it('returns non-empty string', async () => {
    // Override mock for this test to return plain text
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    GoogleGenerativeAI.mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockResolvedValue({
          response: { text: () => '# John Smith\n\nTailored for Google PM role...' },
        }),
      }),
    }))

    const result = await buildTailoredCV(MOCK_CV, MOCK_JOB)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(50)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
npx jest __tests__/lib/gemini.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/gemini'`

- [ ] **Step 3: Write implementation**

```typescript
// lib/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Grade } from '@/types'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface MatchAnalysis {
  grade: Grade
  score: number
  strengths: string[]
  gaps: string[]
  matched_keywords: string[]
  missing_keywords: string[]
  verdict: string
}

export async function analyzeMatch(cvText: string, jobDescription: string): Promise<MatchAnalysis> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are an expert career coach and ATS system. Analyze how well this CV matches the job description.

CV:
${cvText}

Job Description:
${jobDescription}

Respond with ONLY a JSON object (no markdown, no explanation) with this exact structure:
{
  "grade": "A+"|"A"|"B+"|"B"|"C"|"D"|"F",
  "score": <integer 0-100>,
  "strengths": [<up to 5 specific strengths from the CV that match the job>],
  "gaps": [<up to 5 specific gaps — requirements in the job not in the CV>],
  "matched_keywords": [<up to 10 keywords/skills present in both CV and job>],
  "missing_keywords": [<up to 10 keywords/skills in the job but not in the CV>],
  "verdict": "<one concise sentence summarising the match>"
}

Grading scale: A+ (95-100), A (85-94), B+ (75-84), B (65-74), C (50-64), D (35-49), F (<35)`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()

  // Strip markdown code fences if present
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')

  return JSON.parse(json) as MatchAnalysis
}

export async function buildTailoredCV(cvText: string, jobDescription: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = `You are an expert CV writer. Rewrite the CV below to be optimally tailored for the job description provided.

Rules:
- Keep all facts truthful — do NOT invent experience, companies, or qualifications
- Reorder bullet points to lead with the most relevant experience
- Inject relevant keywords from the job description naturally
- Adjust the professional summary/headline to echo the role title and key requirements
- Use strong action verbs
- Output clean markdown only (# for name, ## for sections, - for bullets)

CV:
${cvText}

Job Description:
${jobDescription}

Output the tailored CV in markdown:`

  const result = await model.generateContent(prompt)
  return result.response.text().trim()
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
npx jest __tests__/lib/gemini.test.ts --no-coverage
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/gemini.ts __tests__/lib/gemini.test.ts
git commit -m "feat: add Gemini match analysis and CV builder lib with tests"
```

---

## Task 10: CV upload API route + component

**Files:**
- Create: `app/api/cv/upload/route.ts`, `components/cv-uploader.tsx`

- [ ] **Step 1: Write upload API route**

```typescript
// app/api/cv/upload/route.ts
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
```

- [ ] **Step 2: Write CV uploader component**

```typescript
// components/cv-uploader.tsx
'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function CVUploader({ hasCV }: { hasCV: boolean }) {
  const [mode, setMode] = useState<'upload' | 'paste'>('upload')
  const [text, setText] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function submit(file?: File) {
    setLoading(true)
    setError('')
    const formData = new FormData()
    if (file) formData.append('file', file)
    else formData.append('text', text)

    const res = await fetch('/api/cv/upload', { method: 'POST', body: formData })
    const data = await res.json()

    if (!res.ok) { setError(data.error); setLoading(false); return }
    setSuccess(true)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <h2 className="font-semibold text-gray-900 mb-1">{hasCV ? 'Update your CV' : 'Upload your CV'}</h2>
      <p className="text-sm text-gray-500 mb-4">Required to search and analyze jobs</p>

      <div className="flex gap-2 mb-4">
        {(['upload', 'paste'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-sm px-3 py-1.5 rounded-lg ${mode === m ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            {m === 'upload' ? 'Upload file' : 'Paste text'}
          </button>
        ))}
      </div>

      {mode === 'upload' ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) submit(f) }}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
        >
          <p className="text-sm text-gray-600">Drag & drop your CV or <span className="text-blue-600 font-medium">browse</span></p>
          <p className="text-xs text-gray-400 mt-1">.pdf, .txt, .md supported</p>
          <input ref={fileRef} type="file" accept=".pdf,.txt,.md" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) submit(f) }} />
        </div>
      ) : (
        <div>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Paste your CV text here…"
            rows={10}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono resize-none"
          />
          <button
            onClick={() => submit()}
            disabled={!text.trim() || loading}
            className="mt-2 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving…' : 'Save CV'}
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      {success && <p className="text-sm text-green-600 mt-3">CV saved successfully!</p>}
      {loading && mode === 'upload' && <p className="text-sm text-gray-500 mt-3">Processing…</p>}
    </div>
  )
}
```

- [ ] **Step 3: Write dashboard page**

```typescript
// app/dashboard/page.tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add app/api/cv/ components/cv-uploader.tsx app/dashboard/page.tsx
git commit -m "feat: add CV upload API route, uploader component, and dashboard"
```

---

## Task 11: Job search API route + search page

**Files:**
- Create: `app/api/jobs/search/route.ts`, `app/search/page.tsx`, `components/job-card.tsx`

- [ ] **Step 1: Write job search API route**

```typescript
// app/api/jobs/search/route.ts
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

  if (!title || !location) return NextResponse.json({ error: 'title and location are required' }, { status: 400 })

  // Fetch from Adzuna
  let rawJobs
  try {
    rawJobs = await searchAdzuna({ title, location, jobType })
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
```

- [ ] **Step 2: Write job card component**

```typescript
// components/job-card.tsx
'use client'
import { useState } from 'react'
import type { Job, Analysis } from '@/types'
import Link from 'next/link'

const GRADE_COLORS: Record<string, string> = {
  'A+': 'bg-green-100 text-green-700',
  'A':  'bg-green-100 text-green-700',
  'B+': 'bg-emerald-100 text-emerald-700',
  'B':  'bg-yellow-100 text-yellow-700',
  'C':  'bg-orange-100 text-orange-700',
  'D':  'bg-red-100 text-red-700',
  'F':  'bg-red-100 text-red-700',
}

function formatSalary(min: number | null, max: number | null): string {
  if (!min && !max) return 'Salary not listed'
  if (min && max) return `£${(min / 1000).toFixed(0)}k–£${(max / 1000).toFixed(0)}k`
  if (min) return `From £${(min / 1000).toFixed(0)}k`
  return `Up to £${(max! / 1000).toFixed(0)}k`
}

interface JobCardProps {
  job: Job
  analysis: Analysis | null
}

export default function JobCard({ job, analysis }: JobCardProps) {
  const [analyzing, setAnalyzing] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(analysis)

  async function handleAnalyze() {
    setAnalyzing(true)
    const res = await fetch(`/api/jobs/${job.id}/analyze`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json()
      setCurrentAnalysis(data.analysis)
    }
    setAnalyzing(false)
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
      {/* Grade badge */}
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0 ${currentAnalysis ? GRADE_COLORS[currentAnalysis.grade] : 'bg-gray-100 text-gray-400'}`}>
        {currentAnalysis ? currentAnalysis.grade : '—'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <Link href={`/jobs/${job.id}`} className="font-semibold text-gray-900 hover:text-blue-600 text-sm leading-tight block">
          {job.title}
        </Link>
        <p className="text-xs text-gray-500 mt-0.5">
          {job.company} · {job.location} · {formatSalary(job.salary_min, job.salary_max)}
          {job.remote && <span className="ml-1 bg-blue-50 text-blue-600 text-xs px-1.5 py-0.5 rounded">Remote</span>}
        </p>

        {currentAnalysis && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {currentAnalysis.matched_keywords.slice(0, 4).map(kw => (
              <span key={kw} className="bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded">{kw}</span>
            ))}
            {currentAnalysis.missing_keywords.slice(0, 2).map(kw => (
              <span key={kw} className="bg-amber-50 text-amber-700 text-xs px-1.5 py-0.5 rounded">⚠ {kw}</span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-1.5 flex-shrink-0 items-end">
        {currentAnalysis && (
          <span className="text-xs font-medium text-gray-600">{currentAnalysis.score}%</span>
        )}
        {!currentAnalysis && (
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {analyzing ? 'Analyzing…' : 'Analyze'}
          </button>
        )}
        <Link href={`/jobs/${job.id}`} className="text-xs text-gray-500 hover:text-gray-700 underline">
          View
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Write search page**

```typescript
// app/search/page.tsx
'use client'
import { useState } from 'react'
import JobCard from '@/components/job-card'
import type { Job, Analysis } from '@/types'

type JobWithAnalysis = Job & { analysis: Analysis | null }

export default function SearchPage() {
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [jobType, setJobType] = useState('')
  const [jobs, setJobs] = useState<JobWithAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSearched(true)

    const params = new URLSearchParams({ title, location })
    if (jobType) params.set('jobType', jobType)

    const res = await fetch(`/api/jobs/search?${params}`)
    const data = await res.json()

    if (!res.ok) { setError(data.error); setLoading(false); return }
    setJobs(data.jobs)
    setLoading(false)
  }

  async function analyzeAll() {
    const unanalyzed = jobs.filter(j => !j.analysis)
    await Promise.all(unanalyzed.map(j => fetch(`/api/jobs/${j.id}/analyze`, { method: 'POST' })))
    // Refresh results
    const params = new URLSearchParams({ title, location })
    if (jobType) params.set('jobType', jobType)
    const res = await fetch(`/api/jobs/search?${params}`)
    const data = await res.json()
    if (res.ok) setJobs(data.jobs)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Find jobs</h1>

      <form onSubmit={handleSearch} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex gap-3 flex-wrap">
        <input
          value={title} onChange={e => setTitle(e.target.value)}
          placeholder="Job title, e.g. Product Manager"
          required
          className="flex-[2] min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          value={location} onChange={e => setLocation(e.target.value)}
          placeholder="Location, e.g. London"
          required
          className="flex-1 min-w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={jobType} onChange={e => setJobType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Any type</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
        </select>
        <button
          type="submit" disabled={loading}
          className="bg-blue-600 text-white rounded-lg px-5 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4 bg-red-50 rounded-lg px-4 py-3">{error}</p>}

      {searched && !loading && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">{jobs.length} jobs found{jobs.length > 0 && ' · Analyze to see match grades'}</p>
          {jobs.some(j => !j.analysis) && (
            <button
              onClick={analyzeAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Analyze all
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {jobs.map(job => (
          <JobCard key={job.id} job={job} analysis={job.analysis} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/jobs/search/ components/job-card.tsx app/search/page.tsx
git commit -m "feat: add Adzuna job search route, job card, and search page"
```

---

## Task 12: Match analysis API route + job detail page

**Files:**
- Create: `app/api/jobs/[id]/analyze/route.ts`, `app/jobs/[id]/page.tsx`, `components/job-analysis-panel.tsx`

- [ ] **Step 1: Write analysis API route**

```typescript
// app/api/jobs/[id]/analyze/route.ts
import { createClient } from '@/lib/supabase/server'
import { analyzeMatch } from '@/lib/gemini'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check for cached analysis
  const { data: existing } = await supabase
    .from('job_analyses')
    .select('*')
    .eq('user_id', user.id)
    .eq('job_id', jobId)
    .single()

  if (existing) return NextResponse.json({ analysis: existing })

  // Get CV
  const { data: cv } = await supabase
    .from('cvs')
    .select('content')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!cv) return NextResponse.json({ error: 'No active CV found' }, { status: 400 })

  // Get job
  const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  // Run Gemini analysis
  let result
  try {
    result = await analyzeMatch(cv.content, `${job.title} at ${job.company}\n${job.description}`)
  } catch (err: unknown) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 })
  }

  // Store analysis
  const { data: analysis, error } = await supabase
    .from('job_analyses')
    .insert({ user_id: user.id, job_id: jobId, ...result })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ analysis })
}
```

- [ ] **Step 2: Write analysis panel component**

```typescript
// components/job-analysis-panel.tsx
'use client'
import { useState } from 'react'
import type { Analysis, Job } from '@/types'
import Link from 'next/link'

const GRADE_COLORS: Record<string, string> = {
  'A+': 'text-green-600', 'A': 'text-green-600',
  'B+': 'text-emerald-600', 'B': 'text-yellow-600',
  'C':  'text-orange-600', 'D': 'text-red-600', 'F': 'text-red-600',
}

export default function JobAnalysisPanel({ job, initialAnalysis }: { job: Job; initialAnalysis: Analysis | null }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis)
  const [loading, setLoading] = useState(false)

  async function runAnalysis() {
    setLoading(true)
    const res = await fetch(`/api/jobs/${job.id}/analyze`, { method: 'POST' })
    if (res.ok) setAnalysis((await res.json()).analysis)
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Grade card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 text-center">
        {analysis ? (
          <>
            <div className={`text-5xl font-black ${GRADE_COLORS[analysis.grade]}`}>{analysis.grade}</div>
            <p className="text-sm text-gray-500 mt-1">{analysis.score}% match with your CV</p>
            <p className="text-xs text-gray-400 mt-2 italic">"{analysis.verdict}"</p>
          </>
        ) : (
          <div>
            <div className="text-4xl font-black text-gray-200">—</div>
            <p className="text-sm text-gray-500 mt-1">Not yet analyzed</p>
          </div>
        )}
        <div className="flex gap-2 mt-4 justify-center">
          {!analysis && (
            <button
              onClick={runAnalysis} disabled={loading}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing…' : 'Analyze match'}
            </button>
          )}
          {analysis && (
            <Link
              href={`/builder/${job.id}`}
              className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              Build tailored CV
            </Link>
          )}
        </div>
      </div>

      {analysis && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-2">Strengths</h3>
            <ul className="space-y-1">
              {analysis.strengths.map((s, i) => <li key={i} className="text-sm text-gray-700">✓ {s}</li>)}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Gaps</h3>
            <ul className="space-y-1">
              {analysis.gaps.map((g, i) => <li key={i} className="text-sm text-gray-700">⚠ {g}</li>)}
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Keywords matched</h3>
            <div className="flex flex-wrap gap-1.5">
              {analysis.matched_keywords.map(kw => (
                <span key={kw} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{kw}</span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Keywords missing</h3>
            <div className="flex flex-wrap gap-1.5">
              {analysis.missing_keywords.map(kw => (
                <span key={kw} className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded">{kw}</span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write job detail page**

```typescript
// app/jobs/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import JobAnalysisPanel from '@/components/job-analysis-panel'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: job } = await supabase.from('jobs').select('*').eq('id', id).single()
  if (!job) notFound()

  const { data: analysis } = await supabase
    .from('job_analyses')
    .select('*')
    .eq('user_id', user!.id)
    .eq('job_id', id)
    .single()

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/search" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">← Back to search</Link>

      <div className="flex gap-6 items-start">
        {/* Left: job description */}
        <div className="flex-[1.5]">
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {job.company} · {job.location}
              {job.salary_min && ` · £${(job.salary_min / 1000).toFixed(0)}k–£${(job.salary_max! / 1000).toFixed(0)}k`}
            </p>
            <div className="mt-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
              {job.description}
            </div>
            <a
              href={job.url} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-blue-600 hover:underline"
            >
              View on Adzuna ↗
            </a>
          </div>
        </div>

        {/* Right: analysis panel */}
        <div className="w-72 flex-shrink-0">
          <JobAnalysisPanel job={job} initialAnalysis={analysis ?? null} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/jobs/ components/job-analysis-panel.tsx app/jobs/
git commit -m "feat: add analysis API route, analysis panel, and job detail page"
```

---

## Task 13: Tailored CV builder

**Files:**
- Create: `app/api/jobs/[id]/build-cv/route.ts`, `app/builder/[jobId]/page.tsx`

- [ ] **Step 1: Write build-cv API route**

```typescript
// app/api/jobs/[id]/build-cv/route.ts
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
```

- [ ] **Step 2: Write builder page**

```typescript
// app/builder/[jobId]/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function BuilderPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [generated, setGenerated] = useState(false)

  async function generate() {
    setLoading(true)
    setError('')
    const res = await fetch(`/api/jobs/${jobId}/build-cv`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setLoading(false); return }
    setContent(data.tailoredCV.content)
    setGenerated(true)
    setLoading(false)
  }

  function download() {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'tailored-cv.md'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href={`/jobs/${jobId}`} className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">← Back to job</Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Tailored CV Builder</h1>
      <p className="text-sm text-gray-500 mb-6">Gemini will rewrite your CV optimised for this specific role.</p>

      {!generated && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-600 mb-4">Ready to generate your tailored CV?</p>
          <button
            onClick={generate} disabled={loading}
            className="bg-blue-600 text-white rounded-lg px-6 py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating… (this may take 10–20s)' : 'Generate tailored CV'}
          </button>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        </div>
      )}

      {generated && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-green-600 font-medium">CV generated</p>
            <div className="flex gap-2">
              <button
                onClick={generate} disabled={loading}
                className="text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg px-3 py-1.5"
              >
                Regenerate
              </button>
              <button
                onClick={download}
                className="text-sm bg-blue-600 text-white rounded-lg px-4 py-1.5 font-medium hover:bg-blue-700"
              >
                Download .md
              </button>
            </div>
          </div>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={30}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/jobs/*/build-cv/ app/builder/
git commit -m "feat: add tailored CV builder API route and builder page"
```

---

## Task 14: Save job API route (wire up Save buttons)

**Files:**
- Create: `app/api/jobs/[id]/save/route.ts`
- Modify: `components/job-card.tsx` (wire Save button onClick)
- Modify: `components/job-analysis-panel.tsx` (wire Save job button onClick)

- [ ] **Step 1: Write save/unsave API route**

```typescript
// app/api/jobs/[id]/save/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST = save, DELETE = unsave
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('applications').upsert(
    { user_id: user.id, job_id: jobId, status: 'saved', updated_at: new Date().toISOString() },
    { onConflict: 'user_id,job_id', ignoreDuplicates: true }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saved: true })
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase.from('applications')
    .delete().eq('user_id', user.id).eq('job_id', jobId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saved: false })
}
```

- [ ] **Step 2: Update `job-card.tsx` Save button — replace the plain `<button>` with this wired version**

Replace the existing Save button in `components/job-card.tsx`:
```typescript
// Replace the static Save button inside JobCard:
const [saved, setSaved] = useState(false)

async function handleSave() {
  const method = saved ? 'DELETE' : 'POST'
  const res = await fetch(`/api/jobs/${job.id}/save`, { method })
  if (res.ok) setSaved(prev => !prev)
}

// In JSX, replace the static Save button with:
<button
  onClick={handleSave}
  className={`text-xs px-3 py-1.5 rounded-lg border ${saved ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
>
  {saved ? '✓ Saved' : 'Save'}
</button>
```

- [ ] **Step 3: Update `job-analysis-panel.tsx` Save job button — replace with wired version**

Add save state and handler to `JobAnalysisPanel`, identical pattern to Step 2:
```typescript
const [saved, setSaved] = useState(false)

async function handleSave() {
  const method = saved ? 'DELETE' : 'POST'
  const res = await fetch(`/api/jobs/${job.id}/save`, { method })
  if (res.ok) setSaved(prev => !prev)
}

// Replace static "Save job" button in JSX:
<button
  onClick={handleSave}
  className={`border rounded-lg px-4 py-2 text-sm font-medium ${saved ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
>
  {saved ? '✓ Saved' : 'Save job'}
</button>
```

- [ ] **Step 4: Commit**

```bash
git add app/api/jobs/*/save/ components/job-card.tsx components/job-analysis-panel.tsx
git commit -m "feat: add save/unsave job API route and wire up Save buttons"
```

---

## Task 15: Landing page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Write landing page**

```typescript
// app/page.tsx
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-block bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1 rounded-full mb-6">
          Free · Powered by Gemini 2.0 Flash
        </div>
        <h1 className="text-5xl font-black text-gray-900 leading-tight mb-4">
          Find jobs that <span className="text-blue-600">actually match</span> your CV
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          Upload your CV. Search real jobs. Get an A–F match score for every role.
          Build a tailored CV in seconds.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/auth/signup"
            className="bg-blue-600 text-white rounded-xl px-6 py-3 font-semibold hover:bg-blue-700 text-sm"
          >
            Get started free
          </Link>
          <Link
            href="/auth/login"
            className="border border-gray-300 text-gray-700 rounded-xl px-6 py-3 font-semibold hover:bg-gray-50 text-sm"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-4xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '📄', title: 'Upload your CV', desc: 'Drop a PDF, .txt, or .md file. Or paste directly. Takes 10 seconds.' },
            { icon: '🔍', title: 'Search real jobs', desc: 'Live listings from Adzuna — Indeed, LinkedIn, and more — by title and location.' },
            { icon: '🎯', title: 'AI match scoring', desc: 'Gemini reads your CV against every job and gives you a grade, strengths, and gaps.' },
          ].map(f => (
            <div key={f.title} className="bg-gray-50 rounded-2xl p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add landing page with hero and feature cards"
```

---

## Task 16: Local smoke test

- [ ] **Step 1: Create `.env.local` from example**

```bash
cp .env.local.example .env.local
# Fill in your real values:
# - Supabase URL + keys from https://supabase.com/dashboard → Project Settings → API
# - Gemini API key from https://aistudio.google.com/app/apikey
# - Adzuna keys from https://developer.adzuna.com/admin/applications
```

- [ ] **Step 2: Run all unit tests**

```bash
npx jest --no-coverage
```

Expected: PASS — 7 tests (pdf-extract: 3, adzuna: 2, gemini: 2)

- [ ] **Step 3: Start dev server**

```bash
npm run dev
```

Expected: `ready on http://localhost:3000`

- [ ] **Step 4: Manual smoke test flow**

1. Open `http://localhost:3000` — landing page visible
2. Click "Get started free" → `/auth/signup`
3. Sign up with email/password → redirected to `/dashboard`
4. Upload a CV (drag a .txt or .pdf) → success message appears
5. Click "Search jobs →"
6. Enter "Product Manager" + "London" → results load
7. Click "Analyze" on a card → grade badge appears
8. Click "View" on a card → job detail page with analysis panel
9. Click "Build tailored CV" → `/builder/[id]` — click generate → CV appears
10. Click "Download .md" → file downloads

- [ ] **Step 5: Fix any issues found in smoke test**

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: core loop complete — auth, CV upload, job search, AI analysis, CV builder"
```

---

## Task 17: Deploy to Netlify

- [ ] **Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/radarjobs.git
git push -u origin master
```

- [ ] **Step 2: Connect repo to Netlify**

1. Go to https://app.netlify.com → Add new site → Import an existing project → GitHub
2. Select your `radarjobs` repo
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Click "Deploy site"

- [ ] **Step 3: Set environment variables in Netlify**

Netlify dashboard → Site → Site configuration → Environment variables → Add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
ADZUNA_APP_ID
ADZUNA_API_KEY
NEXT_PUBLIC_APP_URL    ← set to your Netlify URL e.g. https://radarjobs.netlify.app
```

- [ ] **Step 4: Retrigger deploy**

Netlify dashboard → Deploys → Trigger deploy → Deploy site

- [ ] **Step 5: Update Supabase allowed URLs**

Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://radarjobs.netlify.app`
- Redirect URLs: add `https://radarjobs.netlify.app/auth/callback`

Google Cloud Console → OAuth Client → Authorized redirect URIs: confirm `https://your-project.supabase.co/auth/v1/callback` is present.

- [ ] **Step 6: Smoke test production URL**

Repeat the manual smoke test from Task 15 Step 4 against `https://radarjobs.netlify.app`

- [ ] **Step 7: Commit deploy config confirmation**

```bash
git commit --allow-empty -m "chore: core loop deployed to Netlify"
```
