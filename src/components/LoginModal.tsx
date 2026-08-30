import { useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../context/AuthContext';

export function LoginModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await signIn(email.trim(), password);
      onClose();
      setPassword('');
    } catch {
      setErr('Credenciais inválidas.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Entrar como administrador"
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} disabled={busy}>Cancelar</button>
          <button type="submit" form="login-form" className="btn-primary" disabled={busy}>
            {busy ? 'A entrar…' : 'Entrar'}
          </button>
        </>
      }
    >
      <form id="login-form" onSubmit={submit} className="space-y-4">
        <p className="text-sm text-fgMuted">
          Esta página é pública e apenas de leitura. Só o administrador precisa de entrar
          para editar as planilhas.
        </p>
        <div>
          <label className="label" htmlFor="e">Email</label>
          <input id="e" type="email" autoComplete="email" className="input" value={email}
            onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="p">Password</label>
          <div className="relative">
            <input id="p" type={show ? 'text' : 'password'} autoComplete="current-password"
              className="input pr-16" value={password}
              onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-fgMuted hover:text-fg">
              {show ? 'Ocultar' : 'Ver'}
            </button>
          </div>
        </div>
        {err && (
          <p role="alert" className="rounded-xl bg-redSoft px-3 py-2 text-sm text-red">{err}</p>
        )}
      </form>
    </Modal>
  );
}
