import type { Bet, Stats } from './types';

export const isSettled = (b: Bet) => b.status === 'green' || b.status === 'red';

export function sortBets(bets: Bet[]): Bet[] {
  return [...bets].sort(
    (a, b) =>
      a.event_date.localeCompare(b.event_date) ||
      a.created_at.localeCompare(b.created_at),
  );
}

export function computeStats(bets: Bet[], startingBankroll: number): Stats {
  const sorted = sortBets(bets);
  const greens = sorted.filter((b) => b.status === 'green');
  const reds = sorted.filter((b) => b.status === 'red');
  const pending = sorted.filter((b) => b.status === 'pending');
  const voids = sorted.filter((b) => b.status === 'void');
  const settled = greens.length + reds.length;

  const staked = sorted.reduce((s, b) => s + Number(b.stake), 0);
  const profit = sorted.reduce((s, b) => s + Number(b.profit), 0);
  const settledStake = [...greens, ...reds].reduce((s, b) => s + Number(b.stake), 0);

  // streak atual: percorre apostas resolvidas de tras para a frente
  let currentStreak = 0;
  const settledSorted = sorted.filter(isSettled);
  for (let i = settledSorted.length - 1; i >= 0; i--) {
    const s = settledSorted[i].status;
    if (i === settledSorted.length - 1) currentStreak = s === 'green' ? 1 : -1;
    else if (s === 'green' && currentStreak > 0) currentStreak++;
    else if (s === 'red' && currentStreak < 0) currentStreak--;
    else break;
  }

  return {
    count: sorted.length,
    settled,
    greens: greens.length,
    reds: reds.length,
    pending: pending.length,
    voids: voids.length,
    winRate: settled ? (greens.length / settled) * 100 : 0,
    staked,
    profit,
    roi: settledStake ? (profit / settledStake) * 100 : 0,
    avgOdd: sorted.length
      ? sorted.reduce((s, b) => s + Number(b.odd), 0) / sorted.length
      : 0,
    avgStake: sorted.length ? staked / sorted.length : 0,
    bestWin: greens.reduce((m, b) => Math.max(m, Number(b.profit)), 0),
    worstLoss: reds.reduce((m, b) => Math.min(m, Number(b.profit)), 0),
    currentStreak,
    bankrollStart: startingBankroll,
    bankrollEnd: startingBankroll + profit,
  };
}

export interface Bucket {
  key: string; // '2026-07' ou '2026-07-14' ou '0' (indice)
  label: string;
  year: number;
  month?: number; // 0..11
  day?: number;
  profit: number;
  staked: number;
  count: number;
  greens: number;
  reds: number;
  winRate: number;
  bankroll: number; // banca acumulada no fim do bucket
}

function finalize(list: Bet[], startBankroll: number, make: (b: Bet) => Omit<Bucket, 'profit' | 'staked' | 'count' | 'greens' | 'reds' | 'winRate' | 'bankroll'>): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const b of sortBets(list)) {
    const base = make(b);
    const cur =
      map.get(base.key) ??
      ({ ...base, profit: 0, staked: 0, count: 0, greens: 0, reds: 0, winRate: 0, bankroll: 0 } as Bucket);
    cur.profit += Number(b.profit);
    cur.staked += Number(b.stake);
    cur.count += 1;
    if (b.status === 'green') cur.greens += 1;
    if (b.status === 'red') cur.reds += 1;
    map.set(base.key, cur);
  }
  const out = [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
  let running = startBankroll;
  for (const bkt of out) {
    running += bkt.profit;
    bkt.bankroll = running;
    const settled = bkt.greens + bkt.reds;
    bkt.winRate = settled ? (bkt.greens / settled) * 100 : 0;
  }
  return out;
}

const MShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** Um bucket por ano com apostas. */
export function byYear(bets: Bet[], startBankroll: number): Bucket[] {
  return finalize(bets, startBankroll, (b) => {
    const y = Number(b.event_date.slice(0, 4));
    return { key: String(y), label: String(y), year: y };
  });
}

/** Um bucket por mes de um ano. */
export function byMonth(bets: Bet[], year: number, startBankroll: number): Bucket[] {
  const filtered = bets.filter((b) => b.event_date.startsWith(`${year}-`));
  return finalize(filtered, startBankroll, (b) => {
    const m = Number(b.event_date.slice(5, 7)) - 1;
    return { key: b.event_date.slice(0, 7), label: MShort[m], year, month: m };
  });
}

/** Um bucket por dia de um mes. */
export function byDay(
  bets: Bet[],
  year: number,
  month: number,
  startBankroll: number,
): Bucket[] {
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const filtered = bets.filter((b) => b.event_date.startsWith(prefix));
  return finalize(filtered, startBankroll, (b) => {
    const d = Number(b.event_date.slice(8, 10));
    return { key: b.event_date, label: String(d), year, month, day: d };
  });
}

/** Serie cumulativa da banca aposta-a-aposta (para a vista de dia). */
export function bankrollSeries(bets: Bet[], startBankroll: number) {
  let running = startBankroll;
  return sortBets(bets).map((b, i) => {
    running += Number(b.profit);
    return {
      key: b.id,
      idx: i + 1,
      label: `${b.team_a} vs ${b.team_b}`,
      profit: Number(b.profit),
      bankroll: running,
      status: b.status,
    };
  });
}
