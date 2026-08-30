import { useState } from 'react';
import type { Group } from '../lib/types';
import { useAuth } from '../context/AuthContext';
import { LoginModal } from './LoginModal';
import { IconLock, IconLogout, IconShare, IconCheck } from './icons';

interface Props {
  group: Group;
  onGroupChange: (g: Group) => void;
}

export function Header({ group, onGroupChange }: Props) {
  const { isAdmin, signOut } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${location.origin}${location.pathname}?grupo=${group}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copia o link:', url);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-mono text-sm font-bold">
            P
          </div>
          <div className="leading-tight">
            <p className="text-sm font-bold">Planilha PEDRITO</p>
            <p className="text-[11px] text-fgDim">Apontamento de apostas</p>
          </div>
        </div>

        <div
          role="tablist"
          aria-label="Grupo"
          className="ml-auto flex rounded-xl border border-border bg-white/[0.03] p-1"
        >
          {(['free', 'vip'] as Group[]).map((g) => (
            <button
              key={g}
              role="tab"
              aria-selected={group === g}
              onClick={() => onGroupChange(g)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                group === g
                  ? g === 'vip'
                    ? 'bg-green text-white'
                    : 'bg-primary text-white'
                  : 'text-fgMuted hover:text-fg'
              }`}
            >
              {g === 'free' ? 'Grátis' : 'VIP'}
            </button>
          ))}
        </div>

        <button className="btn-ghost" onClick={share}>
          {copied ? <IconCheck className="text-green" /> : <IconShare />}
          <span className="hidden sm:inline">{copied ? 'Link copiado' : 'Partilhar'}</span>
        </button>

        {isAdmin ? (
          <button className="btn-ghost" onClick={() => signOut()}>
            <IconLogout />
            <span className="hidden sm:inline">Sair</span>
          </button>
        ) : (
          <button className="btn-ghost" onClick={() => setLoginOpen(true)}>
            <IconLock />
            <span className="hidden sm:inline">Admin</span>
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="bg-green/10 py-1 text-center text-[11px] font-medium text-green">
          Modo administrador — as alterações são guardadas e vistas por todos
        </div>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}
