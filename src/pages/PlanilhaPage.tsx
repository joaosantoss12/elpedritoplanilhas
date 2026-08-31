import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { StatsPanel } from '../components/StatsPanel';
import { BancaCalendar } from '../components/BancaCalendar';
import { BancaPanel } from '../components/BancaPanel';
import { BetsTable } from '../components/BetsTable';
import { BetFormModal } from '../components/BetFormModal';
import { BankrollModal } from '../components/BankrollModal';
import { useAuth } from '../context/AuthContext';
import { useGroupData } from '../hooks/useGroupData';
import { computeStats, sortBets } from '../lib/stats';
import { createBet, deleteBet, updateBankroll, updateBet } from '../lib/api';
import { fmtDay, money, monthName, MONTHS_PT } from '../lib/format';
import type { Bet, BetDraft, Group } from '../lib/types';
import { IconPlus, IconShare } from '../components/icons';

const GROUP_CTA: Record<Group, { label: string; href: string }> = {
  free: { label: 'Entrar no grupo Free', href: 'https://t.me/+JmHiwEn_RLw5MTlk' },
  vip: { label: 'Entrar no grupo VIP', href: 'https://vipedrito.com' },
};

type Level = 'all' | 'year' | 'month' | 'day';

const NOW = new Date();
const pad = (n: number) => String(n).padStart(2, '0');

function readGroup(): Group {
  const g = new URLSearchParams(location.search).get('grupo');
  return g === 'vip' ? 'vip' : 'free';
}

