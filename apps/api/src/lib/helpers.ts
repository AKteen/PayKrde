export function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (value == null || value === '') return 0;
  return Number(value);
}

export function parseBody<T>(
  schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false; error: { flatten: () => unknown } } },
  data: unknown,
): { ok: true; data: T } | { ok: false; error: unknown } {
  const parsed = schema.safeParse(data);
  if (!parsed.success) return { ok: false, error: parsed.error.flatten() };
  return { ok: true, data: parsed.data };
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
  };
}

export function toLocalDateKey(iso: string, tzOffsetMinutes: number): string {
  const local = new Date(new Date(iso).getTime() - tzOffsetMinutes * 60_000);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const d = String(local.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
