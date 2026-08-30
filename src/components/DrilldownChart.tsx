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
import { crumbs } from '../lib/scope';
import {
  bankrollSeries,
  byDay,
  byMonth,
  byYear,
  type Bucket,
} from '../lib/stats';
import { money, monthName, signedMoney } from '../lib/format';
import { IconChevron } from './icons';

interface Props {
  allBets: Bet[];
  startingBankroll: number;
  currency: string;
  scope: Scope;
  onScopeChange: (s: Scope) => void;
}

const GREEN = '#059669';
const RED = '#DC2626';
const DIM = '#475569';

function rangeStart(s: Scope): string {
  const y = s.year ?? 0;
  const m = s.month != null ? s.month + 1 : 1;
  const d = s.day ?? 1;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function DrilldownChart({
  allBets,
  startingBankroll,
  currency,
  scope,
  onScopeChange,
}: Props) {
  const priorBankroll = useMemo(() => {
    if (scope.level === 'all') return startingBankroll;
    const start = rangeStart(scope);
    return (
      startingBankroll +
      allBets
        .filter((b) => b.event_date < start)
        .reduce((s, b) => s + Number(b.profit), 0)
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
    const dayBets = allBets.filter(
      (b) => b.event_date === rangeStart({ ...scope, day: scope.day }),
    );
    return bankrollSeries(dayBets, priorBankroll);
  }, [allBets, scope, priorBankroll]);

  const path = crumbs(scope);

  const drillDown = (bkt: Bucket) => {
    if (scope.level === 'all') onScopeChange({ level: 'year', year: bkt.year });
    else if (scope.level === 'year')
      onScopeChange({ level: 'month', year: bkt.year, month: bkt.month });
    else if (scope.level === 'month')
      onScopeChange({
        level: 'day',
        year: bkt.year,
        month: bkt.month,
        day: bkt.day,
      });
  };

  const hint =
    scope.level === 'all'
      ? 'Clica numa barra para abrir o ano'
      : scope.level === 'year'
        ? 'Clica num mês para ver os dias'
        : scope.level === 'month'
          ? 'Clica num dia para ver as apostas'
          : 'Evolução da banca aposta a aposta';

  return (
    <div className="card p-4 sm:p-5">
      {/* Breadcrumb */}
      <div className="mb-1 flex flex-wrap items-center gap-1 text-sm">
        {path.map((c, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <IconChevron width={14} height={14} className="text-fgDim" />}
            <button
              onClick={() => onScopeChange(c.scope)}
              disabled={i === path.length - 1}
              className={
                i === path.length - 1
                  ? 'font-semibold text-fg'
                  : 'text-secondary hover:underline'
              }
            >
              {c.label}
            </button>
          </span>
        ))}
      </div>
      <p className="mb-4 text-xs text-fgDim">{hint}</p>

      <div className="h-[300px] w-full sm:h-[340px]">
        {scope.level === 'day' ? (
          daySeries.length === 0 ? (
            <Empty />
          ) : (
            <ResponsiveContainer>
              <ComposedChart data={daySeries} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="idx" stroke={DIM} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" stroke={DIM} fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={(v) => `${v}`} />
                <Tooltip content={<DayTip currency={currency} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar yAxisId="l" dataKey="profit" radius={[3, 3, 0, 0]} maxBarSize={26}>
                  {daySeries.map((d) => (
                    <Cell key={d.key} fill={d.profit > 0 ? GREEN : d.profit < 0 ? RED : DIM} />
                  ))}
                </Bar>
                <Line yAxisId="l" type="monotone" dataKey="bankroll" stroke="#3B82F6"
                  strokeWidth={2} dot={{ r: 3, fill: '#3B82F6' }} />
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
              <Bar yAxisId="l" dataKey="profit" radius={[4, 4, 0, 0]} maxBarSize={48}
                onClick={(d: any) => drillDown(d.payload as Bucket)}
                className="cursor-pointer">
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
    </div>
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
      <p className="mb-1 font-semibold">{d.label}</p>
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
