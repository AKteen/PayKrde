import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn, formatInr } from '@/lib/utils';

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'gold',
}: {
  label: string;
  value: number;
  hint: string;
  icon: LucideIcon;
  tone?: 'gold' | 'danger' | 'success' | 'info';
}) {
  const tones = {
    gold: 'bg-cream text-gold',
    danger: 'bg-danger/15 text-danger',
    success: 'bg-success/15 text-success',
    info: 'bg-info/15 text-info',
  };
  const valueClass = {
    gold: 'text-foreground',
    danger: 'text-danger',
    success: 'text-success',
    info: 'text-info',
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className={cn('mt-2 tabular text-2xl font-semibold', valueClass[tone])}>{formatInr(value)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', tones[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}
