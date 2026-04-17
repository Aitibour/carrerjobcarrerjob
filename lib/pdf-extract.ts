export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop()

  if (ext === 'pdf') {
    // Use require to avoid ESM/CJS interop issues with pdf-parse
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    if (!data?.text?.trim()) throw new Error('Could not extract text from PDF. Try a text-based PDF or paste the text directly.')
    return data.text
  }

  if (ext === 'txt' || ext === 'md') {
    return buffer.toString('utf-8')
  }

  throw new Error(`Unsupported file type: .${ext}. Use .pdf, .txt, or .md`)
}
