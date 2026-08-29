import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import type { TransactionSummary } from '@kharcha/shared';
import { api } from '@/lib/api';
import { useDataRefresh } from '@/lib/data-refresh';
import { GIcon } from '@/lib/tag-meta';
import { buildReminders } from '@/lib/reminders';
import { tzOffsetMinutes } from '@/lib/utils';

export function ReminderBell() {
  const { nonce } = useDataRefresh();
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    api<TransactionSummary>(`/api/transactions/summary?tzOffsetMinutes=${tzOffsetMinutes()}`)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointer);
    return () => document.removeEventListener('mousedown', onPointer);
  }, [open]);

  const items = summary ? buildReminders(summary, new Date()) : [];
  void tick;
  const count = items.length;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label={count ? `${count} reminders` : 'Reminders'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-muted"
      >
        <Bell className="h-5 w-5" />
        {count > 0 ? (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {count > 9 ? '9+' : count}
          </span>
        ) : null}
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-border bg-surface p-2 shadow-card animate-in">
          <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Reminders</p>
          {items.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-[70vh] space-y-1 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className="flex min-h-[52px] items-start gap-3 rounded-2xl px-3 py-2.5 hover:bg-cream"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <GIcon
                        name={
                          item.kind === 'meal'
                            ? 'restaurant'
                            : item.kind === 'petrol'
                              ? 'local_gas_station'
                              : 'notifications'
                        }
                        className="text-[18px]"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{item.title}</span>
                      <span className="block text-xs text-muted-foreground">{item.detail}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
