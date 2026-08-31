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
import { fmtDay, money, monthName } from '../lib/format';
import type { Bet, BetDraft, Group } from '../lib/types';
import { IconPlus, IconShare } from '../components/icons';

const GROUP_CTA: Record<Group, { label: string; href: string }> = {
  free: { label: 'Entrar no grupo Free', href: 'https://t.me/+JmHiwEn_RLw5MTlk' },
  vip: { label: 'Entrar no grupo VIP', href: 'https://vipedrito.com' },
};

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
  const [view, setView] = useState<'day' | 'month' | 'year'>('month');
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
    setView('month');
  };

  const monthPrefix = `${year}-${pad(month + 1)}`;

  const monthBets = useMemo(
    () => sortBets(bets.filter((b) => b.event_date.startsWith(monthPrefix))),
    [bets, monthPrefix],
  );
  const yearBets = useMemo(
    () => sortBets(bets.filter((b) => b.event_date.startsWith(`${year}-`))),
    [bets, year],
  );

  const scopedBets = useMemo(() => {
    if (view === 'year') return yearBets;
    if (selectedDay) return monthBets.filter((b) => b.event_date === selectedDay);
    return monthBets;
  }, [view, yearBets, monthBets, selectedDay]);

  const priorBankroll = useMemo(() => {
    const start = view === 'year' ? `${year}-01-01` : `${monthPrefix}-01`;
    return (
      startingBankroll +
      bets.filter((b) => b.event_date < start).reduce((s, b) => s + Number(b.profit), 0)
    );
  }, [bets, view, year, monthPrefix, startingBankroll]);

  const stats = useMemo(
    () => computeStats(view === 'year' ? yearBets : monthBets, priorBankroll),
    [view, yearBets, monthBets, priorBankroll],
  );

  const periodLabel =
    view === 'year'
      ? `Ano de ${year}`
      : selectedDay
        ? fmtDay(selectedDay)
        : `${monthName(month)} de ${year}`;

  const selectDay = (iso: string | null) => {
    setSelectedDay(iso);
    setView(iso ? 'day' : 'month');
  };

  const changeMonth = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
    setSelectedDay(null);
    setView('month');
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
            <StatsPanel stats={stats} currency={currency} title={`Resumo · ${periodLabel}`} />

            <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
              <BancaCalendar
                bets={bets}
                year={year}
                month={month}
                selectedDay={selectedDay}
                onMonthChange={changeMonth}
                onSelectDay={selectDay}
              />
              <BancaPanel
                bets={bets}
                year={year}
                month={month}
                selectedDay={selectedDay}
                view={view}
                onViewChange={setView}
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
                showDate={!selectedDay}
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
