import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import type { Stats } from '../lib/types';
import { StatCard } from './StatCard';
import {
  IconCoins,
  IconFlame,
  IconTarget,
  IconTrend,
  IconWallet,
} from './icons';
import { money, pct, signedMoney, num } from '../lib/format';

interface Props {
  stats: Stats;
  currency: string;
  title: string;
}

export function StatsPanel({ stats: s, currency, title }: Props) {
  const donut = [
    { name: 'Green', value: s.greens, fill: '#059669' },
    { name: 'Red', value: s.reds, fill: '#DC2626' },
    { name: 'Pendente', value: s.pending, fill: '#D97706' },
    { name: 'Anulada', value: s.voids, fill: '#475569' },
  ].filter((d) => d.value > 0);

  const streak =
    s.currentStreak === 0
      ? '—'
      : s.currentStreak > 0
        ? `${s.currentStreak}G`
        : `${Math.abs(s.currentStreak)}R`;

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-fgMuted">
          {title}
        </h2>
        <span className="nums text-xs text-fgDim">{s.count} apostas</span>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Lucro / Prejuízo"
          value={signedMoney(s.profit, currency)}
          tone={s.profit > 0 ? 'green' : s.profit < 0 ? 'red' : 'default'}
          hint={`ROI ${pct(s.roi)}`}
          icon={<IconTrend />}
        />
        <StatCard
          label="Banca"
          value={money(s.bankrollEnd, currency)}
          hint={`Início ${money(s.bankrollStart, currency)}`}
          icon={<IconWallet />}
          tone="blue"
        />
        <StatCard
          label="Taxa de vitória"
          value={pct(s.winRate, 0)}
          hint={`${s.greens}G · ${s.reds}R · ${s.pending} pend.`}
          icon={<IconTarget />}
        />
        <StatCard
          label="Sequência atual"
          value={streak}
          hint={s.currentStreak > 0 ? 'greens seguidos' : s.currentStreak < 0 ? 'reds seguidos' : 'sem resolvidas'}
          tone={s.currentStreak > 0 ? 'green' : s.currentStreak < 0 ? 'red' : 'default'}
          icon={<IconFlame />}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <div className="card flex items-center gap-4 p-4 lg:col-span-1">
          <div className="relative h-24 w-24 shrink-0">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={donut.length ? donut : [{ name: '—', value: 1, fill: '#1e293b' }]}
                  dataKey="value"
                  innerRadius={30}
                  outerRadius={44}
                  paddingAngle={2}
                  stroke="none"
                >
                  {(donut.length ? donut : [{ fill: '#1e293b' }]).map((d, i) => (
                    <Cell key={i} fill={d.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 grid place-items-center">
              <span className="nums text-lg font-bold">{pct(s.winRate, 0)}</span>
            </div>
          </div>
          <ul className="space-y-1 text-xs">
            <Legend c="#059669" k="Greens" v={s.greens} />
            <Legend c="#DC2626" k="Reds" v={s.reds} />
            <Legend c="#D97706" k="Pendentes" v={s.pending} />
            <Legend c="#475569" k="Anuladas" v={s.voids} />
          </ul>
        </div>

        <div className="card grid grid-cols-2 gap-x-4 gap-y-3 p-4 lg:col-span-2 sm:grid-cols-3">
          <Mini k="Total investido" v={money(s.staked, currency)} icon={<IconCoins width={14} height={14} />} />
          <Mini k="Odd média" v={num(s.avgOdd)} />
          <Mini k="Aposta média" v={money(s.avgStake, currency)} />
          <Mini k="Maior green" v={signedMoney(s.bestWin, currency)} tone="green" />
          <Mini k="Maior red" v={signedMoney(s.worstLoss, currency)} tone="red" />
          <Mini k="Resolvidas" v={`${s.settled}/${s.count}`} />
        </div>
      </div>
    </section>
  );
}

function Legend({ c, k, v }: { c: string; k: string; v: number }) {
  return (
    <li className="flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: c }} />
      <span className="text-fgMuted">{k}</span>
      <span className="nums ml-auto font-semibold">{v}</span>
    </li>
  );
}

function Mini({
  k,
  v,
  tone,
  icon,
}: {
  k: string;
  v: string;
  tone?: 'green' | 'red';
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-fgMuted">
        {icon}
        {k}
      </div>
      <div
        className={`nums mt-0.5 text-sm font-semibold ${
          tone === 'green' ? 'text-green' : tone === 'red' ? 'text-red' : 'text-fg'
        }`}
      >
        {v}
      </div>
    </div>
  );
}
