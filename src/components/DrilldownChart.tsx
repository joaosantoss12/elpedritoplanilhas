import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Bet } from '../lib/types';
import type { Scope } from '../lib/scope';
import { scopeLabel } from '../lib/scope';
import {
  bankrollSeries,
  byDay,
  byMonth,
  byYear,
  type Bucket,
} from '../lib/stats';
import { money, monthName, signedMoney } from '../lib/format';

interface Props {
  allBets: Bet[];
  startingBankroll: number;
  currency: string;
  scope: Scope;
}

const GREEN = '#059669';
const RED = '#DC2626';
const DIM = '#475569';

const rangeStart = (s: Scope) =>
  `${s.year ?? 0}-${String((s.month ?? 0) + 1).padStart(2, '0')}-${String(
    s.day ?? 1,
  ).padStart(2, '0')}`;

export function DrilldownChart({ allBets, startingBankroll, currency, scope }: Props) {
  const priorBankroll = useMemo(() => {
    if (scope.level === 'all') return startingBankroll;
    const start = rangeStart(scope);
    return (
      startingBankroll +
      allBets.filter((b) => b.event_date < start).reduce((s, b) => s + Number(b.profit), 0)
    );
  }, [allBets, scope, startingBankroll]);

  const buckets: Bucket[] = useMemo(() => {
    if (scope.level === 'all') return byYear(allBets, startingBankroll);
    if (scope.level === 'year') return byMonth(allBets, scope.year!, priorBankroll);
    if (scope.level === 'month')
      return byDay(allBets, scope.year!, scope.month!, priorBankroll);
    return [];
  }, [allBets, scope, startingBankroll, priorBankroll]);

  const daySeries = useMemo(() => {
    if (scope.level !== 'day') return [];
    const iso = rangeStart(scope);
    return bankrollSeries(
      allBets.filter((b) => b.event_date === iso),
      priorBankroll,
    );
  }, [allBets, scope, priorBankroll]);

  const caption =
    scope.level === 'all'
      ? 'Lucro/prejuízo por ano · evolução da banca'
      : scope.level === 'year'
        ? `Lucro/prejuízo por mês em ${scope.year} · evolução da banca`
        : scope.level === 'month'
          ? `Lucro/prejuízo por dia em ${monthName(scope.month!)} de ${scope.year}`
          : 'Evolução da banca aposta a aposta';

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">{scopeLabel(scope)}</h2>
      </div>
      <p className="mb-4 text-xs text-fgDim">{caption}</p>

      <div className="h-[280px] w-full sm:h-[330px]">
        {scope.level === 'day' ? (
          daySeries.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer>
              <ComposedChart data={daySeries} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="idx" stroke={DIM} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke={DIM} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<DayTip currency={currency} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="profit" radius={[3, 3, 0, 0]} maxBarSize={26}>
                  {daySeries.map((d) => (
                    <Cell key={d.key} fill={d.profit > 0 ? GREEN : d.profit < 0 ? RED : DIM} />
                  ))}
                </Bar>
                <Line type="monotone" dataKey="bankroll" stroke="#3B82F6" strokeWidth={2}
                  dot={{ r: 3, fill: '#3B82F6' }} />
              </ComposedChart>
            </ResponsiveContainer>
          )
        ) : buckets.length === 0 ? (
          <Empty />
        ) : (
          <ResponsiveContainer>
            <ComposedChart data={buckets} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
              <defs>
                <linearGradient id="bk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="label" stroke={DIM} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="l" stroke={DIM} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="r" orientation="right" stroke={DIM} fontSize={11}
                tickLine={false} axisLine={false} width={44} />
              <Tooltip content={<BucketTip currency={currency} level={scope.level} />}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar yAxisId="l" dataKey="profit" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {buckets.map((b) => (
                  <Cell key={b.key} fill={b.profit > 0 ? GREEN : b.profit < 0 ? RED : DIM} />
                ))}
              </Bar>
              <Line yAxisId="r" type="monotone" dataKey="bankroll" stroke="url(#bk)"
                strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#3B82F6' }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-fgMuted">
        <Legend c={GREEN} k="P/L positivo" />
        <Legend c={RED} k="P/L negativo" />
        <Legend c="#3B82F6" k="Banca acumulada" />
      </div>
    </div>
  );
}

function Legend({ c, k }: { c: string; k: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />
      {k}
    </span>
  );
}

function Empty() {
  return (
    <div className="grid h-full place-items-center text-sm text-fgDim">
      Sem dados neste período.
    </div>
  );
}

function BucketTip({ active, payload, currency, level }: any) {
  if (!active || !payload?.length) return null;
  const b: Bucket = payload[0].payload;
  const title =
    level === 'all' ? b.label : level === 'year' ? monthName(b.month!) : `Dia ${b.day}`;
  return (
    <div className="card border-white/10 p-3 text-xs">
      <p className="mb-1 font-semibold">{title}</p>
      <Row k="P/L" v={signedMoney(b.profit, currency)} tone={b.profit} />
      <Row k="Banca" v={money(b.bankroll, currency)} />
      <Row k="Apostas" v={`${b.count} (${b.greens}G / ${b.reds}R)`} />
      <Row k="Taxa vitória" v={`${b.winRate.toFixed(0)}%`} />
      <Row k="Investido" v={money(b.staked, currency)} />
    </div>
  );
}

function DayTip({ active, payload, currency }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="card border-white/10 p-3 text-xs">
      <p className="mb-1 max-w-[220px] truncate font-semibold">{d.label}</p>
      <Row k="P/L" v={signedMoney(d.profit, currency)} tone={d.profit} />
      <Row k="Banca" v={money(d.bankroll, currency)} />
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
