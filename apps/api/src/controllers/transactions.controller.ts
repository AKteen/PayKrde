import type { Request, Response } from 'express';
import {
  TransactionSchema,
  TransactionUpdateSchema,
  type Transaction,
  type TransactionSummary,
} from '@kharcha/shared';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { localBounds, parseBody, toLocalDateKey, toNumber } from '../lib/helpers.js';

function mapRow(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    amount: toNumber(row.amount as string | number),
    note: (row.note as string | null) ?? null,
    type: row.type as Transaction['type'],
    tags: (row.tags as Transaction['tags']) ?? [],
    occurred_at: row.occurred_at as string,
    created_at: row.created_at as string,
  };
}

export async function list(req: Request, res: Response) {
  const { from, to, type, tag } = req.query;
  let query = supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', req.userId)
    .order('occurred_at', { ascending: false });

  if (typeof from === 'string' && from) query = query.gte('occurred_at', from);
  if (typeof to === 'string' && to) query = query.lte('occurred_at', to);
  if (typeof type === 'string' && type) query = query.eq('type', type);
  if (typeof tag === 'string' && tag) query = query.contains('tags', [tag]);

  const { data, error } = await query;
  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json((data ?? []).map((row) => mapRow(row as Record<string, unknown>)));
}

export async function summary(req: Request, res: Response) {
  const tzOffsetMinutes = Number(req.query.tzOffsetMinutes ?? 0);
  const bounds = localBounds(Number.isFinite(tzOffsetMinutes) ? tzOffsetMinutes : 0);

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('amount, occurred_at, type')
    .eq('user_id', req.userId)
    .gte('occurred_at', bounds.yearFrom)
    .lt('occurred_at', bounds.yearTo);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // ASSUMPTION: daily/week/month spend and heatmap include type=spend and type=emergency (money out).
  const rows = (data ?? []).filter(
    (row) => row.type === 'spend' || row.type === 'emergency',
  );

  let today = 0;
  let week = 0;
  let month = 0;
  const byDay = new Map<string, number>();

  for (const row of rows) {
    const amount = toNumber(row.amount as string | number);
    const occurred = row.occurred_at as string;
    if (occurred >= bounds.todayFrom && occurred < bounds.todayTo) today += amount;
    if (occurred >= bounds.weekFrom && occurred < bounds.weekTo) week += amount;
    if (occurred >= bounds.monthFrom && occurred < bounds.monthTo) month += amount;
    const key = toLocalDateKey(occurred, tzOffsetMinutes);
    byDay.set(key, (byDay.get(key) ?? 0) + amount);
  }

  const payload: TransactionSummary = {
    today,
    week,
    month,
    calendar: [...byDay.entries()].map(([date, total]) => ({ date, total })),
  };
  res.json(payload);
}

export async function create(req: Request, res: Response) {
  const parsed = parseBody(TransactionSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: req.userId,
      amount: parsed.data.amount,
      note: parsed.data.note ?? null,
      type: parsed.data.type,
      tags: parsed.data.tags,
      occurred_at: parsed.data.occurred_at,
    })
    .select('*')
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.status(201).json(mapRow(data as Record<string, unknown>));
}

export async function update(req: Request, res: Response) {
  const parsed = parseBody(TransactionUpdateSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const patch: Record<string, unknown> = {};
  if (parsed.data.amount !== undefined) patch.amount = parsed.data.amount;
  if (parsed.data.note !== undefined) patch.note = parsed.data.note ?? null;
  if (parsed.data.type !== undefined) patch.type = parsed.data.type;
  if (parsed.data.tags !== undefined) patch.tags = parsed.data.tags;
  if (parsed.data.occurred_at !== undefined) patch.occurred_at = parsed.data.occurred_at;

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .update(patch)
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .select('*')
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(mapRow(data as Record<string, unknown>));
}

export async function remove(req: Request, res: Response) {
  const { data, error } = await supabaseAdmin
    .from('transactions')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .select('id')
    .maybeSingle();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).send();
}
