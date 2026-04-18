# RadarJobs App Enhancements — Design Spec

**Goal:** Complete three parallel improvements: missing nav pages, search UX upgrades, and reliability/polish fixes.

**Architecture:** All new pages follow the existing App Router pattern (server components for data fetching, client components for interactivity). New API routes follow the existing Supabase RLS pattern. No new dependencies required.

**Tech Stack:** Next.js 16 App Router, Supabase, Tailwind CSS 4, existing types in `types/index.ts`.

---

## Sub-project A: Missing Pages

### `/saved` page
- Server component fetches `applications` joined with `jobs` and `job_analyses` for current user where status = any
- Displays job cards grouped or listed, showing score badge, company, title, status badge
- Status dropdown on each card lets user change status (Saved → Applied → Interview → Offer → Rejected)
- Status change hits `PATCH /api/applications/[jobId]` with `{ status }`
- Empty state: "No saved jobs yet. Search for jobs and save the ones you like."

### `/tracker` page
- Client component (needs interactivity)
- Fetches all applications via `GET /api/applications`
- Renders 5 columns: Saved · Applied · Interview · Offer · Rejected
- Each job card shows: title, company, score %, posted date
- Click card to open a small popover with status selector and optional notes field
- Status/notes changes hit `PATCH /api/applications/[jobId]`
- Column counts shown in header (e.g. "Applied (3)")
- Empty state per column: subtle dashed placeholder

### `/cvs` page
- Server component fetches all CVs for current user ordered by `uploaded_at DESC`
- Shows filename, upload date, character count, active badge
- "Set as active" button on inactive CVs → `PATCH /api/cvs/[id]/activate`
- "Delete" button → `DELETE /api/cvs/[id]` (disabled on last remaining CV)
- Active CV has green checkmark, grayed-out "Set active" button
- Link back to dashboard

### New API routes needed
- `GET /api/applications` — returns all user applications joined with job + analysis data
- `PATCH /api/applications/[jobId]` — updates status and/or notes
- `GET /api/cvs` — returns all user CVs
- `PATCH /api/cvs/[id]/activate` — sets is_active=true on this CV, false on all others
- `DELETE /api/cvs/[id]` — deletes CV (guard: must have at least 1 CV remaining)

---

## Sub-project B: Search & Filter UX

### Remote-only toggle
- Add a toggle button in the search form row in `app/search/page.tsx`
- When active, passes `remote=1` to `GET /api/jobs/search`
- API route passes `?full_time=0&part_time=0` (no Adzuna remote param — filter client-side from results where `remote=true`)
- Actually: filter results in the API route after fetching: `rawJobs.filter(j => j.remote)`

### Sort by match %
- After jobs are loaded with analyses, show a "Sort by match %" button (only visible when at least one job has been analyzed)
- Client-side sort: `jobs.sort((a,b) => (b.analysis?.score ?? -1) - (a.analysis?.score ?? -1))`
- Toggle: click again to revert to original order (store original order in a ref)
- No new API call needed

### Salary currency fix
- `components/job-card.tsx` `formatSalary()` currently uses `$` — verify and keep `$`
- Add note in tooltip/title: "Salary from Adzuna, may vary by region"

---

## Sub-project C: Polish & Reliability

### Throttle Analyze All
- Replace `Promise.all(unanalyzed.map(...))` with a concurrency-limited queue (max 3 parallel)
- Simple implementation: chunk array into groups of 3, await each group sequentially
- Show progress: "Analyzing 4 of 12…" counter during batch

### Stale listing badge
- In `JobCard`, if `job.cached_at` is older than 48 hours, show a small "⚠ Listing may be outdated" badge in gray
- No API change needed — `cached_at` already on the job object

### Empty states
- `/saved` and `/tracker` get illustrated empty states with a link to `/search`
- Search page empty state (after search returns 0 results) already exists — keep it

---

## File Map

**New files:**
- `app/saved/page.tsx`
- `app/tracker/page.tsx`
- `app/cvs/page.tsx`
- `app/api/applications/route.ts` (GET, PATCH not here — PATCH is per-job)
- `app/api/applications/[jobId]/route.ts` (PATCH)
- `app/api/cvs/route.ts` (GET)
- `app/api/cvs/[id]/activate/route.ts` (PATCH)
- `app/api/cvs/[id]/route.ts` (DELETE)

**Modified files:**
- `app/search/page.tsx` — remote toggle, sort by score, throttled analyze-all, progress counter
- `components/job-card.tsx` — stale badge

---

## Out of Scope
- Drag-and-drop in tracker (click-to-move only)
- Email notifications
- OCR for scanned PDFs
- Salary range filter (deferred — Adzuna salary data is sparse)
