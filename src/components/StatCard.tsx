import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
  tone?: 'default' | 'green' | 'red' | 'blue';
}

const TONE: Record<NonNullable<Props['tone']>, string> = {
  default: 'text-fg',
  green: 'text-green',
  red: 'text-red',
  blue: 'text-secondary',
};

export function StatCard({ label, value, hint, icon, tone = 'default' }: Props) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-fgMuted">
          {label}
        </span>
        {icon && <span className="text-fgDim">{icon}</span>}
      </div>
      <div className={`nums mt-2 text-2xl font-bold ${TONE[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-fgDim">{hint}</div>}
    </div>
  );
}
