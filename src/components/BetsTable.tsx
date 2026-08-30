import type { Bet } from '../lib/types';
import { StatusBadge } from './StatusBadge';
import { IconEdit, IconTrash } from './icons';
import { fmtDay, money, num } from '../lib/format';

interface Props {
  bets: Bet[];
  currency: string;
  isAdmin: boolean;
  showDate?: boolean;
  onEdit: (b: Bet) => void;
  onDelete: (b: Bet) => void;
}

export function BetsTable({ bets, currency, isAdmin, showDate = true, onEdit, onDelete }: Props) {
  if (bets.length === 0) {
    return (
      <div className="card grid place-items-center p-10 text-center">
        <p className="text-sm text-fgMuted">Sem apostas para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* Desktop */}
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-fgMuted">
            {showDate && <th className="px-4 py-3 font-medium">Data</th>}
            <th className="px-4 py-3 font-medium">Jogo</th>
            <th className="px-4 py-3 font-medium">Mercado</th>
            <th className="px-4 py-3 text-right font-medium">Odd</th>
            <th className="px-4 py-3 text-right font-medium">Valor</th>
            <th className="px-4 py-3 text-right font-medium">Retorno</th>
            <th className="px-4 py-3 text-right font-medium">P/L</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            {isAdmin && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody>
          {bets.map((b) => (
            <tr key={b.id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02]">
              {showDate && <td className="nums whitespace-nowrap px-4 py-3 text-fgMuted">{fmtDay(b.event_date)}</td>}
              <td className="px-4 py-3 font-medium">{b.team_a} <span className="text-fgDim">vs</span> {b.team_b}</td>
              <td className="px-4 py-3 text-fgMuted">{b.market}</td>
              <td className="nums px-4 py-3 text-right">{num(b.odd)}</td>
              <td className="nums px-4 py-3 text-right">{money(b.stake, currency)}</td>
              <td className="nums px-4 py-3 text-right text-fgMuted">{money(b.return_amount, currency)}</td>
              <td className={`nums px-4 py-3 text-right font-semibold ${b.profit > 0 ? 'text-green' : b.profit < 0 ? 'text-red' : 'text-fgDim'}`}>
                {b.profit > 0 ? '+' : ''}{money(b.profit, currency)}
              </td>
              <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
              {isAdmin && (
                <td className="px-2 py-3">
                  <div className="flex justify-end gap-1">
                    <button className="btn-ghost h-8 w-8 !px-0" aria-label="Editar" onClick={() => onEdit(b)}><IconEdit width={15} height={15} /></button>
                    <button className="btn-ghost h-8 w-8 !px-0 hover:!text-red" aria-label="Eliminar" onClick={() => onDelete(b)}><IconTrash width={15} height={15} /></button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile */}
      <ul className="divide-y divide-border md:hidden">
        {bets.map((b) => (
          <li key={b.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{b.team_a} <span className="text-fgDim">vs</span> {b.team_b}</p>
                <p className="text-xs text-fgMuted">{b.market}</p>
                {showDate && <p className="nums mt-1 text-xs text-fgDim">{fmtDay(b.event_date)}</p>}
              </div>
              <StatusBadge status={b.status} />
            </div>
            <div className="nums mt-3 grid grid-cols-4 gap-2 text-center text-xs">
              <div><div className="text-fgDim">Odd</div><div className="font-semibold">{num(b.odd)}</div></div>
              <div><div className="text-fgDim">Valor</div><div className="font-semibold">{money(b.stake, currency)}</div></div>
              <div><div className="text-fgDim">Retorno</div><div className="font-semibold">{money(b.return_amount, currency)}</div></div>
              <div><div className="text-fgDim">P/L</div><div className={`font-semibold ${b.profit > 0 ? 'text-green' : b.profit < 0 ? 'text-red' : 'text-fgDim'}`}>{b.profit > 0 ? '+' : ''}{money(b.profit, currency)}</div></div>
            </div>
            {isAdmin && (
              <div className="mt-3 flex gap-2">
                <button className="btn-ghost flex-1 py-2 text-xs" onClick={() => onEdit(b)}><IconEdit width={14} height={14} /> Editar</button>
                <button className="btn-ghost flex-1 py-2 text-xs hover:!text-red" onClick={() => onDelete(b)}><IconTrash width={14} height={14} /> Eliminar</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
