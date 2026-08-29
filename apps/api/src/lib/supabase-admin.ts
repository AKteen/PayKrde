import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

try {
  const here = path.dirname(fileURLToPath(import.meta.url));
  dotenv.config({ path: path.resolve(here, '../../../../.env') });
  dotenv.config({ path: path.resolve(here, '../../../../.env.local') });
} catch {
  dotenv.config();
}

function credentials() {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}

export function isSupabaseConfigured() {
  const { url, key } = credentials();
  return Boolean(url && key);
}

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const { url, key } = credentials();
  if (!url || !key) {
    throw new Error('Server is not configured');
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getSupabaseAdmin(), prop, receiver);
    return typeof value === 'function' ? value.bind(getSupabaseAdmin()) : value;
  },
});
