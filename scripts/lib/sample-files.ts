/**
 * Tiny but valid sample files for the demo seed (no binary fixtures in git).
 */

function pdfEscape(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** Builds a minimal multi-page PDF with a few lines of Helvetica text per page. */
export function makePdf(title: string, pages: string[][]): Buffer {
  const objects: string[] = [];
  const pageIds: number[] = [];

  // 1: catalog, 2: pages tree, 3: font — page objects follow.
  const fontId = 3;
  let nextId = 4;
  const pageObjects: string[] = [];

  pages.forEach((lines, index) => {
    const pageId = nextId++;
    const contentId = nextId++;
    pageIds.push(pageId);

    const text = [
      'BT',
      '/F1 16 Tf',
      '56 780 Td',
      `(${pdfEscape(title)}) Tj`,
      '/F1 11 Tf',
      '0 -28 Td',
      ...lines.flatMap((line) => [`(${pdfEscape(line)}) Tj`, '0 -18 Td']),
      `(Page ${index + 1} of ${pages.length}) Tj`,
      'ET',
    ].join('\n');

    pageObjects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    pageObjects[contentId] = `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`;
  });

  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  objects[fontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  pageObjects.forEach((body, id) => {
    if (body) objects[id] = body;
  });

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (let id = 1; id < objects.length; id++) {
    offsets[id] = Buffer.byteLength(pdf);
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id++) {
    pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'binary');
}

export function makeCsv(rows: (string | number)[][]): Buffer {
  return Buffer.from(rows.map((row) => row.join(',')).join('\n') + '\n', 'utf8');
}
