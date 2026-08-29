import type { Request, Response } from 'express';
import { ProfilePatchSchema, type Profile } from '@kharcha/shared';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { parseBody, sendParseError, sendServerError, toNumber } from '../lib/helpers.js';

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    full_name: (row.full_name as string | null) ?? null,
    date_of_birth: (row.date_of_birth as string | null) ?? null,
    bank_balance: toNumber(row.bank_balance as string | number),
    cash_balance: toNumber(row.cash_balance as string | number),
    created_at: row.created_at as string,
  };
}

export async function getProfile(req: Request, res: Response) {
  const existing = await supabaseAdmin.from('profiles').select('*').eq('id', req.userId).maybeSingle();
  if (existing.error) {
    sendServerError(res, existing.error);
    return;
  }
  if (existing.data) {
    res.json(mapProfile(existing.data as Record<string, unknown>));
    return;
  }

  const created = await supabaseAdmin.from('profiles').insert({ id: req.userId }).select('*').single();
  if (created.error) {
    sendServerError(res, created.error);
    return;
  }
  res.json(mapProfile(created.data as Record<string, unknown>));
}

export async function patchProfile(req: Request, res: Response) {
  const parsed = parseBody(ProfilePatchSchema, req.body);
  if (!parsed.ok) {
    sendParseError(res, parsed);
    return;
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.full_name !== undefined) patch.full_name = parsed.data.full_name;
  if (parsed.data.date_of_birth !== undefined) patch.date_of_birth = parsed.data.date_of_birth;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(patch)
    .eq('id', req.userId)
    .select('*')
    .maybeSingle();

  if (error) {
    sendServerError(res, error);
    return;
  }
  if (!data) {
    const created = await supabaseAdmin
      .from('profiles')
      .insert({ id: req.userId, ...patch })
      .select('*')
      .single();
    if (created.error) {
      sendServerError(res, created.error);
      return;
    }
    res.json(mapProfile(created.data as Record<string, unknown>));
    return;
  }
  res.json(mapProfile(data as Record<string, unknown>));
}
