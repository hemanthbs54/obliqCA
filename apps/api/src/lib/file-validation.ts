import { createHash } from 'node:crypto';

/**
 * Upload allow-list. The browser-supplied MIME type is not trusted: the
 * file's leading bytes must match what the extension claims.
 */
const ALLOWED: Record<string, { mime: string; magic?: number[] }> = {
  pdf: { mime: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
  png: { mime: 'image/png', magic: [0x89, 0x50, 0x4e, 0x47] },
  jpg: { mime: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
  jpeg: { mime: 'image/jpeg', magic: [0xff, 0xd8, 0xff] },
  xlsx: { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', magic: [0x50, 0x4b, 0x03, 0x04] },
  xls: { mime: 'application/vnd.ms-excel', magic: [0xd0, 0xcf, 0x11, 0xe0] },
  csv: { mime: 'text/csv' },
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED);

export type FileCheck =
  | { ok: true; mimeType: string; safeName: string; sha256: string; sizeBytes: number }
  | { ok: false; statusCode: 400 | 415; message: string };

export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'file';
  const cleaned = base
    .normalize('NFKD')
    .replace(/[^\w.\- ]+/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(-120);
  return cleaned.replace(/^\.+/, '') || 'file';
}

export function checkUpload(fileName: string, buffer: Buffer): FileCheck {
  if (buffer.length === 0) {
    return { ok: false, statusCode: 400, message: 'The uploaded file is empty' };
  }

  const safeName = sanitizeFileName(fileName);
  const extension = safeName.includes('.') ? safeName.split('.').pop()!.toLowerCase() : '';
  const rule = ALLOWED[extension];
  if (!rule) {
    return {
      ok: false,
      statusCode: 415,
      message: `Unsupported file type. Allowed: ${ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(', ')}`,
    };
  }

  if (rule.magic && !rule.magic.every((byte, i) => buffer[i] === byte)) {
    return { ok: false, statusCode: 415, message: `File content does not match its .${extension} extension` };
  }
  if (!rule.magic && buffer.subarray(0, 4096).includes(0)) {
    return { ok: false, statusCode: 415, message: 'CSV files must be plain text' };
  }

  return {
    ok: true,
    mimeType: rule.mime,
    safeName,
    sha256: createHash('sha256').update(buffer).digest('hex'),
    sizeBytes: buffer.length,
  };
}
