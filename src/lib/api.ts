import { supabase } from './supabase';
import type { Bet, BetDraft, Group, Settings } from './types';

export async function fetchBets(grp: Group): Promise<Bet[]> {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('grp', grp)
    .order('event_date', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Bet[];
}

export async function fetchSettings(grp: Group): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .select('grp, starting_bankroll, currency')
    .eq('grp', grp)
    .single();
  if (error) throw error;
  return data as Settings;
}

export async function createBet(draft: BetDraft): Promise<void> {
  const { error } = await supabase.from('bets').insert(draft);
  if (error) throw error;
}

export async function updateBet(id: string, patch: Partial<BetDraft>): Promise<void> {
  const { error } = await supabase.from('bets').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteBet(id: string): Promise<void> {
  const { error } = await supabase.from('bets').delete().eq('id', id);
  if (error) throw error;
}

export async function updateBankroll(grp: Group, starting_bankroll: number): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .update({ starting_bankroll })
    .eq('grp', grp);
  if (error) throw error;
}
