import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatInr(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function ageFromDob(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob + 'T00:00:00');
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDelta = today.getMonth() - birth.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

export function toDatetimeLocalValue(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function datetimeLocalToIso(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString();
}

export function localDayIsoRange(dateKey: string): { from: string; to: string } {
  const start = new Date(`${dateKey}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  end.setMilliseconds(-1);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function sanitizeAmountInput(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join('').slice(0, 2)}`;
}

export function formatDateTimeInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())} - ${pad(d.getMonth() + 1)} - ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())} - ${pad(d.getMonth() + 1)} - ${d.getFullYear()}`;
}

export function parseDateTimeInput(raw: string): Date | null {
  const m = raw.trim().match(/^(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*(\d{4})\s+(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const year = Number(m[3]);
  const hour = Number(m[4]);
  const minute = Number(m[5]);
  if (hour > 23 || minute > 59 || month < 0 || month > 11) return null;
  const d = new Date(year, month, day, hour, minute);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  return d;
}

export function parseDateInput(raw: string): Date | null {
  const m = raw.trim().match(/^(\d{1,2})\s*-\s*(\d{1,2})\s*-\s*(\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]) - 1;
  const year = Number(m[3]);
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  return d;
}

export function maskDateTimeDigits(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 12);
  let out = '';
  if (digits.length === 0) return '';
  out = digits.slice(0, Math.min(2, digits.length));
  if (digits.length <= 2) return out;
  out += ' - ' + digits.slice(2, Math.min(4, digits.length));
  if (digits.length <= 4) return out;
  out += ' - ' + digits.slice(4, Math.min(8, digits.length));
  if (digits.length <= 8) return out;
  out += ' ' + digits.slice(8, Math.min(10, digits.length));
  if (digits.length <= 10) return out;
  return out + ':' + digits.slice(10, 12);
}

export function maskDateDigits(raw: string) {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  let out = '';
  if (digits.length === 0) return '';
  out = digits.slice(0, Math.min(2, digits.length));
  if (digits.length <= 2) return out;
  out += ' - ' + digits.slice(2, Math.min(4, digits.length));
  if (digits.length <= 4) return out;
  return out + ' - ' + digits.slice(4, 8);
}

export function formatRangeLabel(fromIso?: string, toIso?: string) {
  if (!fromIso && !toIso) return 'All time';
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  if (fromIso && toIso) return `${fmt(fromIso)} - ${fmt(toIso)}`;
  if (fromIso) return `From ${fmt(fromIso)}`;
  return `Until ${fmt(toIso!)}`;
}

export function tzOffsetMinutes() {
  return new Date().getTimezoneOffset();
}

export function formatClock(d: Date) {
  return {
    day: d.toLocaleDateString('en-IN', { weekday: 'long' }),
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function relativeDays(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
}

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export function firstName(fullName: string | null | undefined, email: string | null | undefined) {
  const name = fullName?.trim();
  if (name) return name.split(/\s+/)[0];
  if (email) return email.split('@')[0];
  return 'there';
}

export function initials(fullName: string | null | undefined, email: string | null | undefined) {
  const name = fullName?.trim();
  if (name) {
    const parts = name.split(/\s+/);
    return `${parts[0][0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (email?.[0] ?? 'K').toUpperCase();
}
