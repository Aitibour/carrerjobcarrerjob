/* eslint-disable @typescript-eslint/no-explicit-any */

// Polyfill browser APIs required by pdfjs-dist in Node.js / serverless
if (typeof (global as any).DOMMatrix === 'undefined') {
  (global as any).DOMMatrix = class DOMMatrix {
    a=1;b=0;c=0;d=1;e=0;f=0
    constructor(_init?: string | number[]) {}
    static fromMatrix() { return new (global as any).DOMMatrix() }
    static fromFloat32Array() { return new (global as any).DOMMatrix() }
    static fromFloat64Array() { return new (global as any).DOMMatrix() }
  }
}
if (typeof (global as any).Path2D === 'undefined') {
  (global as any).Path2D = class Path2D {}
}

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop()

  if (ext === 'pdf') {
    const { extractText: pdfExtract } = await import('unpdf')
    const result = await pdfExtract(new Uint8Array(buffer), { mergePages: true })
    const text = Array.isArray(result.text) ? result.text.join('\n') : result.text
    if (!text?.trim()) throw new Error('Could not extract text from this PDF. It may be a scanned image — try pasting your CV text instead.')
    return text
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
