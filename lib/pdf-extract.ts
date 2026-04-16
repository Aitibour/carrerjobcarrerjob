import { PDFParse } from 'pdf-parse'

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop()

  if (ext === 'pdf') {
    const parser = new PDFParse({ data: new Uint8Array(buffer) })
    const result = await parser.getText()
    return result.text
  }

  if (ext === 'txt' || ext === 'md') {
    return buffer.toString('utf-8')
  }

  throw new Error(`Unsupported file type: .${ext}. Use .pdf, .txt, or .md`)
}
