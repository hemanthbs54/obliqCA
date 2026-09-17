import { describe, expect, it } from 'vitest';
import { toApiError } from '../../lib/errors.js';

describe('database error mapping', () => {
  it('uses the HTTP status the database function chose (PTxxx)', () => {
    expect(toApiError({ code: 'PT409', message: 'stale' })).toMatchObject({ statusCode: 409, message: 'stale' });
    expect(toApiError({ code: 'PT403', message: 'maker-checker' })).toMatchObject({ statusCode: 403 });
    expect(toApiError({ code: 'PT404', message: 'Document not found' })).toMatchObject({ statusCode: 404 });
  });

  it('maps permission and invalid-id errors, and hides nothing else as success', () => {
    expect(toApiError({ code: '42501', message: 'permission denied for table audit_events' }).statusCode).toBe(403);
    expect(toApiError({ code: '22P02', message: 'invalid input syntax for type uuid' }).statusCode).toBe(400);
    expect(toApiError({ code: 'XX000', message: 'boom' }).statusCode).toBe(500);
  });
});
