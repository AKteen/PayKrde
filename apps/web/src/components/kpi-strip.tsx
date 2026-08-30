import { Link } from 'react-router-dom';
import type { TransactionSummary } from '@kharcha/shared';
import { GIcon } from '@/lib/tag-meta';
import { formatInr } from '@/lib/utils';

export function KpiStrip({ summary }: { summary: TransactionSummary }) {
  const spent = summary.spent ?? { today: summary.today, week: summary.week, month: summary.month };
  const udhar = summary.udhar ?? { borrowed: 0, lent: 0 };

  const items = [
    { to: '/analytics', icon: 'payments', label: 'Spent today', value: spent.today, hint: 'Outflows' },
    { to: '/analytics', icon: 'calendar_today', label: 'This month', value: spent.month, hint: 'Spend' },
    { to: '/money', icon: 'account_balance_wallet', label: 'Balance', value: summary.balance, hint: 'Account' },
    { to: '/udhar', icon: 'south_west', label: 'Borrowed', value: udhar.borrowed, hint: 'Udhar taken' },
    { to: '/udhar', icon: 'north_east', label: 'Lent', value: udhar.lent, hint: 'Udhar given' },
  ];

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 md:grid md:grid-cols-5 md:overflow-visible">
      {items.map((item) => (
        <Link
          key={item.label}
          to={item.to}
          className="min-w-[8.5rem] shrink-0 rounded-2xl border border-border bg-surface p-3 shadow-soft md:min-w-0"
        >
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <GIcon name={item.icon} className="text-[14px]" />
            {item.label}
          </span>
          <p className="mt-1 tabular text-base font-semibold">{formatInr(item.value)}</p>
          <p className="text-[10px] text-muted-foreground">{item.hint}</p>
        </Link>
      ))}
    </div>
  );
}
