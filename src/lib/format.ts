export const money = (v: number, currency = 'EUR') =>
  new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(v || 0);

export const signedMoney = (v: number, currency = 'EUR') =>
  (v > 0 ? '+' : '') + money(v, currency);

export const pct = (v: number, digits = 1) =>
  `${(v || 0).toFixed(digits)}%`;

export const num = (v: number, digits = 2) => (v || 0).toFixed(digits);

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export const monthName = (m: number) => MONTHS_PT[m] ?? '';
export const monthShort = (m: number) => (MONTHS_PT[m] ?? '').slice(0, 3);

export const fmtDay = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')} ${monthShort(m - 1)} ${y}`;
};

export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
};
