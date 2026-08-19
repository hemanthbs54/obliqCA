// pdf-parse ships without types for its default export shape in ESM interop;
// requiring it directly avoids pulling in its debug-mode test harness.
import pdfParse from 'pdf-parse';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const result = await pdfParse(buffer);
  return result.text.trim();
}
