import type { Request, Response } from 'express';
import {
  VehicleExpenseSchema,
  VehicleSchema,
  VehicleUpdateSchema,
  type Vehicle,
  type VehicleExpense,
} from '@kharcha/shared';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import { localBounds, parseBody, parseTzOffset, sendServerError, toNumber } from '../lib/helpers.js';
import { applyWalletMoves } from '../lib/wallet.js';

function mapVehicle(row: Record<string, unknown>): Vehicle {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    name: row.name as string,
    kind: row.kind as Vehicle['kind'],
    image_url: (row.image_url as string | null) ?? null,
    number_plate: (row.number_plate as string | null) ?? null,
    created_at: row.created_at as string,
  };
}

function mapExpense(row: Record<string, unknown>): VehicleExpense {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    vehicle_id: row.vehicle_id as string,
    amount: toNumber(row.amount as string | number),
    note: (row.note as string | null) ?? null,
    tags: ((row.tags as VehicleExpense['tags']) ?? []) as VehicleExpense['tags'],
    occurred_at: row.occurred_at as string,
    created_at: row.created_at as string,
  };
}

export async function list(req: Request, res: Response) {
  const { data, error } = await supabaseAdmin
    .from('vehicles')
    .select('*')
    .eq('user_id', req.userId)
    .order('created_at', { ascending: true });

  if (error) {
    sendServerError(res, error);
    return;
  }
  res.json((data ?? []).map((row) => mapVehicle(row as Record<string, unknown>)));
}

export async function create(req: Request, res: Response) {
  const parsed = parseBody(res, VehicleSchema, req.body);
  if (!parsed) return;

  const row: Record<string, unknown> = {
    user_id: req.userId,
    name: parsed.name,
    kind: parsed.kind,
  };
  if (parsed.image_url) row.image_url = parsed.image_url;
  if (parsed.number_plate) row.number_plate = parsed.number_plate;

  let inserted = await supabaseAdmin.from('vehicles').insert(row).select('*').single();
  if (inserted.error && parsed.number_plate && /number_plate/i.test(inserted.error.message ?? '')) {
    delete row.number_plate;
    inserted = await supabaseAdmin.from('vehicles').insert(row).select('*').single();
  }

  if (inserted.error) {
    sendServerError(res, inserted.error);
    return;
  }
  res.status(201).json(mapVehicle(inserted.data as Record<string, unknown>));
}

export async function update(req: Request, res: Response) {
  const parsed = parseBody(res, VehicleUpdateSchema, req.body);
  if (!parsed) return;

  const patch: Record<string, unknown> = {};
  if (parsed.name !== undefined) patch.name = parsed.name;
  if (parsed.kind !== undefined) patch.kind = parsed.kind;
  if (parsed.image_url !== undefined) patch.image_url = parsed.image_url;
  if (parsed.number_plate !== undefined) patch.number_plate = parsed.number_plate;

  const { data, error } = await supabaseAdmin
    .from('vehicles')
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
  res.json(mapVehicle(data as Record<string, unknown>));
}

export async function remove(req: Request, res: Response) {
  const { data, error } = await supabaseAdmin
    .from('vehicles')
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

export async function listExpenses(req: Request, res: Response) {
  let query = supabaseAdmin
    .from('vehicle_expenses')
    .select('*')
    .eq('user_id', req.userId)
    .order('occurred_at', { ascending: false });

  if (req.params.id) query = query.eq('vehicle_id', req.params.id);

  const { data, error } = await query.limit(1_000);
  if (error) {
    sendServerError(res, error);
    return;
  }
  res.json((data ?? []).map((row) => mapExpense(row as Record<string, unknown>)));
}

export async function addExpense(req: Request, res: Response) {
  const parsed = parseBody(res, VehicleExpenseSchema, req.body);
  if (!parsed) return;

  const owned = await supabaseAdmin
    .from('vehicles')
    .select('id')
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .maybeSingle();

  if (owned.error) {
    sendServerError(res, owned.error);
    return;
  }
  if (!owned.data) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }

  const { data, error } = await supabaseAdmin
    .from('vehicle_expenses')
    .insert({
      user_id: req.userId,
      vehicle_id: req.params.id,
      amount: parsed.amount,
      note: parsed.note ?? null,
      tags: parsed.tags,
      occurred_at: parsed.occurred_at,
    })
    .select('*')
    .single();

  if (error) {
    sendServerError(res, error);
    return;
  }

  const walletRes = await applyWalletMoves(req.userId, [{ wallet: 'bank', delta: -parsed.amount }], parsed.note ?? 'Vehicle expense');
  if (walletRes.error) {
    await supabaseAdmin.from('vehicle_expenses').delete().eq('id', (data as { id: string }).id).eq('user_id', req.userId);
    sendServerError(res, walletRes.error);
    return;
  }

  res.status(201).json(mapExpense(data as Record<string, unknown>));
}

export async function summary(req: Request, res: Response) {
  const tzOffsetMinutes = parseTzOffset(req.query.tzOffsetMinutes);
  const bounds = localBounds(tzOffsetMinutes);
  const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId : null;
  if (vehicleId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(vehicleId)) {
    res.status(400).json({ error: 'Invalid id' });
    return;
  }

  let query = supabaseAdmin
    .from('vehicle_expenses')
    .select('*')
    .eq('user_id', req.userId)
    .order('occurred_at', { ascending: false });

  if (vehicleId) query = query.eq('vehicle_id', vehicleId);

  const { data, error } = await query.limit(2_000);
  if (error) {
    sendServerError(res, error);
    return;
  }

  const rows = (data ?? []).map((row) => mapExpense(row as Record<string, unknown>));
  const petrol = rows.filter((row) => row.tags.includes('petrol'));
  const maintenance = rows.filter((row) => row.tags.includes('maintenance'));
  const weekPetrol = petrol
    .filter((row) => row.occurred_at >= bounds.weekFrom && row.occurred_at < bounds.weekTo)
    .reduce((sum, row) => sum + row.amount, 0);

  res.json({
    lastPetrol: petrol[0] ?? null,
    lastMaintenance: maintenance[0] ?? null,
    weekPetrol,
  });
}
