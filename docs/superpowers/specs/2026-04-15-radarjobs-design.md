# RadarJobs — Design Spec
**Date:** 2026-04-15  
**Status:** Approved

---

## Overview

RadarJobs is a public web application where job seekers upload their CV, search for jobs by title and location, receive AI-powered CV-to-job match scores, and generate tailored CVs for specific roles. Users create accounts to persist their CV, save jobs, download tailored CVs, and track their applications through a Kanban board.

---

## Architecture

### Stack
| Layer | Technology |
|---|---|
| Frontend + API | Next.js 14 App Router |
| Deployment | Netlify (`@netlify/plugin-nextjs`) |
| Auth | Supabase Auth (Google OAuth + email/password) |
| Database | Supabase PostgreSQL |
| File storage | Supabase Storage (CV files) |
| Job search | Adzuna REST API (free tier, 250 req/day) |
| AI | Google Gemini 2.0 Flash (free tier, 1,500 req/day) |

All Adzuna and Gemini API calls are made server-side in Next.js API routes. No API keys are exposed to the browser.

### Key design principles
- **Cache analyses:** Gemini runs once per user+job pair. Results are stored in `job_analyses` so re-opening a job does not consume quota.
- **Cache job search results:** Adzuna results are stored in `jobs` table (keyed by `adzuna_id`) to reduce duplicate API calls across users searching the same terms.
- **Server-side only for AI/jobs:** All sensitive API calls go through Next.js Route Handlers — never direct from client.

---

## Pages & Routes

```
/                          Landing page — hero, features, sign up / log in CTA
/auth/login                Login (Google + email/password)
/auth/signup               Sign up
/dashboard                 Post-login home — CV status card + quick search shortcut
/search                    Job search form + results ranked by match score
/jobs/[id]                 Job detail — description + CV match analysis panel
/builder/[jobId]           Tailored CV generator + markdown download
/saved                     Bookmarked jobs list
/cvs                       All tailored CVs generated — download / delete
/tracker                   Application Kanban: Saved → Applied → Interview → Offer → Rejected
/settings                  Profile info, update CV, change password
```

---

## UI Design

- **Theme:** Light mode
- **Navigation:** Top nav bar (logo + links + avatar)
- **Color:** Blue primary (`#2563eb`), green for high grades, amber for mid grades, red for low grades
- **Grade colours:** A/A+ = green, B = light green, C = amber, D/F = red

### Job card (search results)
Each card shows: grade badge · job title · company · location · salary · matched keyword tags (blue) · gap keyword tags (amber with ⚠) · match % · Analyze button · Save button.

### Job detail
Two-column layout: left = full job description + "View on Adzuna" link; right = grade panel (grade, match %, strengths list, gaps list, matched keywords, missing keywords, "Build tailored CV" button, "Save job" button).

### Application Tracker
Kanban board with 5 columns: Saved, Applied, Interview, Offer, Rejected. Each card shows job title, company, grade, match %. Cards are draggable between columns.

---

## Data Model

```sql
-- Managed by Supabase Auth
users: id, email, full_name, avatar_url, created_at

-- One active CV per user (previous CVs retained for history)
cvs: id, user_id, content TEXT, filename, uploaded_at, is_active BOOLEAN

-- Jobs fetched from Adzuna (cached across users)
jobs:
  id, adzuna_id (unique), title, company, location,
  salary_min, salary_max, description, url,
  job_type, remote BOOLEAN, posted_at, cached_at

-- Gemini analysis results (one per user+job, cached)
job_analyses:
  id, user_id, job_id,
  grade VARCHAR(2),       -- A+, A, B+, B, C, D, F
  score INT,              -- 0–100
  strengths TEXT[],
  gaps TEXT[],
  matched_keywords TEXT[],
  missing_keywords TEXT[],
  verdict TEXT,           -- one sentence summary
  created_at

-- Tailored CVs (Gemini output stored as markdown text)
tailored_cvs: id, user_id, job_id, content TEXT, created_at

-- Application tracker
applications:
  id, user_id, job_id,
  status VARCHAR(20),     -- saved / applied / interview / offer / rejected
  notes TEXT,
  applied_at TIMESTAMP,
  updated_at TIMESTAMP
```

Row-Level Security (RLS) enabled on all tables — users can only read/write their own rows.

Note: there is no separate `saved_jobs` table. Bookmarks are `applications` rows with `status = 'saved'`. The `/saved` page queries `applications WHERE status = 'saved'`.

---

## Key User Flows

### Onboarding
1. User lands on `/` → clicks "Get started"
2. Signs up (Google or email) → redirected to `/dashboard`
3. Prompted to upload CV (drag-and-drop `.txt` / `.md` / `.pdf`, or paste text directly). PDF uploads are supported — text is extracted server-side using `pdf-parse` before storing.
4. CV saved to Supabase Storage + extracted text stored in `cvs` table
5. User is now ready to search

### Job Search & Matching
1. User enters job title + location on `/search` → submits
2. API route calls Adzuna, stores new jobs in `jobs` table, returns results
3. Frontend displays job cards sorted by Adzuna relevance (no grade yet until analyzed)
4. User clicks "Analyze" on a card → API route calls Gemini with CV + job description → stores result in `job_analyses` → card updates with grade + keywords
5. "Analyze all" button runs analyses in parallel for all visible results

### Tailored CV
1. User clicks "Build tailored CV" on a job detail page
2. API route calls Gemini with CV + job description + instruction to rewrite CV for this role
3. Output stored in `tailored_cvs`, displayed in `/builder/[jobId]`
4. User can download as `.md` file

### Application Tracking
1. User saves a job → row created in `applications` with `status = saved`
2. On `/tracker`, user drags cards between columns → `status` updated via API route
3. User can add notes to each application card

---

## API Routes

```
POST /api/auth/callback          Supabase auth callback (Google OAuth)
POST /api/cv/upload              Upload + store CV, extract text
GET  /api/jobs/search            Query Adzuna, cache results, return list
POST /api/jobs/[id]/analyze      Run Gemini match analysis for user+job
POST /api/jobs/[id]/build-cv     Run Gemini tailored CV for user+job
POST /api/jobs/[id]/save         Create application row with status=saved (or delete it to unsave)
PATCH /api/applications/[id]     Update application status or notes
```

---

## Error Handling

- **Adzuna quota exceeded:** Show cached results if available; otherwise show "Search unavailable, try again later"
- **Gemini quota exceeded:** Queue analysis with a "generating…" spinner, retry with exponential backoff (max 3 attempts)
- **CV not uploaded:** Gate search and analysis behind a CV upload prompt — cannot search without an active CV
- **Auth errors:** Redirect to `/auth/login` with error message
- **Rate limiting:** Netlify Edge middleware limits `/api/jobs/search` to 10 req/min per IP

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google Gemini
GEMINI_API_KEY=

# Adzuna
ADZUNA_APP_ID=
ADZUNA_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://radarjobs.netlify.app
```

---

## Out of Scope (for this version)

- Email notifications (interview reminders, new job alerts)
- CV PDF export (tailored CVs are downloadable as `.md` only; PDF rendering is out of scope)
- Mobile app
- Bulk apply
- Paid tiers / billing
