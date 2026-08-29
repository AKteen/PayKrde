import { CORE_MEALS, type CoreMeal, type MealTag, type TransactionSummary } from '@kharcha/shared';

/** ASSUMPTION: remind to fill petrol if the last fill was 7+ days ago (or never). */
export const PETROL_REMIND_DAYS = 7;

export type Reminder = {
  id: string;
  kind: 'meal' | 'petrol' | 'udhar';
  title: string;
  detail: string;
  href: string;
};

const MEAL_COPY: Record<CoreMeal, { miss: string; afterHour: number }> = {
  breakfast: { miss: "You haven't eaten breakfast", afterHour: 10 },
  lunch: { miss: "You haven't eaten lunch", afterHour: 14 },
  dinner: { miss: "You haven't eaten dinner", afterHour: 20 },
};

export function buildReminders(summary: TransactionSummary, now = new Date()): Reminder[] {
  const items: Reminder[] = [];
  const hour = now.getHours() + now.getMinutes() / 60;
  const logged = new Set<MealTag>(summary.mealsLoggedToday ?? []);

  for (const meal of CORE_MEALS) {
    const spec = MEAL_COPY[meal];
    if (hour >= spec.afterHour && !logged.has(meal)) {
      items.push({
        id: `meal-${meal}`,
        kind: 'meal',
        title: spec.miss,
        detail: 'Log a meal when you eat so diet stays honest.',
        href: '/diet',
      });
    }
  }

  const lastPetrol = summary.lastPetrolAt ? new Date(summary.lastPetrolAt) : null;
  const daysSince = lastPetrol
    ? Math.floor((now.getTime() - lastPetrol.getTime()) / 86_400_000)
    : PETROL_REMIND_DAYS + 1;
  if (!lastPetrol || daysSince >= PETROL_REMIND_DAYS) {
    items.push({
      id: 'petrol',
      kind: 'petrol',
      title: lastPetrol ? 'Petrol filling due' : 'No petrol fill logged',
      detail: lastPetrol
        ? `Last fill was ${daysSince} day${daysSince === 1 ? '' : 's'} ago.`
        : 'Log a fill on Vehicles when you next tank up.',
      href: '/vehicles',
    });
  }

  const udhar = summary.udhar ?? { borrowed: 0, lent: 0 };
  if (udhar.borrowed > 0) {
    items.push({
      id: 'udhar-borrowed',
      kind: 'udhar',
      title: 'Money to repay',
      detail: `You still owe ${formatPlain(udhar.borrowed)} outstanding.`,
      href: '/udhar',
    });
  }
  if (udhar.lent > 0) {
    items.push({
      id: 'udhar-lent',
      kind: 'udhar',
      title: 'Money to collect',
      detail: `Friends still owe you ${formatPlain(udhar.lent)}.`,
      href: '/udhar',
    });
  }

  return items;
}

function formatPlain(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
