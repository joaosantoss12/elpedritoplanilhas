import { useCallback, useEffect, useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase';
import { fetchBets, fetchSettings } from '../lib/api';
import type { Bet, Group, Settings } from '../lib/types';

export function useGroupData(grp: Group) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!hasSupabase) {
      setLoading(false);
      setError('Configura o Supabase (.env) para carregar dados.');
      return;
    }
    try {
      setError(null);
      const [b, s] = await Promise.all([fetchBets(grp), fetchSettings(grp)]);
      setBets(b);
      setSettings(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro a carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [grp]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  // realtime: qualquer alteracao do admin aparece nos visitantes
  useEffect(() => {
    if (!hasSupabase) return;
    const ch = supabase
      .channel(`rt-${grp}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bets', filter: `grp=eq.${grp}` },
        () => reload(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'settings', filter: `grp=eq.${grp}` },
        () => reload(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [grp, reload]);

  return { bets, settings, loading, error, reload };
}
