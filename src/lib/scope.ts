import type { Bet } from './types';
import { monthName } from './format';

export type Level = 'all' | 'year' | 'month' | 'day';

export interface Scope {
  level: Level;
  year?: number;
  month?: number; // 0..11
  day?: number;
}

export function filterByScope(bets: Bet[], s: Scope): Bet[] {
  return bets.filter((b) => {
    const [y, m, d] = b.event_date.split('-').map(Number);
    if (s.year != null && y !== s.year) return false;
    if (s.month != null && m - 1 !== s.month) return false;
    if (s.day != null && d !== s.day) return false;
    return true;
  });
}

export function scopeLabel(s: Scope): string {
  if (s.level === 'all') return 'Histórico completo';
  if (s.level === 'year') return `Ano de ${s.year}`;
  if (s.level === 'month') return `${monthName(s.month!)} de ${s.year}`;
  return `${String(s.day).padStart(2, '0')} de ${monthName(s.month!)} de ${s.year}`;
}

export function crumbs(s: Scope): { label: string; scope: Scope }[] {
  const out: { label: string; scope: Scope }[] = [{ label: 'Tudo', scope: { level: 'all' } }];
  if (s.year != null)
    out.push({ label: String(s.year), scope: { level: 'year', year: s.year } });
  if (s.month != null)
    out.push({
      label: monthName(s.month),
      scope: { level: 'month', year: s.year, month: s.month },
    });
  if (s.day != null)
    out.push({
      label: String(s.day).padStart(2, '0'),
      scope: { level: 'day', year: s.year, month: s.month, day: s.day },
    });
  return out;
}
