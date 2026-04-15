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
