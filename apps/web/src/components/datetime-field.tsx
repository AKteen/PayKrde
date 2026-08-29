import { useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import {
  cn,
  formatDateInput,
  formatDateTimeInput,
  maskDateDigits,
  maskDateTimeDigits,
  parseDateInput,
  parseDateTimeInput,
} from '@/lib/utils';
import { FieldError } from '@/components/ui/field-error';

type Props = {
  value: string;
  onChange: (iso: string) => void;
  error?: string;
  dateOnly?: boolean;
  label?: string;
};

export function DateTimeField({ value, onChange, error, dateOnly, label }: Props) {
  const picker = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(() => toDisplay(value, dateOnly));
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setText(toDisplay(value, dateOnly));
  }, [value, dateOnly]);

  function commit(next: string) {
    const parsed = dateOnly ? parseDateInput(next) : parseDateTimeInput(next);
    if (!parsed) {
      setLocalError(dateOnly ? 'Use DD - MM - YYYY' : 'Use DD - MM - YYYY HH:mm');
      return;
    }
    setLocalError(null);
    if (dateOnly) {
      parsed.setHours(0, 0, 0, 0);
    }
    onChange(parsed.toISOString());
    setText(dateOnly ? formatDateInput(parsed) : formatDateTimeInput(parsed));
  }

  return (
    <label
      className={cn(
        'flex min-h-[88px] flex-col justify-center rounded-2xl border bg-surface px-4 py-3',
        error || localError ? 'border-danger' : 'border-border',
      )}
    >
      <span className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {label ?? (dateOnly ? 'Date' : 'Date & time')}
        </span>
        <button
          type="button"
          className="text-[11px] font-medium text-gold"
          onClick={() => picker.current?.showPicker?.() ?? picker.current?.click()}
        >
          Pick
        </button>
      </span>
      <input
        className="mt-1 bg-transparent text-base font-medium tabular outline-none"
        inputMode="numeric"
        autoComplete="off"
        spellCheck={false}
        placeholder={dateOnly ? '29 - 08 - 2026' : '29 - 08 - 2026 06:16'}
        value={text}
        aria-invalid={Boolean(error || localError)}
        onChange={(e) => {
          const masked = dateOnly ? maskDateDigits(e.target.value) : maskDateTimeDigits(e.target.value);
          setText(masked);
          setLocalError(null);
        }}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit(text);
          }
        }}
      />
      <input
        ref={picker}
        type={dateOnly ? 'date' : 'datetime-local'}
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          if (!e.target.value) return;
          const d = new Date(dateOnly ? `${e.target.value}T00:00:00` : e.target.value);
          if (Number.isNaN(d.getTime())) return;
          setLocalError(null);
          onChange(d.toISOString());
          setText(dateOnly ? formatDateInput(d) : formatDateTimeInput(d));
        }}
      />
      <FieldError message={error || localError || undefined} />
    </label>
  );
}

function toDisplay(iso: string, dateOnly?: boolean) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return dateOnly ? formatDateInput(d) : formatDateTimeInput(d);
}
