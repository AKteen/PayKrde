import type { Request, Response } from 'express';
import { InvestmentSchema, InvestmentUpdateSchema, type Investment } from '@kharcha/shared';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { parseBody, sendServerError, toNumber } from '../lib/helpers.js';

function mapRow(row: Record<string, unknown>): Investment {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    name: row.name as string,
    amount_invested: toNumber(row.amount_invested as string | number),
    current_value: toNumber(row.current_value as string | number),
    notes: (row.notes as string | null) ?? null,
    updated_at: row.updated_at as string,
  };
}

export async function list(req: Request, res: Response) {
  const { data, error } = await supabaseAdmin
    .from('investments')
    .select('*')
    .eq('user_id', req.userId)
    .order('updated_at', { ascending: false })
    .limit(500);

  if (error) {
    sendServerError(res, error);
    return;
  }
  res.json((data ?? []).map((row) => mapRow(row as Record<string, unknown>)));
}

export async function create(req: Request, res: Response) {
  const parsed = parseBody(res, InvestmentSchema, req.body);
  if (!parsed) return;

  const { data, error } = await supabaseAdmin
    .from('investments')
    .insert({
      user_id: req.userId,
      name: parsed.name,
      amount_invested: parsed.amount_invested,
      current_value: parsed.current_value,
      notes: parsed.notes ?? null,
    })
    .select('*')
    .single();

  if (error) {
    sendServerError(res, error);
    return;
  }
  res.status(201).json(mapRow(data as Record<string, unknown>));
}

export async function update(req: Request, res: Response) {
  const parsed = parseBody(res, InvestmentUpdateSchema, req.body);
  if (!parsed) return;

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.name !== undefined) patch.name = parsed.name;
  if (parsed.amount_invested !== undefined) patch.amount_invested = parsed.amount_invested;
  if (parsed.current_value !== undefined) patch.current_value = parsed.current_value;
  if (parsed.notes !== undefined) patch.notes = parsed.notes ?? null;

  const { data, error } = await supabaseAdmin
    .from('investments')
    .update(patch)
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .select('*')
    .maybeSingle();

  if (error) {
    sendServerError(res, error);
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
    .from('investments')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .select('id')
    .maybeSingle();

  if (error) {
    sendServerError(res, error);
    return;
  }
  if (!data) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.status(204).send();
}
