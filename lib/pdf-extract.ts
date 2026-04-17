export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop()

  if (ext === 'pdf') {
    const { extractText: pdfExtractText } = await import('unpdf')
    const result = await pdfExtractText(new Uint8Array(buffer), { mergePages: true })
    const text = Array.isArray(result.text) ? result.text.join('\n') : result.text
    if (!text?.trim()) throw new Error('Could not extract text from PDF. Try a text-based PDF or paste your CV text directly.')
    return text
  }

  if (ext === 'txt' || ext === 'md') {
    return buffer.toString('utf-8')
  }

  throw new Error(`Unsupported file type: .${ext}. Use .pdf, .txt, or .md`)
}
