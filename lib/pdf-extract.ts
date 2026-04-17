export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop()

  if (ext === 'pdf') {
    return extractPDF(buffer)
  }

  if (ext === 'docx') {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    if (!result.value?.trim()) throw new Error('Could not extract text from this Word document.')
    return result.value
  }

  if (ext === 'txt' || ext === 'md') {
    return buffer.toString('utf-8')
  }

  throw new Error(`Unsupported file type: .${ext}. Use .pdf, .docx, .txt, or .md`)
}

function extractPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const PDFParser = require('pdf2json')
    const parser = new PDFParser(null, 1)

    parser.on('pdfParser_dataError', (err: { parserError: Error }) => {
      reject(new Error(err.parserError?.message ?? 'Failed to parse PDF'))
    })

    parser.on('pdfParser_dataReady', () => {
      const text = parser.getRawTextContent()
      if (!text?.trim()) {
        reject(new Error('Could not extract text from this PDF. It may be a scanned image — try pasting your CV text instead.'))
      } else {
        resolve(text)
      }
    })

    parser.parseBuffer(buffer)
  })
}
