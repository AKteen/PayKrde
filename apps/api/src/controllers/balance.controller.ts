import type { Request, Response } from 'express';
import { BalanceAdjustSchema, type BalanceLog, type Profile } from '@kharcha/shared';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { parseBody, toNumber } from '../lib/helpers.js';

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    full_name: (row.full_name as string | null) ?? null,
    date_of_birth: (row.date_of_birth as string | null) ?? null,
    bank_balance: toNumber(row.bank_balance as string | number),
    created_at: row.created_at as string,
  };
}

function mapLog(row: Record<string, unknown>): BalanceLog {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    change_amount: toNumber(row.change_amount as string | number),
    reason: (row.reason as string | null) ?? null,
    balance_after: toNumber(row.balance_after as string | number),
    created_at: row.created_at as string,
  };
}

async function getOrCreateProfile(userId: string) {
  const existing = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (existing.error) return { error: existing.error, profile: null };
  if (existing.data) return { error: null, profile: mapProfile(existing.data as Record<string, unknown>) };

  const created = await supabaseAdmin.from('profiles').insert({ id: userId }).select('*').single();
  if (created.error) return { error: created.error, profile: null };
  return { error: null, profile: mapProfile(created.data as Record<string, unknown>) };
}

export async function getBalance(req: Request, res: Response) {
  const { error, profile } = await getOrCreateProfile(req.userId);
  if (error || !profile) {
    res.status(500).json({ error: error?.message ?? 'Failed to load profile' });
    return;
  }
  res.json({ bank_balance: profile.bank_balance });
}

export async function adjust(req: Request, res: Response) {
  const parsed = parseBody(BalanceAdjustSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { error, profile } = await getOrCreateProfile(req.userId);
  if (error || !profile) {
    res.status(500).json({ error: error?.message ?? 'Failed to load profile' });
    return;
  }

  const balanceAfter = Number((profile.bank_balance + parsed.data.change_amount).toFixed(2));

  const updated = await supabaseAdmin
    .from('profiles')
    .update({ bank_balance: balanceAfter })
    .eq('id', req.userId)
    .select('*')
    .single();

  if (updated.error) {
    res.status(500).json({ error: updated.error.message });
    return;
  }

  const log = await supabaseAdmin
    .from('balance_log')
    .insert({
      user_id: req.userId,
      change_amount: parsed.data.change_amount,
      reason: parsed.data.reason ?? null,
      balance_after: balanceAfter,
    })
    .select('*')
    .single();

  if (log.error) {
    res.status(500).json({ error: log.error.message });
    return;
  }

  res.json({
    bank_balance: balanceAfter,
    log: mapLog(log.data as Record<string, unknown>),
  });
}

export async function history(req: Request, res: Response) {
  const { data, error } = await supabaseAdmin
    .from('balance_log')
    .select('*')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json((data ?? []).map((row) => mapLog(row as Record<string, unknown>)));
}
