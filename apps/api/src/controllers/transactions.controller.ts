import type { Request, Response } from 'express';
import {
  MEAL_TAGS,
  PAYMENT_MODES,
  TransactionListQuerySchema,
  TransactionSchema,
  TransactionUpdateSchema,
  isFoodTag,
  mealTagFromHour,
  withDefaultPayment,
  type MealTag,
  type MealTotals,
  type TagTotal,
  type Transaction,
  type TransactionSummary,
  type TransactionType,
} from '@kharcha/shared';
import { supabaseAdmin } from '../lib/supabase-admin.js';
import {
  localBounds,
  localHour,
  parseBody,
  parseTzOffset,
  sendServerError,
  toLocalDateKey,
  toNumber,
} from '../lib/helpers.js';
import { applyWalletMoves, netWalletMoves, spendWalletDelta } from '../lib/wallet.js';

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

function firstQuery(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

export async function list(req: Request, res: Response) {
  const parsed = parseBody(res, TransactionListQuerySchema, {
    from: firstQuery(req.query.from),
    to: firstQuery(req.query.to),
    type: firstQuery(req.query.type),
    tag: firstQuery(req.query.tag),
    payment: firstQuery(req.query.payment),
    sort: firstQuery(req.query.sort) || 'newest',
    minAmount: firstQuery(req.query.minAmount),
    maxAmount: firstQuery(req.query.maxAmount),
    q: firstQuery(req.query.q),
  });
  if (!parsed) return;

  const { from, to, type, tag, payment, sort, minAmount, maxAmount, q } = parsed;
  const ascending = sort === 'oldest';
  let query = supabaseAdmin.from('transactions').select('*').eq('user_id', req.userId);

  if (from) query = query.gte('occurred_at', from);
  if (to) query = query.lte('occurred_at', to);
  if (type) query = query.eq('type', type);
  if (tag) query = query.contains('tags', [tag]);
  if (payment) query = query.contains('tags', [payment]);
  if (minAmount != null) query = query.gte('amount', minAmount);
  if (maxAmount != null) query = query.lte('amount', maxAmount);
  const noteQuery = typeof q === 'string' ? q.replace(/[%_\\]/g, '').trim() : '';
  if (noteQuery) query = query.ilike('note', `%${noteQuery}%`);

  if (sort === 'amount') query = query.order('amount', { ascending: false }).order('occurred_at', { ascending: false });
  else query = query.order('occurred_at', { ascending });

  const { data, error } = await query.limit(2_000);
  if (error) {
    sendServerError(res, error);
    return;
  }
  res.json((data ?? []).map((row) => mapRow(row as Record<string, unknown>)));
}

export async function summary(req: Request, res: Response) {
  const tzOffsetMinutes = parseTzOffset(req.query.tzOffsetMinutes);
  const bounds = localBounds(tzOffsetMinutes);

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .select('amount, occurred_at, type, tags')
    .eq('user_id', req.userId)
    .limit(10_000);

  if (error) {
    sendServerError(res, error);
    return;
  }

  const additionsQuery = await supabaseAdmin
    .from('balance_log')
    .select('change_amount, created_at')
    .eq('user_id', req.userId)
    .gt('change_amount', 0)
    .gte('created_at', bounds.yearFrom)
    .lt('created_at', bounds.yearTo);

  const profileQuery = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.userId)
    .maybeSingle();

  const vehicleQuery = await supabaseAdmin
    .from('vehicle_expenses')
    .select('amount, occurred_at, tags')
    .eq('user_id', req.userId);

  const allRows = data ?? [];
  const spendRows = allRows.filter((row) => row.type === 'spend' || row.type === 'emergency');

  let today = 0;
  let week = 0;
  let month = 0;
  const byDay = new Map<string, number>();
  const meals: MealTotals = { breakfast: 0, lunch: 0, snack: 0, dinner: 0 };
  const udhar = { borrowed: 0, lent: 0 };
  const byTypeMonth: Record<TransactionType, number> = {
    spend: 0,
    udhar_taken: 0,
    udhar_given: 0,
    emergency: 0,
    udhar_repay: 0,
    udhar_collect: 0,
  };
  const catMonth = new Map<string, number>();
  const catYear = new Map<string, number>();
  const food = { today: 0, week: 0, month: 0 };
  const paymentMonth = { online: 0, cash: 0, upi: 0, card: 0 };
  const mealsLoggedToday = new Set<MealTag>();
  const mealsByDay = new Map<string, Set<MealTag>>();

  function addTag(map: Map<string, number>, tag: string, amount: number) {
    map.set(tag, (map.get(tag) ?? 0) + amount);
  }

  for (const row of allRows) {
    const amount = toNumber(row.amount as string | number);
    const occurred = row.occurred_at as string;
    const type = row.type as TransactionType;
    if (type === 'udhar_taken') udhar.borrowed += amount;
    if (type === 'udhar_repay') udhar.borrowed -= amount;
    if (type === 'udhar_given') udhar.lent += amount;
    if (type === 'udhar_collect') udhar.lent -= amount;
    if (occurred >= bounds.monthFrom && occurred < bounds.monthTo && type in byTypeMonth) {
      byTypeMonth[type] += amount;
    }
  }

  for (const row of spendRows) {
    const amount = toNumber(row.amount as string | number);
    const occurred = row.occurred_at as string;
    const tags = (row.tags as string[] | null) ?? [];
    const inMonth = occurred >= bounds.monthFrom && occurred < bounds.monthTo;
    const inYear = occurred >= bounds.yearFrom && occurred < bounds.yearTo;
    const inToday = occurred >= bounds.todayFrom && occurred < bounds.todayTo;
    if (inToday) {
      today += amount;
      const tagged = MEAL_TAGS.find((tag) => tags.includes(tag));
      if (tagged) meals[tagged] += amount;
      for (const meal of MEAL_TAGS) {
        if (tags.includes(meal)) mealsLoggedToday.add(meal);
      }
    }
    if (occurred >= bounds.weekFrom && occurred < bounds.weekTo) week += amount;
    if (inMonth) month += amount;
    if (inYear) {
      const key = toLocalDateKey(occurred, tzOffsetMinutes);
      byDay.set(key, (byDay.get(key) ?? 0) + amount);
    }
    if (tags.some(isFoodTag)) {
      if (inToday) food.today += amount;
      if (occurred >= bounds.weekFrom && occurred < bounds.weekTo) food.week += amount;
      if (inMonth) food.month += amount;
    }
    if (inMonth) {
      const paid = PAYMENT_MODES.find((mode) => tags.includes(mode));
      if (paid) paymentMonth[paid] += amount;
    }
    if (inMonth || inYear) {
      const key = toLocalDateKey(occurred, tzOffsetMinutes);
      const set = mealsByDay.get(key) ?? new Set<MealTag>();
      for (const meal of MEAL_TAGS) {
        if (tags.includes(meal)) set.add(meal);
      }
      if (set.size) mealsByDay.set(key, set);
    }
    for (const tag of tags) {
      if (inMonth) addTag(catMonth, tag, amount);
      if (inYear) addTag(catYear, tag, amount);
    }
  }

  let lastPetrolAt: string | null = null;
  for (const row of vehicleQuery.data ?? []) {
    const amount = toNumber(row.amount as string | number);
    const occurred = row.occurred_at as string;
    const tags = (row.tags as string[] | null) ?? [];
    const inMonth = occurred >= bounds.monthFrom && occurred < bounds.monthTo;
    const inYear = occurred >= bounds.yearFrom && occurred < bounds.yearTo;
    if (tags.includes('petrol') && (!lastPetrolAt || occurred > lastPetrolAt)) {
      lastPetrolAt = occurred;
    }
    for (const tag of tags) {
      if (inMonth) addTag(catMonth, tag, amount);
      if (inYear) addTag(catYear, tag, amount);
    }
  }

  const additions = { today: 0, week: 0, month: 0 };
  for (const row of additionsQuery.data ?? []) {
    const amount = toNumber(row.change_amount as string | number);
    const created = row.created_at as string;
    if (created >= bounds.todayFrom && created < bounds.todayTo) additions.today += amount;
    if (created >= bounds.weekFrom && created < bounds.weekTo) additions.week += amount;
    if (created >= bounds.monthFrom && created < bounds.monthTo) additions.month += amount;
  }

  function toTagTotals(map: Map<string, number>): TagTotal[] {
    return [...map.entries()]
      .map(([tag, total]) => ({ tag, total: Math.round(total * 100) / 100 }))
      .sort((a, b) => b.total - a.total);
  }

  const daysElapsed = Math.max(1, bounds.daysElapsed);
  const spent = { today, week, month };
  const payload: TransactionSummary = {
    today,
    week,
    month,
    spent,
    additions,
    balance: toNumber(profileQuery.data?.bank_balance as string | number | undefined),
    cashBalance: toNumber(profileQuery.data?.cash_balance as string | number | undefined),
    meals,
    mealsLoggedToday: [...mealsLoggedToday],
    mealsCalendar: [...mealsByDay.entries()].map(([date, set]) => ({ date, meals: [...set] })),
    calendar: [...byDay.entries()].map(([date, total]) => ({ date, total })),
    udhar: {
      borrowed: Math.max(0, Math.round(udhar.borrowed * 100) / 100),
      lent: Math.max(0, Math.round(udhar.lent * 100) / 100),
    },
    byTypeMonth,
    byCategoryMonth: toTagTotals(catMonth),
    byCategoryYear: toTagTotals(catYear),
    dailyAvg: Math.round((month / daysElapsed) * 100) / 100,
    daysElapsed,
    food: {
      ...food,
      dailyAvg: Math.round((food.month / daysElapsed) * 100) / 100,
    },
    paymentMonth,
    lastPetrolAt,
  };
  res.json(payload);
}

