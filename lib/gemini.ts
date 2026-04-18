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
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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

export async function analyzeJobOnly(jobDescription: string): Promise<MatchAnalysis> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `You are an expert career coach. Analyze this job description and extract key information.
No CV is provided — give a general breakdown of what this role requires.

Job Description:
${jobDescription}

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "grade": "B",
  "score": 50,
  "strengths": [<up to 5 key selling points of this role>],
  "gaps": [<up to 5 most important requirements a candidate must meet>],
  "matched_keywords": [<up to 10 key skills/keywords this role values>],
  "missing_keywords": [],
  "verdict": "Upload your CV to get a personalised match score for this role."
}`

  const result = await model.generateContent(prompt)
  const text = result.response.text().trim()
  const json = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(json) as MatchAnalysis
}

export async function buildTailoredCV(cvText: string, jobDescription: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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
