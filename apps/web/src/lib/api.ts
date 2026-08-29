import { z } from 'zod';
import { zodFieldErrors, type FieldErrors } from '@kharcha/shared';
import { supabase } from './supabase-client';

export class ApiError extends Error {
  fields: FieldErrors;
  status: number;

  constructor(message: string, fields: FieldErrors = {}, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.fields = fields;
    this.status = status;
  }
}

export function issuesFromZod(error: z.ZodError): { error: string; fields: FieldErrors } {
  return zodFieldErrors(error);
}

async function authHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as { error?: unknown; fields?: FieldErrors };
    const fields = body.fields && typeof body.fields === 'object' ? body.fields : {};
    if (typeof body.error === 'string') return new ApiError(body.error, fields, res.status);
    if (body.error && typeof body.error === 'object') {
      return new ApiError('Please check the form and try again.', fields, res.status);
    }
    return new ApiError(res.statusText || 'Request failed', fields, res.status);
  } catch {
    return new ApiError(res.statusText || 'Request failed', {}, res.status);
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      ...(await authHeader()),
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    throw await parseError(res);
  }

  return (await res.json()) as T;
}
