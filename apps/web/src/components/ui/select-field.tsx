import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SelectOption = { value: string; label: string };

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select',
  className,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div ref={root} className={cn('relative', className)}>
      {label ? <p className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</p> : null}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between rounded-2xl border border-border bg-surface px-3 text-left text-sm"
      >
        <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open ? (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-2xl border border-border bg-surface py-1 shadow-card animate-in">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full px-3 py-2 text-left text-sm',
                    active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                  )}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
