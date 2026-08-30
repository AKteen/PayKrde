import { walletFromTags, type TransactionType, type WalletKind } from '@kharcha/shared';
import { supabaseAdmin } from './supabase-admin.js';
import { toNumber } from './helpers.js';

export type WalletDelta = { wallet: WalletKind; delta: number };

export type WalletApplyResult = {
  error: { message?: string } | null;
  bank_balance?: number;
  cash_balance?: number;
  log?: Record<string, unknown> | null;
};

const OUTFLOW_TYPES = new Set<TransactionType>(['spend', 'emergency']);

export function spendWalletDelta(
  type: string,
  amount: number,
  tags?: string[] | null,
): WalletDelta | null {
  if (!OUTFLOW_TYPES.has(type as TransactionType)) return null;
  const value = Math.abs(Number(amount) || 0);
  if (!value) return null;
  return { wallet: walletFromTags(tags), delta: -value };
}

export function netWalletMoves(from: WalletDelta | null, to: WalletDelta | null): WalletDelta[] {
  if (!from && !to) return [];
  if (from && to && from.wallet === to.wallet) {
    const delta = Number((to.delta - from.delta).toFixed(2));
    return delta ? [{ wallet: from.wallet, delta }] : [];
  }
  const moves: WalletDelta[] = [];
  if (from) moves.push({ wallet: from.wallet, delta: Number((-from.delta).toFixed(2)) });
  if (to) moves.push(to);
  return moves.filter((move) => move.delta !== 0);
}

export async function applyWalletDelta(
  userId: string,
  wallet: WalletKind,
  delta: number,
  reason?: string | null,
  options?: { requireLog?: boolean },
): Promise<WalletApplyResult> {
  if (!Number.isFinite(delta) || delta === 0) return { error: null };

  const existing = await supabaseAdmin.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (existing.error) return { error: existing.error };

  let bank = toNumber(existing.data?.bank_balance as string | number | undefined);
  let cash = toNumber(existing.data?.cash_balance as string | number | undefined);

  if (!existing.data) {
    const created = await supabaseAdmin.from('profiles').insert({ id: userId }).select('*').single();
    if (created.error) return { error: created.error };
    bank = toNumber(created.data?.bank_balance as string | number | undefined);
    cash = toNumber(created.data?.cash_balance as string | number | undefined);
  }

  const current = wallet === 'cash' ? cash : bank;
  const after = Number((current + delta).toFixed(2));
  const patch = wallet === 'cash' ? { cash_balance: after } : { bank_balance: after };

  const updated = await supabaseAdmin.from('profiles').update(patch).eq('id', userId).select('*').single();
  if (updated.error) return { error: updated.error };

  const bank_balance = wallet === 'bank' ? after : bank;
  const cash_balance = wallet === 'cash' ? after : cash;

  let log = await supabaseAdmin
    .from('balance_log')
    .insert({
      user_id: userId,
      change_amount: delta,
      reason: reason ?? null,
      balance_after: after,
      wallet,
    })
    .select('*')
    .single();

  if (log.error) {
    log = await supabaseAdmin
      .from('balance_log')
      .insert({
        user_id: userId,
        change_amount: delta,
        reason: reason ?? null,
        balance_after: after,
      })
      .select('*')
      .single();
  }

  if (log.error && options?.requireLog !== false) {
    return { error: log.error, bank_balance, cash_balance };
  }

  return {
    error: null,
    bank_balance,
    cash_balance,
    log: log.error ? null : (log.data as Record<string, unknown>),
  };
}

export async function applyWalletMoves(
  userId: string,
  moves: WalletDelta[],
  reason?: string | null,
): Promise<{ error: { message?: string } | null }> {
  const applied: WalletDelta[] = [];
  for (const move of moves) {
    const result = await applyWalletDelta(userId, move.wallet, move.delta, reason, { requireLog: false });
    if (result.error) {
      for (const prev of [...applied].reverse()) {
        await applyWalletDelta(userId, prev.wallet, -prev.delta, reason, { requireLog: false });
      }
      return { error: result.error };
    }
    applied.push(move);
  }
  return { error: null };
}