export function PlanilhaPage() {
  const { isAdmin } = useAuth();
  const [group, setGroup] = useState<Group>(readGroup);
  const [year, setYear] = useState(NOW.getFullYear());
  const [month, setMonth] = useState(NOW.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [level, setLevel] = useState<Level>('month');
  const [formOpen, setFormOpen] = useState(false);
  const [presetDate, setPresetDate] = useState<string | null>(null);
  const [editing, setEditing] = useState<Bet | null>(null);
  const [bankrollOpen, setBankrollOpen] = useState(false);

  const { bets, settings, loading, error, reload } = useGroupData(group);
  const currency = settings?.currency ?? 'EUR';
  const startingBankroll = settings?.starting_bankroll ?? 0;

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    p.set('grupo', group);
    history.replaceState(null, '', `${location.pathname}?${p}`);
  }, [group]);

  const changeGroup = (g: Group) => {
    setGroup(g);
    setYear(NOW.getFullYear());
    setMonth(NOW.getMonth());
    setSelectedDay(null);
    setLevel('month');
  };

  const monthPrefix = `${year}-${pad(month + 1)}`;

  const allBets = useMemo(() => sortBets(bets), [bets]);
  const monthBets = useMemo(
    () => sortBets(bets.filter((b) => b.event_date.startsWith(monthPrefix))),
    [bets, monthPrefix],
  );
  const yearBets = useMemo(
    () => sortBets(bets.filter((b) => b.event_date.startsWith(`${year}-`))),
    [bets, year],
  );

  const scopedBets = useMemo(() => {
    if (level === 'all') return allBets;
    if (level === 'year') return yearBets;
    if (level === 'day') return monthBets.filter((b) => b.event_date === selectedDay);
    return monthBets;
  }, [level, allBets, yearBets, monthBets, selectedDay]);

  const priorBankroll = useMemo(() => {
    if (level === 'all') return startingBankroll;
    const start =
      level === 'year'
        ? `${year}-01-01`
        : level === 'day' && selectedDay
          ? selectedDay
          : `${monthPrefix}-01`;
    return (
      startingBankroll +
      bets.filter((b) => b.event_date < start).reduce((s, b) => s + Number(b.profit), 0)
    );
  }, [bets, level, year, monthPrefix, selectedDay, startingBankroll]);

  const stats = useMemo(
    () => computeStats(scopedBets, priorBankroll),
    [scopedBets, priorBankroll],
  );

  const periodLabel =
    level === 'all'
      ? 'Histórico completo'
      : level === 'year'
        ? `Ano de ${year}`
        : level === 'day' && selectedDay
          ? fmtDay(selectedDay)
          : `${monthName(month)} de ${year}`;

  const selectDay = (iso: string | null) => {
    setSelectedDay(iso);
    setLevel(iso ? 'day' : 'month');
  };

  const changeMonth = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
    setSelectedDay(null);
    setLevel('month');
  };

  const openNew = (date?: string) => {
    setEditing(null);
    setPresetDate(date ?? null);
    setFormOpen(true);
  };

  const save = useCallback(
    async (draft: BetDraft, id?: string) => {
      if (id) await updateBet(id, draft);
      else await createBet(draft);
      await reload();
    },
    [reload],
  );

  const remove = useCallback(
    async (b: Bet) => {
      if (!confirm(`Eliminar a aposta ${b.team_a} vs ${b.team_b}?`)) return;
      await deleteBet(b.id);
      await reload();
    },
    [reload],
  );

  const years = useMemo(() => {
    const set = new Set<number>([NOW.getFullYear(), year]);
    for (const b of bets) set.add(Number(b.event_date.slice(0, 4)));
    return [...set].sort((a, b) => b - a);
  }, [bets, year]);

  const monthDays = useMemo(() => {
    const set = new Set<string>();
    for (const b of bets) if (b.event_date.startsWith(monthPrefix)) set.add(b.event_date);
    return [...set].sort();
  }, [bets, monthPrefix]);

  const calMode: 'month' | 'year' = level === 'year' ? 'year' : 'month';

  const fieldCls = (active: boolean) =>
    `flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
      active
        ? 'border-secondary bg-secondary/20 text-secondary'
        : 'border-border bg-white/[0.03] text-fgMuted'
    }`;

  return (
    <div className="min-h-dvh">
      <Header group={group} onGroupChange={changeGroup} />

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              Planilha {group === 'vip' ? 'VIP' : 'Grátis'}
            </h1>
            <p className="text-sm text-fgMuted">{periodLabel}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={GROUP_CTA[group].href}
              target="_blank"
              rel="noopener noreferrer"
              className={group === 'vip' ? 'btn bg-green text-white hover:bg-green/90' : 'btn-primary'}
            >
              <IconShare width={16} height={16} />
              {GROUP_CTA[group].label}
            </a>
            {isAdmin && (
              <>
                <button className="btn-ghost" onClick={() => setBankrollOpen(true)}>
                  Banca inicial: {money(startingBankroll, currency)}
                </button>
                <button className="btn-primary" onClick={() => openNew()}>
                  <IconPlus /> Nova aposta
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <p className="card border-red/30 bg-redSoft p-4 text-sm text-red">
            {error}{' '}
            <button className="underline" onClick={reload}>
              Tentar de novo
            </button>
          </p>
        )}

        {loading ? (
          <div className="grid gap-3">
            <div className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />
            <div className="h-80 animate-pulse rounded-2xl bg-white/[0.04]" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setYear(NOW.getFullYear());
                  setMonth(NOW.getMonth());
                  setSelectedDay(null);
                  setLevel('all');
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  level === 'all'
                    ? 'border-secondary bg-secondary/20 text-secondary'
                    : 'border-border bg-white/[0.03] text-fgMuted hover:border-white/25 hover:text-fg'
                }`}
              >
                Ver desde sempre
              </button>

              <label className={fieldCls(level === 'year')}>
                <span className="text-fgDim">Ano</span>
                <select
                  className="nums bg-transparent font-semibold text-fg focus:outline-none"
                  value={year}
                  onChange={(e) => {
                    setYear(Number(e.target.value));
                    setSelectedDay(null);
                    setLevel('year');
                  }}
                >
                  {years.map((y) => (
                    <option key={y} value={y} className="bg-card">
                      {y}
                    </option>
                  ))}
                </select>
              </label>

              <label className={fieldCls(level === 'month')}>
                <span className="text-fgDim">Mês</span>
                <select
                  className="bg-transparent font-semibold text-fg focus:outline-none"
                  value={month}
                  onChange={(e) => {
                    setMonth(Number(e.target.value));
                    setSelectedDay(null);
                    setLevel('month');
                  }}
                >
                  {MONTHS_PT.map((name, m) => (
                    <option key={name} value={m} className="bg-card">
                      {name} {year}
                    </option>
                  ))}
                </select>
              </label>

              <label
                className={`${fieldCls(level === 'day')} ${
                  monthDays.length ? '' : 'cursor-not-allowed opacity-40'
                }`}
              >
                <span className="text-fgDim">Dia</span>
                <select
                  className="bg-transparent font-semibold text-fg focus:outline-none disabled:cursor-not-allowed"
                  value={selectedDay ?? ''}
                  disabled={!monthDays.length}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelectedDay(v || null);
                    setLevel(v ? 'day' : 'month');
                  }}
                >
                  <option value="" className="bg-card">
                    {monthDays.length ? 'Escolher…' : 'Sem apostas'}
                  </option>
                  {monthDays.map((d) => (
                    <option key={d} value={d} className="bg-card">
                      {fmtDay(d)}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <StatsPanel stats={stats} currency={currency} title={`Resumo · ${periodLabel}`} />

            <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
              <BancaCalendar
                bets={bets}
                year={year}
                month={month}
                selectedDay={selectedDay}
                currency={currency}
                mode={calMode}
                onMonthChange={changeMonth}
                onYearChange={(y) => {
                  setYear(y);
                  setSelectedDay(null);
                }}
                onModeChange={(m) => {
                  setSelectedDay(null);
                  setLevel(m === 'year' ? 'year' : 'month');
                }}
                onSelectDay={selectDay}
              />
              <BancaPanel
                bets={bets}
                year={year}
                month={month}
                selectedDay={selectedDay}
                level={level}
                currency={currency}
                isAdmin={isAdmin}
                onAdd={openNew}
                onEdit={(b) => {
                  setEditing(b);
                  setPresetDate(null);
                  setFormOpen(true);
                }}
                onDelete={remove}
              />
            </div>

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-fgMuted">
                Apostas · {periodLabel}
              </h2>
              <BetsTable
                bets={scopedBets}
                currency={currency}
                isAdmin={isAdmin}
                showDate={level !== 'day'}
                onEdit={(b) => {
                  setEditing(b);
                  setPresetDate(null);
                  setFormOpen(true);
                }}
                onDelete={remove}
              />
            </section>
          </>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-fgDim">
        Página pública de leitura · dados atualizados em tempo real
      </footer>

      <BetFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        grp={group}
        editing={editing}
        presetDate={presetDate}
        onSave={save}
      />
      <BankrollModal
        open={bankrollOpen}
        onClose={() => setBankrollOpen(false)}
        current={startingBankroll}
        onSave={async (v) => {
          await updateBankroll(group, v);
          await reload();
        }}
      />
    </div>
  );
}