export async function create(req: Request, res: Response) {
  const parsed = parseBody(res, TransactionSchema, req.body);
  if (!parsed) return;

  const tzOffsetMinutes = parseTzOffset(req.body?.tzOffsetMinutes);
  const tags = withDefaultPayment([...(parsed.tags ?? [])]);
  const hasMeal = MEAL_TAGS.some((tag) => tags.includes(tag));
  if (!hasMeal && parsed.type === 'spend') {
    const meal = mealTagFromHour(localHour(parsed.occurred_at, tzOffsetMinutes));
    if (meal) tags.push(meal);
  }

  const { data, error } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: req.userId,
      amount: parsed.amount,
      note: parsed.note ?? null,
      type: parsed.type,
      tags,
      occurred_at: parsed.occurred_at,
    })
    .select('*')
    .single();

  if (error) {
    sendServerError(res, error);
    return;
  }

  const effect = spendWalletDelta(parsed.type, parsed.amount, tags);
  if (effect) {
    const walletRes = await applyWalletMoves(req.userId, [effect], parsed.note ?? 'Spend');
    if (walletRes.error) {
      await supabaseAdmin.from('transactions').delete().eq('id', (data as { id: string }).id).eq('user_id', req.userId);
      sendServerError(res, walletRes.error);
      return;
    }
  }

  res.status(201).json(mapRow(data as Record<string, unknown>));
}

