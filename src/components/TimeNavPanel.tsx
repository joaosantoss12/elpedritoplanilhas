import { useMemo, useState } from 'react';
import type { Bet } from '../lib/types';
import type { Level, Scope } from '../lib/scope';
import { monthName } from '../lib/format';
import { IconCalendar, IconClose } from './icons';

interface Props {
  allBets: Bet[];
  scope: Scope;
  onScopeChange: (s: Scope) => void;
}

const NOW = new Date();
const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();

const LEVELS: [Level, string][] = [
  ['all', 'Tudo'],
  ['year', 'Anual'],
  ['month', 'Mensal'],
  ['day', 'Diário'],
];

export function TimeNavPanel({ allBets, scope, onScopeChange }: Props) {
  const [open, setOpen] = useState(true);

  const years = useMemo(() => {
    const set = new Set<number>([NOW.getFullYear()]);
    for (const b of allBets) set.add(Number(b.event_date.slice(0, 4)));
    return [...set].sort((a, b) => a - b);
  }, [allBets]);

  const year = scope.year ?? NOW.getFullYear();
  const month = scope.month ?? NOW.getMonth();
  const day = scope.day ?? Math.min(NOW.getDate(), daysInMonth(year, month));

  const go = (level: Level) => {
    if (level === 'all') onScopeChange({ level: 'all' });
    else if (level === 'year') onScopeChange({ level: 'year', year });
    else if (level === 'month') onScopeChange({ level: 'month', year, month });
    else onScopeChange({ level: 'day', year, month, day });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary fixed bottom-5 right-5 z-40 h-12 w-12 rounded-full !p-0 shadow-card lg:bottom-auto lg:top-28"
        aria-label="Abrir seletor de período"
      >
        <IconCalendar />
      </button>
    );
  }

  return (
    <div
      className="card fixed inset-x-3 bottom-3 z-40 p-3.5 shadow-card sm:inset-x-auto sm:right-4 sm:w-[236px] lg:top-28"
      role="region"
      aria-label="Seletor de período"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-fgMuted">
          <IconCalendar width={14} height={14} /> Período
        </span>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-fgMuted hover:text-fg"
          aria-label="Fechar"
        >
          <IconClose width={15} height={15} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-1 sm:grid-cols-2">
        {LEVELS.map(([lv, lbl]) => (
          <button
            key={lv}
            onClick={() => go(lv)}
            aria-pressed={scope.level === lv}
            className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${
              scope.level === lv
                ? 'bg-primary text-white'
                : 'border border-border bg-white/[0.03] text-fgMuted hover:text-fg'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {scope.level !== 'all' && (
        <div className="mt-2.5 space-y-2">
          <Field label="Ano">
            <select
              className="nav-select"
              value={year}
              onChange={(e) =>
                onScopeChange({ ...scope, year: Number(e.target.value) } as Scope)
              }
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </Field>

          {(scope.level === 'month' || scope.level === 'day') && (
            <Field label="Mês">
              <select
                className="nav-select"
                value={month}
                onChange={(e) => {
                  const m = Number(e.target.value);
                  onScopeChange(
                    scope.level === 'day'
                      ? { level: 'day', year, month: m, day: Math.min(day, daysInMonth(year, m)) }
                      : { level: 'month', year, month: m },
                  );
                }}
              >
                {Array.from({ length: 12 }, (_, m) => (
                  <option key={m} value={m}>{monthName(m)}</option>
                ))}
              </select>
            </Field>
          )}

          {scope.level === 'day' && (
            <Field label="Dia">
              <select
                className="nav-select"
                value={day}
                onChange={(e) =>
                  onScopeChange({ level: 'day', year, month, day: Number(e.target.value) })
                }
              >
                {Array.from({ length: daysInMonth(year, month) }, (_, i) => (
                  <option key={i} value={i + 1}>{String(i + 1).padStart(2, '0')}</option>
                ))}
              </select>
            </Field>
          )}
        </div>
      )}

      <div className="mt-2.5 flex gap-1.5">
        <button
          className="flex-1 rounded-lg border border-border bg-white/[0.03] px-2 py-1.5 text-xs font-medium text-fgMuted hover:text-fg"
          onClick={() =>
            onScopeChange({
              level: 'day',
              year: NOW.getFullYear(),
              month: NOW.getMonth(),
              day: NOW.getDate(),
            })
          }
        >
          Hoje
        </button>
        <button
          className="flex-1 rounded-lg border border-border bg-white/[0.03] px-2 py-1.5 text-xs font-medium text-fgMuted hover:text-fg"
          onClick={() =>
            onScopeChange({
              level: 'month',
              year: NOW.getFullYear(),
              month: NOW.getMonth(),
            })
          }
        >
          Este mês
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-fgMuted">
      <span>{label}</span>
      {children}
    </label>
  );
}
