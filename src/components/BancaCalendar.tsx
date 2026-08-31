import { useMemo } from 'react';
import type { Bet } from '../lib/types';
import { monthName, monthShort, signedMoney, todayISO } from '../lib/format';
import { IconChevron } from './icons';

interface Props {
  bets: Bet[];
  year: number;
  month: number; // 0..11
  selectedDay: string | null; // ISO YYYY-MM-DD
  currency: string;
  mode: 'month' | 'year';
  onMonthChange: (year: number, month: number) => void;
  onYearChange: (year: number) => void;
  onSelectDay: (iso: string | null) => void;
  onModeChange: (mode: 'month' | 'year') => void;
}

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
const leadingBlanks = (y: number, m: number) => {
  const wd = new Date(y, m, 1).getDay();
  return wd === 0 ? 6 : wd - 1;
};
const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

export function BancaCalendar({
  bets,
  year,
  month,
  selectedDay,
  currency,
  onMonthChange,
  onYearChange,
  onSelectDay,
  onModeChange,
  mode,
}: Props) {
  const today = todayISO();

  const setModeSync = (m: 'month' | 'year') => onModeChange(m);

  const dayMap = useMemo(() => {
    const map = new Map<string, { pnl: number; pending: boolean }>();
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    for (const b of bets) {
      if (!b.event_date.startsWith(prefix)) continue;
      const cur = map.get(b.event_date) ?? { pnl: 0, pending: false };
      cur.pnl += Number(b.profit);
      if (b.status === 'pending') cur.pending = true;
      map.set(b.event_date, cur);
    }
    return map;
  }, [bets, year, month]);

  const monthMap = useMemo(() => {
    const map = new Map<number, { pnl: number; pending: boolean; count: number }>();
    const prefix = `${year}-`;
    for (const b of bets) {
      if (!b.event_date.startsWith(prefix)) continue;
      const m = Number(b.event_date.slice(5, 7)) - 1;
      const cur = map.get(m) ?? { pnl: 0, pending: false, count: 0 };
      cur.pnl += Number(b.profit);
      cur.count += 1;
      if (b.status === 'pending') cur.pending = true;
      map.set(m, cur);
    }
    return map;
  }, [bets, year]);

  const prevMonth = () =>
    month === 0 ? onMonthChange(year - 1, 11) : onMonthChange(year, month - 1);
  const nextMonth = () =>
    month === 11 ? onMonthChange(year + 1, 0) : onMonthChange(year, month + 1);

  const goToday = () => {
    const [y, m, d] = today.split('-').map(Number);
    setModeSync('month');
    onMonthChange(y, m - 1);
    onSelectDay(iso(y, m - 1, d));
  };

  const nowY = new Date().getFullYear();
  const nowM = new Date().getMonth();

  return (
    <div className="card p-4 sm:p-4.5">
      <div className="mb-3 inline-flex w-fit gap-1 rounded-xl bg-white/[0.04] p-1">
        {(['month', 'year'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModeSync(m)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
              mode === m ? 'bg-secondary/20 text-secondary' : 'text-fgMuted hover:text-fg'
            }`}
          >
            {m === 'month' ? 'Mês' : 'Ano'}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => (mode === 'year' ? onYearChange(year - 1) : prevMonth())}
          className="btn-ghost h-8 w-8 !px-0"
          aria-label="Anterior"
        >
          <IconChevron width={16} height={16} className="rotate-180" />
        </button>
        <span className="text-sm font-semibold capitalize">
          {mode === 'year' ? year : `${monthName(month)} ${year}`}
        </span>
        <button
          onClick={() => (mode === 'year' ? onYearChange(year + 1) : nextMonth())}
          className="btn-ghost h-8 w-8 !px-0"
          aria-label="Seguinte"
        >
          <IconChevron width={16} height={16} />
        </button>
      </div>

      {mode === 'year' ? (
        <>
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 12 }).map((_, m) => {
              const info = monthMap.get(m);
              const isCurrent = year === nowY && m === nowM;
              const isSelected = m === month;
              const isFuture = year > nowY || (year === nowY && m > nowM);

              let cls =
                'flex flex-col items-center justify-center gap-1 rounded-lg border px-2 py-3 text-xs transition-colors ';
              if (isSelected) cls += 'border-secondary bg-secondary/20 ';
              else if (isCurrent) cls += 'border-pending/50 bg-pending/10 ';
              else if (info && info.pnl > 0) cls += 'border-green/35 bg-greenSoft ';
              else if (info && info.pnl < 0) cls += 'border-red/35 bg-redSoft ';
              else cls += 'border-border bg-white/[0.02] ';
              cls += isFuture ? 'opacity-40 ' : 'hover:border-white/25 hover:bg-white/[0.06] ';

              return (
                <button
                  key={m}
                  className={cls}
                  onClick={() => {
                    setModeSync('month');
                    onMonthChange(year, m);
                    onSelectDay(null);
                  }}
                >
                  <span className={`font-semibold ${isCurrent ? 'text-pending' : 'text-fg'}`}>
                    {monthShort(m)}
                  </span>
                  <span
                    className={`nums text-[0.68rem] font-bold leading-none ${
                      !info ? 'text-fgDim' : info.pnl >= 0 ? 'text-green' : 'text-red'
                    }`}
                  >
                    {info ? signedMoney(info.pnl, currency) : '—'}
                  </span>
                  {info?.pending && <span className="h-1 w-1 rounded-full bg-pending" />}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-center text-[0.68rem] text-fgMuted">
            Toca num mês para abrir o calendário desse mês
          </p>
        </>
      ) : (
        <>
          <button
            onClick={goToday}
            className="mx-auto mb-3 block rounded-lg border border-border px-3 py-1 text-xs font-medium text-fgMuted hover:border-secondary hover:text-fg"
          >
            Hoje
          </button>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[0.65rem] font-semibold uppercase tracking-wide text-fgDim">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingBlanks(year, month) }).map((_, i) => (
              <div key={`b-${i}`} />
            ))}
            {Array.from({ length: daysInMonth(year, month) }).map((_, i) => {
              const d = i + 1;
              const key = iso(year, month, d);
              const info = dayMap.get(key);
              const isToday = key === today;
              const isSelected = key === selectedDay;
              const isFuture = key > today;

              let cls =
                'relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-lg border text-xs transition-colors ';
              if (isSelected) cls += 'border-secondary bg-secondary/20 ';
              else if (isToday) cls += 'border-pending/50 bg-pending/10 ';
              else if (info && info.pnl > 0) cls += 'border-green/35 bg-greenSoft ';
              else if (info && info.pnl < 0) cls += 'border-red/35 bg-redSoft ';
              else cls += 'border-border bg-white/[0.02] ';
              cls += isFuture ? 'opacity-40 ' : 'hover:border-white/25 hover:bg-white/[0.06] ';

              return (
                <button key={key} className={cls} onClick={() => onSelectDay(isSelected ? null : key)}>
                  <span className={`font-semibold ${isToday ? 'text-pending' : 'text-fg'}`}>{d}</span>
                  {info && (
                    <span
                      className={`nums text-[0.6rem] font-bold leading-none ${
                        info.pnl >= 0 ? 'text-green' : 'text-red'
                      }`}
                    >
                      {info.pnl >= 0 ? '+' : ''}
                      {Math.round(info.pnl)}
                    </span>
                  )}
                  {info?.pending && (
                    <span className="absolute bottom-1 h-1 w-1 rounded-full bg-pending" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex justify-center gap-3 border-t border-border pt-3 text-[0.68rem] text-fgMuted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-green" /> Lucro
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-red" /> Perda
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-pending" /> Pendente
            </span>
          </div>
        </>
      )}
    </div>
  );
}