export async function update(req: Request, res: Response) {
  const parsed = parseBody(res, TransactionUpdateSchema, req.body);
  if (!parsed) return;

  const existing = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .maybeSingle();

  if (existing.error) {
    sendServerError(res, existing.error);
    return;
  }
  if (!existing.data) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const prev = mapRow(existing.data as Record<string, unknown>);
  const nextType = parsed.type ?? prev.type;
  const nextAmount = parsed.amount ?? prev.amount;
  const nextTags = parsed.tags !== undefined ? withDefaultPayment(parsed.tags) : prev.tags;

  const patch: Record<string, unknown> = {};
  if (parsed.amount !== undefined) patch.amount = parsed.amount;
  if (parsed.note !== undefined) patch.note = parsed.note ?? null;
  if (parsed.type !== undefined) patch.type = parsed.type;
  if (parsed.tags !== undefined) patch.tags = nextTags;
  if (parsed.occurred_at !== undefined) patch.occurred_at = parsed.occurred_at;

  const { data, error } = await supabaseAdmin
    .from('transactions')
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

  const moves = netWalletMoves(
    spendWalletDelta(prev.type, prev.amount, prev.tags),
    spendWalletDelta(nextType, nextAmount, nextTags),
  );
  if (moves.length) {
    const walletRes = await applyWalletMoves(req.userId, moves, parsed.note ?? prev.note ?? 'Spend');
    if (walletRes.error) {
      await supabaseAdmin
        .from('transactions')
        .update({
          amount: prev.amount,
          note: prev.note,
          type: prev.type,
          tags: prev.tags,
          occurred_at: prev.occurred_at,
        })
        .eq('id', prev.id)
        .eq('user_id', req.userId);
      sendServerError(res, walletRes.error);
      return;
    }
  }

  res.json(mapRow(data as Record<string, unknown>));
}

export async function remove(req: Request, res: Response) {
  const existing = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('id', req.params.id)
    .eq('user_id', req.userId)
    .maybeSingle();

  if (existing.error) {
    sendServerError(res, existing.error);
    return;
  }
  if (!existing.data) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  const prev = mapRow(existing.data as Record<string, unknown>);
  const { data, error } = await supabaseAdmin
    .from('transactions')
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

  const moves = netWalletMoves(spendWalletDelta(prev.type, prev.amount, prev.tags), null);
  if (moves.length) {
    const walletRes = await applyWalletMoves(req.userId, moves, prev.note ?? 'Spend deleted');
    if (walletRes.error) {
      await supabaseAdmin.from('transactions').insert({
        id: prev.id,
        user_id: req.userId,
        amount: prev.amount,
        note: prev.note,
        type: prev.type,
        tags: prev.tags,
        occurred_at: prev.occurred_at,
        created_at: prev.created_at,
      });
      sendServerError(res, walletRes.error);
      return;
    }
  }

  res.status(204).send();
}
