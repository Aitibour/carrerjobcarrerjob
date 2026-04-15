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
