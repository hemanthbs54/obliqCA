import * as XLSX from 'xlsx';

export async function extractTextFromExcel(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const csv = sheet ? XLSX.utils.sheet_to_csv(sheet) : '';
    return `Sheet: ${sheetName}\n${csv}`;
  }).join('\n\n');
}
