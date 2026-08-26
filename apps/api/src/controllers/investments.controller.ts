import type { Request, Response } from 'express';
import { InvestmentSchema, InvestmentUpdateSchema, type Investment } from '@kharcha/shared';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { parseBody, toNumber } from '../lib/helpers.js';

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
    .order('updated_at', { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json((data ?? []).map((row) => mapRow(row as Record<string, unknown>)));
}

export async function create(req: Request, res: Response) {
  const parsed = parseBody(InvestmentSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('investments')
    .insert({
      user_id: req.userId,
      name: parsed.data.name,
      amount_invested: parsed.data.amount_invested,
      current_value: parsed.data.current_value,
      notes: parsed.data.notes ?? null,
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
  const parsed = parseBody(InvestmentUpdateSchema, req.body);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.amount_invested !== undefined) patch.amount_invested = parsed.data.amount_invested;
  if (parsed.data.current_value !== undefined) patch.current_value = parsed.data.current_value;
  if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes ?? null;

  const { data, error } = await supabaseAdmin
    .from('investments')
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
    .from('investments')
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
