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
