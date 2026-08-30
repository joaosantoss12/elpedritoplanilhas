import { useEffect, useState } from 'react';
import { Modal } from './Modal';

interface Props {
  open: boolean;
  onClose: () => void;
  current: number;
  onSave: (v: number) => Promise<void>;
}

export function BankrollModal({ open, onClose, current, onSave }: Props) {
  const [v, setV] = useState(current);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setV(current);
      setErr(null);
    }
  }, [open, current]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave(v);
      onClose();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Erro ao guardar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Banca inicial"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" form="bk-form" className="btn-primary" disabled={busy}>
            {busy ? 'A guardar…' : 'Guardar'}
          </button>
        </>
      }
    >
      <form id="bk-form" onSubmit={submit} className="space-y-3">
        <p className="text-sm text-fgMuted">
          Valor de partida da banca deste grupo. Serve de base para a evolução nos gráficos.
        </p>
        <label className="label" htmlFor="bk">Valor inicial (€)</label>
        <input
          id="bk"
          type="number"
          step="0.01"
          min="0"
          className="input nums"
          value={v}
          onChange={(e) => setV(parseFloat(e.target.value) || 0)}
          autoFocus
        />
        {err && <p role="alert" className="rounded-xl bg-redSoft px-3 py-2 text-sm text-red">{err}</p>}
      </form>
    </Modal>
  );
}
