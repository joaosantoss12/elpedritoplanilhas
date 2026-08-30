import type { BetStatus } from '../lib/types';

const MAP: Record<BetStatus, { label: string; cls: string; dot: string }> = {
  green: { label: 'Green', cls: 'bg-greenSoft text-green', dot: 'bg-green' },
  red: { label: 'Red', cls: 'bg-redSoft text-red', dot: 'bg-red' },
  pending: { label: 'Pendente', cls: 'bg-pendingSoft text-pending', dot: 'bg-pending' },
  void: { label: 'Anulada', cls: 'bg-white/[0.06] text-fgMuted', dot: 'bg-fgDim' },
};

export function StatusBadge({ status }: { status: BetStatus }) {
  const s = MAP[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold ${s.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  );
}
