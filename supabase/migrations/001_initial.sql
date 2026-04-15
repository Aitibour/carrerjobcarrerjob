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
