import { describe, expect, it } from 'vitest';
import { checkUpload, sanitizeFileName } from '../../lib/file-validation.js';

const pdf = Buffer.from('%PDF-1.4\n...');

describe('upload validation', () => {
  it('accepts a real PDF and computes its sha256', () => {
    const result = checkUpload('Bank Statement.pdf', pdf);
    expect(result).toMatchObject({ ok: true, mimeType: 'application/pdf', safeName: 'Bank_Statement.pdf', sizeBytes: pdf.length });
    if (result.ok) expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it('rejects a file whose bytes do not match the extension', () => {
    expect(checkUpload('invoice.pdf', Buffer.from('MZ\x90\x00 not a pdf'))).toMatchObject({ ok: false, statusCode: 415 });
  });

  it('rejects unsupported extensions and empty files', () => {
    expect(checkUpload('payload.exe', Buffer.from('MZ'))).toMatchObject({ ok: false, statusCode: 415 });
    expect(checkUpload('empty.pdf', Buffer.alloc(0))).toMatchObject({ ok: false, statusCode: 400 });
  });

  it('rejects binary content disguised as CSV', () => {
    expect(checkUpload('ledger.csv', Buffer.from([0x41, 0x00, 0x42]))).toMatchObject({ ok: false, statusCode: 415 });
  });

  it('strips path traversal and unsafe characters from file names', () => {
    expect(sanitizeFileName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFileName('C:\\Users\\x\\GST <March>.pdf')).toBe('GST_March.pdf');
    expect(sanitizeFileName('...')).toBe('file');
  });
});
