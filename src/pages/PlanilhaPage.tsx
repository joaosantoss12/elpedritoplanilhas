import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from '../components/Header';
import { StatsPanel } from '../components/StatsPanel';
import { DrilldownChart } from '../components/DrilldownChart';
import { BetsTable } from '../components/BetsTable';
import { BetFormModal } from '../components/BetFormModal';
import { BankrollModal } from '../components/BankrollModal';
import { TimeNavPanel } from '../components/TimeNavPanel';
import { useAuth } from '../context/AuthContext';
import { useGroupData } from '../hooks/useGroupData';
import { computeStats, sortBets } from '../lib/stats';
import { filterByScope, scopeLabel, type Scope } from '../lib/scope';
import { createBet, deleteBet, updateBankroll, updateBet } from '../lib/api';
import { money } from '../lib/format';
import type { Bet, BetDraft, Group } from '../lib/types';
import { IconPlus, IconShare } from '../components/icons';

const GROUP_CTA: Record<Group, { label: string; href: string }> = {
  free: { label: 'Entrar no grupo Free', href: 'https://t.me/+JmHiwEn_RLw5MTlk' },
  vip: { label: 'Entrar no grupo VIP', href: 'https://vipedrito.com' },
};

function readGroup(): Group {
  const g = new URLSearchParams(location.search).get('grupo');
  return g === 'vip' ? 'vip' : 'free';
}

export function PlanilhaPage() {
  const { isAdmin } = useAuth();
  const [group, setGroup] = useState<Group>(readGroup);
  const [scope, setScope] = useState<Scope>({ level: 'all' });
  const [formOpen, setFormOpen] = useState(false);
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
    setScope({ level: 'all' });
  };

  const scoped = useMemo(() => sortBets(filterByScope(bets, scope)), [bets, scope]);

  const priorBankroll = useMemo(() => {
    if (scope.level === 'all') return startingBankroll;
    const start = `${scope.year}-${String((scope.month ?? 0) + 1).padStart(2, '0')}-${String(
      scope.day ?? 1,
    ).padStart(2, '0')}`;
    return (
      startingBankroll +
      bets.filter((b) => b.event_date < start).reduce((s, b) => s + Number(b.profit), 0)
    );
  }, [bets, scope, startingBankroll]);

  const stats = useMemo(
    () => computeStats(scoped, priorBankroll),
    [scoped, priorBankroll],
  );

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

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:pr-[268px]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              Planilha {group === 'vip' ? 'VIP' : 'Grátis'}
            </h1>
            <p className="text-sm text-fgMuted">{scopeLabel(scope)}</p>
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
              <button
                className="btn-primary"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
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
            <StatsPanel stats={stats} currency={currency} title={`Resumo · ${scopeLabel(scope)}`} />

            <DrilldownChart
              allBets={bets}
              startingBankroll={startingBankroll}
              currency={currency}
              scope={scope}
            />

            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-fgMuted">
                Apostas · {scopeLabel(scope)}
              </h2>
              <BetsTable
                bets={scoped}
                currency={currency}
                isAdmin={isAdmin}
                showDate={scope.level !== 'day'}
                onEdit={(b) => {
                  setEditing(b);
                  setFormOpen(true);
                }}
                onDelete={remove}
              />
            </section>
          </>
        )}
      </main>

      {!loading && !error && (
        <TimeNavPanel allBets={bets} scope={scope} onScopeChange={setScope} />
      )}

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-fgDim">
        Página pública de leitura · dados atualizados em tempo real
      </footer>

      <BetFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        grp={group}
        editing={editing}
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
