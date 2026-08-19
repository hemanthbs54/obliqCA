import { extractTextFromPdf } from './pdf.js';
import { extractTextFromExcel } from './excel.js';

export async function extractText(buffer: Buffer, mimeType: string | null, fileName: string): Promise<string> {
  const lowerName = fileName.toLowerCase();

  if (mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return extractTextFromPdf(buffer);
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-excel' ||
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.xls') ||
    lowerName.endsWith('.csv')
  ) {
    return extractTextFromExcel(buffer);
  }

  // Fall back to treating the upload as plain text.
  return buffer.toString('utf-8');
}
