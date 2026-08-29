import type { Response } from 'express';
import type { z } from 'zod';
import { zodFieldErrors } from '@kharcha/shared';

export function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (value == null || value === '') return 0;
  return Number(value);
}

/** Validate `data` with Zod. On failure, send 400 and return undefined. */
export function parseBody<S extends z.ZodTypeAny>(
  res: Response,
  schema: S,
  data: unknown,
): z.output<S> | undefined {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const { error, fields } = zodFieldErrors(parsed.error);
    res.status(400).json({ error, fields });
    return undefined;
  }
  return parsed.data;
}

export function sendServerError(res: Response, _err?: { message?: string } | unknown) {
  const message =
    process.env.NODE_ENV !== 'production' &&
    _err &&
    typeof _err === 'object' &&
    'message' in _err &&
    typeof (_err as { message: unknown }).message === 'string'
      ? (_err as { message: string }).message
      : 'Something went wrong';
  res.status(500).json({ error: message });
}

/** Clamp client timezone offset to a real range so summary windows cannot be shifted arbitrarily. */
export function parseTzOffset(value: unknown): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = typeof raw === 'string' || typeof raw === 'number' ? Number(raw) : 0;
  if (!Number.isFinite(n)) return 0;
  return Math.max(-840, Math.min(840, Math.round(n)));
}

/** ASSUMPTION: client sends getTimezoneOffset() so "today"/week/month use the user's local calendar. */
export function localBounds(tzOffsetMinutes: number) {
  const nowUtc = Date.now();
  const localNow = new Date(nowUtc - tzOffsetMinutes * 60_000);

  const y = localNow.getUTCFullYear();
  const m = localNow.getUTCMonth();
  const d = localNow.getUTCDate();

  const startOfLocalDayUtc = Date.UTC(y, m, d) + tzOffsetMinutes * 60_000;
  const startOfTomorrowUtc = startOfLocalDayUtc + 24 * 60 * 60 * 1000;

  const dayOfWeek = localNow.getUTCDay(); // 0 Sun
  // ASSUMPTION: week starts Monday.
  const daysFromMonday = (dayOfWeek + 6) % 7;
  const startOfWeekUtc = startOfLocalDayUtc - daysFromMonday * 24 * 60 * 60 * 1000;

  const startOfMonthUtc = Date.UTC(y, m, 1) + tzOffsetMinutes * 60_000;
  const startOfYearUtc = Date.UTC(y, 0, 1) + tzOffsetMinutes * 60_000;
  const startOfNextYearUtc = Date.UTC(y + 1, 0, 1) + tzOffsetMinutes * 60_000;

  return {
    year: y,
    todayFrom: new Date(startOfLocalDayUtc).toISOString(),
    todayTo: new Date(startOfTomorrowUtc).toISOString(),
    weekFrom: new Date(startOfWeekUtc).toISOString(),
    weekTo: new Date(startOfTomorrowUtc).toISOString(),
    monthFrom: new Date(startOfMonthUtc).toISOString(),
    monthTo: new Date(startOfTomorrowUtc).toISOString(),
    yearFrom: new Date(startOfYearUtc).toISOString(),
    yearTo: new Date(startOfNextYearUtc).toISOString(),
    daysElapsed: d,
  };
}

export function toLocalDateKey(iso: string, tzOffsetMinutes: number): string {
  const local = new Date(new Date(iso).getTime() - tzOffsetMinutes * 60_000);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const d = String(local.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function localHour(iso: string, tzOffsetMinutes: number): number {
  const local = new Date(new Date(iso).getTime() - tzOffsetMinutes * 60_000);
  return local.getUTCHours() + local.getUTCMinutes() / 60;
}
