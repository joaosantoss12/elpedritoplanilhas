export type Group = 'free' | 'vip';
export type BetStatus = 'pending' | 'green' | 'red' | 'void';

export interface Bet {
  id: string;
  grp: Group;
  event_date: string; // YYYY-MM-DD
  team_a: string;
  team_b: string;
  market: string;
  odd: number;
  stake: number;
  return_amount: number;
  status: BetStatus;
  note: string | null;
  profit: number;
  created_at: string;
  updated_at: string;
}

export type BetDraft = Omit<
  Bet,
  'id' | 'profit' | 'created_at' | 'updated_at'
>;

export interface Settings {
  grp: Group;
  starting_bankroll: number;
  currency: string;
}

export interface Stats {
  count: number;
  settled: number;
  greens: number;
  reds: number;
  pending: number;
  voids: number;
  winRate: number; // 0..100 sobre apostas resolvidas (green/red)
  staked: number;
  profit: number;
  roi: number; // %
  avgOdd: number;
  avgStake: number;
  bestWin: number;
  worstLoss: number;
  currentStreak: number; // + greens seguidos, - reds seguidos
  bankrollStart: number;
  bankrollEnd: number;
}
