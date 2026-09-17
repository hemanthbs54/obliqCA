export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface PostgrestLikeError {
  code?: string;
  message: string;
}

/**
 * Maps a Supabase/PostgREST error to an HTTP error. The workflow functions
 * raise SQLSTATE "PTxxx" codes (PostgREST's convention for "respond with
 * HTTP xxx"), so the database decides the status code, not the route.
 */
export function toApiError(error: PostgrestLikeError): ApiError {
  const code = error.code ?? '';
  const custom = /^PT(\d{3})$/.exec(code);
  if (custom) return new ApiError(Number(custom[1]), error.message);
  if (code === '42501') return new ApiError(403, 'You do not have permission to do that');
  if (code === 'PGRST116') return new ApiError(404, 'Not found');
  if (code === '22P02') return new ApiError(400, 'Invalid identifier');
  return new ApiError(500, error.message);
}

export function unwrap<T>(result: { data: T | null; error: PostgrestLikeError | null }): T {
  if (result.error) throw toApiError(result.error);
  return result.data as T;
}
