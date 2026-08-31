import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Bet } from '../lib/types';
import { sortBets } from '../lib/stats';
import { fmtDay, money, monthName, monthShort, signedMoney, todayISO } from '../lib/format';
import { StatusBadge } from './StatusBadge';
import { IconEdit, IconPlus, IconTrash } from './icons';

type View = 'day' | 'month' | 'year';

interface Props {
  bets: Bet[]; // todas as apostas do grupo
  year: number;
  month: number; // 0..11
  selectedDay: string | null;
  view: View;
  onViewChange: (v: View) => void;
  currency: string;
  isAdmin: boolean;
  onAdd: (dateISO: string) => void;
  onEdit: (b: Bet) => void;
  onDelete: (b: Bet) => void;
}

const GREEN = '#059669';
const RED = '#DC2626';
const DIM = '#475569';
const LINE = '#3B82F6';

const pad = (n: number) => String(n).padStart(2, '0');

export function BancaPanel({
  bets,
  year,
  month,
  selectedDay,
  view,
  onViewChange,
  currency,
  isAdmin,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const monthPrefix = `${year}-${pad(month + 1)}`;

  const monthBets = useMemo(
    () => sortBets(bets.filter((b) => b.event_date.startsWith(monthPrefix))),
    [bets, monthPrefix],
  );
  const monthProfit = monthBets.reduce((s, b) => s + Number(b.profit), 0);

  const monthSeries = useMemo(() => {
    const today = todayISO();
    const dim = new Date(year, month + 1, 0).getDate();
    const perDay = new Map<string, { pnl: number; count: number; staked: number }>();
    for (const b of monthBets) {
      const cur = perDay.get(b.event_date) ?? { pnl: 0, count: 0, staked: 0 };
      cur.pnl += Number(b.profit);
      cur.count += 1;
      cur.staked += Number(b.stake);
      perDay.set(b.event_date, cur);
    }
    const pts: {
      day: number;
      dailyPnl: number;
      cum: number;
      count: number;
      staked: number;
    }[] = [];
    let cum = 0;
    for (let d = 1; d <= dim; d++) {
      const key = `${monthPrefix}-${pad(d)}`;
      if (key > today) break;
      const info = perDay.get(key);
      cum = Number((cum + (info?.pnl ?? 0)).toFixed(2));
      pts.push({
        day: d,
        dailyPnl: Number((info?.pnl ?? 0).toFixed(2)),
        cum,
        count: info?.count ?? 0,
        staked: Number((info?.staked ?? 0).toFixed(2)),
      });
    }
    return pts;
  }, [monthBets, monthPrefix, year, month]);

  const yearBets = useMemo(
    () => sortBets(bets.filter((b) => b.event_date.startsWith(`${year}-`))),
    [bets, year],
  );
  const yearProfit = yearBets.reduce((s, b) => s + Number(b.profit), 0);

  const yearSeries = useMemo(() => {
    const now = new Date();
    const lastMonth = year === now.getFullYear() ? now.getMonth() : 11;
    const perMonth = new Map<number, { pnl: number; count: number; staked: number }>();
    for (const b of yearBets) {
      const m = Number(b.event_date.slice(5, 7)) - 1;
      const cur = perMonth.get(m) ?? { pnl: 0, count: 0, staked: 0 };
      cur.pnl += Number(b.profit);
      cur.count += 1;
      cur.staked += Number(b.stake);
      perMonth.set(m, cur);
    }
    const pts: {
      month: number;
      label: string;
      dailyPnl: number;
      cum: number;
      count: number;
      staked: number;
    }[] = [];
    let cum = 0;
    for (let m = 0; m <= lastMonth; m++) {
      const info = perMonth.get(m);
      cum = Number((cum + (info?.pnl ?? 0)).toFixed(2));
      pts.push({
        month: m,
        label: monthShort(m),
        dailyPnl: Number((info?.pnl ?? 0).toFixed(2)),
        cum,
        count: info?.count ?? 0,
        staked: Number((info?.staked ?? 0).toFixed(2)),
      });
    }
    return pts;
  }, [yearBets, year]);

  const dayBets = useMemo(
    () => (selectedDay ? sortBets(bets.filter((b) => b.event_date === selectedDay)) : []),
    [bets, selectedDay],
  );
  const dayProfit = dayBets.reduce((s, b) => s + Number(b.profit), 0);

  const daySeries = useMemo(() => {
    const pts = [{ label: 'Início', cum: 0, bet: null as Bet | null }];
    let cum = 0;
    dayBets.forEach((b, i) => {
      cum = Number((cum + Number(b.profit)).toFixed(2));
      pts.push({ label: `A${i + 1}`, cum, bet: b });
    });
    return pts;
  }, [dayBets]);

  return (
    <div className="card flex min-h-[420px] flex-col p-4 sm:p-4.5">
      <div className="mb-4 inline-flex w-fit gap-1 rounded-xl bg-white/[0.04] p-1">
        {(['day', 'month', 'year'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => onViewChange(v)}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
              view === v ? 'bg-secondary/20 text-secondary' : 'text-fgMuted hover:text-fg'
            }`}
          >
            {v === 'day' ? 'Dia' : v === 'month' ? 'Mês' : 'Ano'}
          </button>
        ))}
      </div>

      {view === 'year' ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-fgMuted">
              Evolução · Ano {year}
            </span>
            <span
              className={`nums text-sm font-bold ${
                yearProfit > 0 ? 'text-green' : yearProfit < 0 ? 'text-red' : 'text-fgDim'
              }`}
            >
              {signedMoney(yearProfit, currency)}
            </span>
          </div>
          {yearBets.length === 0 ? (
            <Empty label="Sem apostas neste ano" />
          ) : (
            <div className="h-[240px] w-full">
              <ResponsiveContainer>
                <AreaChart data={yearSeries} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                  <defs>
                    <linearGradient id="yrArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={LINE} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={LINE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" stroke={DIM} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={DIM} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={<YearTip currency={currency} year={year} />}
                    cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                  <Area
                    type="monotone"
                    dataKey="cum"
                    stroke={LINE}
                    strokeWidth={2}
                    fill="url(#yrArea)"
                    dot={false}
                    activeDot={{ r: 4, fill: LINE }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="mt-3 text-xs text-fgDim">
            Lucro/prejuízo acumulado mês a mês em {year}. Usa as setas do calendário para mudar de ano.
          </p>
        </>
      ) : view === 'month' ? (
        <>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-fgMuted">
              Evolução · {monthName(month)} {year}
            </span>
            <span
              className={`nums text-sm font-bold ${
                monthProfit > 0 ? 'text-green' : monthProfit < 0 ? 'text-red' : 'text-fgDim'
              }`}
            >
              {signedMoney(monthProfit, currency)}
            </span>
          </div>
          {monthSeries.length === 0 ? (
            <Empty label="Sem apostas neste mês" />
          ) : (
            <div className="h-[240px] w-full">
              <ResponsiveContainer>
                <AreaChart data={monthSeries} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                  <defs>
                    <linearGradient id="bkArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={LINE} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={LINE} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    stroke={DIM}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={Math.max(0, Math.floor(monthSeries.length / 8))}
                  />
                  <YAxis stroke={DIM} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={<MonthTip currency={currency} month={month} year={year} />}
                    cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
                  />
                  <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                  <Area
                    type="monotone"
                    dataKey="cum"
                    stroke={LINE}
                    strokeWidth={2}
                    fill="url(#bkArea)"
                    dot={false}
                    activeDot={{ r: 4, fill: LINE }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <p className="mt-3 text-xs text-fgDim">
            Lucro/prejuízo acumulado ao longo dos dias do mês. Escolhe um dia no calendário para o detalhe.
          </p>
        </>
      ) : selectedDay ? (
        <>
          <div className="mb-3 flex items-start justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-semibold capitalize">{fmtDay(selectedDay)}</h3>
              <span className="text-xs text-fgMuted">
                {dayBets.length} aposta{dayBets.length === 1 ? '' : 's'}
              </span>
            </div>
            <span
              className={`nums text-lg font-bold ${
                dayProfit > 0 ? 'text-green' : dayProfit < 0 ? 'text-red' : 'text-fgDim'
              }`}
            >
              {signedMoney(dayProfit, currency)}
            </span>
          </div>

          {dayBets.length === 0 ? (
            <Empty label="Sem apostas neste dia">
              {isAdmin && (
                <button
                  className="btn-ghost mt-1 py-1.5 text-xs"
                  onClick={() => onAdd(selectedDay)}
                >
                  <IconPlus width={14} height={14} /> Adicionar
                </button>
              )}
            </Empty>
          ) : (
            <>
              <div className="h-[200px] w-full">
                <ResponsiveContainer>
                  <AreaChart data={daySeries} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
                    <defs>
                      <linearGradient id="dayArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={LINE} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={LINE} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="label" stroke={DIM} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={DIM} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      content={<DayTip currency={currency} />}
                      cursor={{ stroke: 'rgba(255,255,255,0.15)' }}
                    />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
                    <Area
                      type="monotone"
                      dataKey="cum"
                      stroke={LINE}
                      strokeWidth={2}
                      fill="url(#dayArea)"
                      dot={<BetDot />}
                      activeDot={<BetDot active />}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <ul className="mt-3 space-y-1.5 overflow-y-auto pr-1" style={{ maxHeight: 260 }}>
                {dayBets.map((b, i) => (
                  <li
                    key={b.id}
                    className="flex items-center gap-2 rounded-lg border border-border bg-white/[0.03] px-2.5 py-2 text-xs"
                  >
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded bg-secondary/15 text-[0.65rem] font-bold text-secondary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {b.team_a} <span className="text-fgDim">vs</span> {b.team_b}
                      </p>
                      <p className="truncate text-[0.68rem] text-fgMuted">{b.market}</p>
                    </div>
                    <span className="nums shrink-0 text-secondary">@{b.odd.toFixed(2)}</span>
                    <span className="nums hidden shrink-0 text-fgMuted sm:inline">
                      {money(b.stake, currency)}
                    </span>
                    <StatusBadge status={b.status} />
                    <span
                      className={`nums shrink-0 font-semibold ${
                        b.profit > 0 ? 'text-green' : b.profit < 0 ? 'text-red' : 'text-fgDim'
                      }`}
                    >
                      {b.profit > 0 ? '+' : ''}
                      {money(b.profit, currency)}
                    </span>
                    {isAdmin && (
                      <span className="flex shrink-0 gap-0.5">
                        <button
                          className="btn-ghost h-7 w-7 !px-0"
                          aria-label="Editar"
                          onClick={() => onEdit(b)}
                        >
                          <IconEdit width={13} height={13} />
                        </button>
                        <button
                          className="btn-ghost h-7 w-7 !px-0 hover:!text-red"
                          aria-label="Eliminar"
                          onClick={() => onDelete(b)}
                        >
                          <IconTrash width={13} height={13} />
                        </button>
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : (
        <Empty label="Escolhe um dia no calendário para ver as apostas" />
      )}
    </div>
  );
}

function Empty({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="grid flex-1 place-items-center p-8 text-center">
      <div className="space-y-2">
        <p className="text-sm text-fgDim">{label}</p>
        {children}
      </div>
    </div>
  );
}

function BetDot(props: any) {
  const { cx, cy, payload, active } = props;
  if (cx == null || cy == null || !payload?.bet) return null;
  const s: string = payload.bet.status;
  const color = s === 'green' ? GREEN : s === 'red' ? RED : DIM;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={active ? 6 : 4}
      fill={color}
      stroke="rgba(255,255,255,0.35)"
      strokeWidth={2}
    />
  );
}

function YearTip({ active, payload, currency, year }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="card border-white/10 p-3 text-xs">
      <p className="mb-1 font-semibold">
        {monthName(p.month)} {year}
      </p>
      <Row k="P/L do mês" v={signedMoney(p.dailyPnl, currency)} tone={p.dailyPnl} />
      <Row k="Acumulado" v={signedMoney(p.cum, currency)} tone={p.cum} />
      <Row k="Apostas" v={String(p.count)} />
      <Row k="Investido" v={money(p.staked, currency)} />
    </div>
  );
}

function MonthTip({ active, payload, currency, month, year }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="card border-white/10 p-3 text-xs">
      <p className="mb-1 font-semibold">
        {p.day} de {monthName(month)} {year}
      </p>
      <Row k="P/L do dia" v={signedMoney(p.dailyPnl, currency)} tone={p.dailyPnl} />
      <Row k="Acumulado" v={signedMoney(p.cum, currency)} tone={p.cum} />
      <Row k="Apostas" v={String(p.count)} />
      <Row k="Investido" v={money(p.staked, currency)} />
    </div>
  );
}

function DayTip({ active, payload, currency }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  if (!p.bet) {
    return (
      <div className="card border-white/10 p-3 text-xs">
        <p className="font-semibold">Início do dia</p>
        <Row k="Acumulado" v={money(0, currency)} />
      </div>
    );
  }
  const b: Bet = p.bet;
  return (
    <div className="card max-w-[240px] border-white/10 p-3 text-xs">
      <p className="mb-1 font-semibold">
        {b.team_a} vs {b.team_b}
      </p>
      {b.market && <p className="mb-1.5 text-fgMuted">{b.market}</p>}
      <Row k="Odd" v={`@${b.odd.toFixed(2)}`} />
      <Row k="Valor" v={money(b.stake, currency)} />
      <Row k="P/L" v={signedMoney(Number(b.profit), currency)} tone={Number(b.profit)} />
      <Row k="Acumulado" v={signedMoney(p.cum, currency)} tone={p.cum} />
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: number }) {
  return (
    <div className="flex justify-between gap-6">
      <span className="text-fgMuted">{k}</span>
      <span
        className={`nums font-medium ${
          tone == null ? '' : tone > 0 ? 'text-green' : tone < 0 ? 'text-red' : ''
        }`}
      >
        {v}
      </span>
    </div>
  );
}
