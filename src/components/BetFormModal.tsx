import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import type { Bet, BetDraft, BetStatus, Group } from '../lib/types';
import { todayISO } from '../lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  grp: Group;
  editing: Bet | null;
  presetDate?: string | null;
  onSave: (draft: BetDraft, id?: string) => Promise<void>;
}

const STATUS: { v: BetStatus; label: string }[] = [
  { v: 'pending', label: 'Pendente' },
  { v: 'green', label: 'Green' },
  { v: 'red', label: 'Red' },
  { v: 'void', label: 'Anulada' },
];

const empty = (grp: Group): BetDraft => ({
  grp,
  event_date: todayISO(),
  team_a: '',
  team_b: '',
  market: '',
  odd: 1.9,
  stake: 10,
  return_amount: 19,
  status: 'pending',
  note: '',
});

export function BetFormModal({ open, onClose, grp, editing, presetDate, onSave }: Props) {
  const [form, setForm] = useState<BetDraft>(empty(grp));
  const [nums, setNums] = useState({ odd: '', stake: '', return_amount: '' });
  const [touchedReturn, setTouchedReturn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    setTouchedReturn(Boolean(editing));
    const next: BetDraft = editing
      ? {
          grp: editing.grp,
          event_date: editing.event_date,
          team_a: editing.team_a,
          team_b: editing.team_b,
          market: editing.market,
          odd: editing.odd,
          stake: editing.stake,
          return_amount: editing.return_amount,
          status: editing.status,
          note: editing.note ?? '',
        }
      : { ...empty(grp), event_date: presetDate ?? todayISO() };
    setForm(next);
    setNums({
      odd: String(next.odd),
      stake: String(next.stake),
      return_amount: String(next.return_amount),
    });
  }, [open, editing, grp, presetDate]);

  // retorno potencial auto (enquanto o admin nao o editar manualmente)
  useEffect(() => {
    if (touchedReturn) return;
    const val = +(form.odd * form.stake).toFixed(2);
    setForm((f) => ({ ...f, return_amount: val }));
    setNums((n) => ({ ...n, return_amount: String(val) }));
  }, [form.odd, form.stake, touchedReturn]);

  const set = <K extends keyof BetDraft>(k: K, v: BetDraft[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // campos numericos: mantem o texto tal como escrito (permite apagar) e
  // guarda o valor parseado no form
  const setNum = (k: 'odd' | 'stake' | 'return_amount', v: string) => {
    setNums((n) => ({ ...n, [k]: v }));
    setForm((f) => ({ ...f, [k]: v.trim() === '' ? 0 : parseFloat(v) || 0 }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.team_a.trim() || !form.team_b.trim() || !form.market.trim()) {
      setErr('Preenche as equipas e o mercado.');
      return;
    }
    if (form.odd < 1) {
      setErr('A odd tem de ser ≥ 1.');
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      await onSave({ ...form, note: form.note?.trim() || null }, editing?.id);
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Erro ao guardar.');
    } finally {
      setBusy(false);
    }
  };

  const profit =
    form.status === 'green'
      ? form.return_amount - form.stake
      : form.status === 'red'
        ? -form.stake
        : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? 'Editar aposta' : 'Nova aposta'}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancelar
          </button>
          <button type="submit" form="bet-form" className="btn-primary" disabled={busy}>
            {busy ? 'A guardar…' : editing ? 'Guardar alterações' : 'Adicionar aposta'}
          </button>
        </>
      }
    >
      <form id="bet-form" onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="label" htmlFor="d">Data do evento</label>
            <input
              id="d"
              type="date"
              className="input nums"
              value={form.event_date}
              onChange={(e) => set('event_date', e.target.value)}
              required
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="label" htmlFor="st">Estado</label>
            <select
              id="st"
              className="input"
              value={form.status}
              onChange={(e) => set('status', e.target.value as BetStatus)}
            >
              {STATUS.map((s) => (
                <option key={s.v} value={s.v}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="a">Equipa A</label>
            <input id="a" className="input" value={form.team_a}
              onChange={(e) => set('team_a', e.target.value)} placeholder="Benfica" required />
          </div>
          <div>
            <label className="label" htmlFor="b">Equipa B</label>
            <input id="b" className="input" value={form.team_b}
              onChange={(e) => set('team_b', e.target.value)} placeholder="Porto" required />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="m">Mercado</label>
          <input id="m" className="input" value={form.market}
            onChange={(e) => set('market', e.target.value)}
            placeholder="Mais de 2.5 golos" required />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="o">Odd</label>
            <input id="o" type="number" step="0.01" min="1" className="input nums"
              value={nums.odd}
              onChange={(e) => setNum('odd', e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="s">Valor (€)</label>
            <input id="s" type="number" step="0.01" min="0" className="input nums"
              value={nums.stake}
              onChange={(e) => setNum('stake', e.target.value)} required />
          </div>
          <div>
            <label className="label" htmlFor="r">Retorno (€)</label>
            <input id="r" type="number" step="0.01" min="0" className="input nums"
              value={nums.return_amount}
              onChange={(e) => {
                setTouchedReturn(true);
                setNum('return_amount', e.target.value);
              }} required />
          </div>
        </div>

        <div>
          <label className="label" htmlFor="n">Nota (opcional)</label>
          <textarea id="n" className="input min-h-[64px]" value={form.note ?? ''}
            onChange={(e) => set('note', e.target.value)} placeholder="Análise, contexto…" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border bg-bg/50 px-3.5 py-2.5 text-sm">
          <span className="text-fgMuted">Lucro / prejuízo desta aposta</span>
          <span
            className={`nums font-bold ${
              profit > 0 ? 'text-green' : profit < 0 ? 'text-red' : 'text-fgMuted'
            }`}
          >
            {profit > 0 ? '+' : ''}
            {profit.toFixed(2)} €
          </span>
        </div>

        {err && (
          <p role="alert" className="rounded-xl bg-redSoft px-3 py-2 text-sm text-red">
            {err}
          </p>
        )}
      </form>
    </Modal>
  );
}
