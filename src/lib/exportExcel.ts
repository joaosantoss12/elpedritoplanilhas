import type ExcelJS from 'exceljs';
import type { Bet, Group, Stats } from './types';
import { sortBets } from './stats';
import { fmtDay } from './format';

// paleta alinhada com o site
const C = {
  primary: 'FF1E40AF',
  primaryDark: 'FF1E3A8A',
  accent: 'FF3B82F6',
  ink: 'FF0F172A',
  muted: 'FF64748B',
  line: 'FFE2E8F0',
  zebra: 'FFF8FAFC',
  green: 'FF047857',
  greenSoft: 'FFD1FAE5',
  red: 'FFB91C1C',
  redSoft: 'FFFEE2E2',
  amber: 'FFB45309',
  amberSoft: 'FFFEF3C7',
  slateSoft: 'FFF1F5F9',
} as const;

const MONEY = '#,##0.00" €"';
const SIGNED_MONEY = '+#,##0.00" €";-#,##0.00" €";0.00" €"';

const STATUS_PT: Record<Bet['status'], string> = {
  green: 'Green',
  red: 'Red',
  pending: 'Pendente',
  void: 'Anulada',
};

const STATUS_FILL: Record<Bet['status'], { bg: string; fg: string }> = {
  green: { bg: C.greenSoft, fg: C.green },
  red: { bg: C.redSoft, fg: C.red },
  pending: { bg: C.amberSoft, fg: C.amber },
  void: { bg: C.slateSoft, fg: C.muted },
};

const fill = (argb: string): ExcelJS.Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb },
});

const thin = { style: 'thin' as const, color: { argb: C.line } };

export async function downloadPlanilhaExcel(
  bets: Bet[],
  group: Group,
  stats: Stats,
  currency: string,
) {
  const rows = sortBets(bets);
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  wb.creator = 'EL PEDRITO';
  wb.created = new Date();

  const ws = wb.addWorksheet('Planilha', {
    views: [{ showGridLines: false, state: 'frozen', ySplit: 8 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });

  ws.columns = [
    { width: 13 }, // A data
    { width: 30 }, // B jogo
    { width: 30 }, // C mercado
    { width: 9 }, // D odd
    { width: 13 }, // E valor
    { width: 13 }, // F retorno
    { width: 13 }, // G estado
    { width: 15 }, // H lucro
    { width: 34 }, // I nota
  ];

  const money = (v: number) => `${v.toFixed(2).replace('.', ',')} ${currency === 'EUR' ? '€' : currency}`;

  // ---- cabeçalho ----
  ws.mergeCells('A1:I1');
  const title = ws.getCell('A1');
  title.value = `PLANILHA EL PEDRITO · ${group === 'vip' ? 'VIP' : 'GRÁTIS'}`;
  title.font = { name: 'Calibri', size: 18, bold: true, color: { argb: 'FFFFFFFF' } };
  title.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  title.fill = fill(C.primary);
  ws.getRow(1).height = 34;

  ws.mergeCells('A2:I2');
  const sub = ws.getCell('A2');
  const now = new Date().toISOString().slice(0, 10);
  sub.value = `Exportado a ${fmtDay(now)}    ·    ${rows.length} aposta${rows.length === 1 ? '' : 's'}`;
  sub.font = { name: 'Calibri', size: 10, color: { argb: 'FFFFFFFF' } };
  sub.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  sub.fill = fill(C.primaryDark);
  ws.getRow(2).height = 20;

  ws.getRow(3).height = 8;

  // ---- resumo ----
  const summary: [string, string, string?][] = [
    ['Banca inicial', money(stats.bankrollStart)],
    ['Banca final', money(stats.bankrollEnd)],
    ['Lucro / Prejuízo', `${stats.profit >= 0 ? '+' : ''}${money(stats.profit)}`, stats.profit >= 0 ? 'green' : 'red'],
    ['ROI', `${stats.roi >= 0 ? '+' : ''}${stats.roi.toFixed(1).replace('.', ',')} %`, stats.roi >= 0 ? 'green' : 'red'],
    ['Taxa de vitória', `${stats.winRate.toFixed(1).replace('.', ',')} %`],
    ['Green / Red', `${stats.greens} / ${stats.reds}`],
    ['Odd média', stats.avgOdd.toFixed(2).replace('.', ',')],
    ['Total investido', money(stats.staked)],
  ];

  const labelRow = ws.getRow(4);
  const valueRow = ws.getRow(5);
  labelRow.height = 16;
  valueRow.height = 22;
  summary.forEach(([label, value, tone], i) => {
    const col = i + 1;
    const lc = labelRow.getCell(col);
    lc.value = label.toUpperCase();
    lc.font = { name: 'Calibri', size: 8, bold: true, color: { argb: C.muted } };
    lc.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    lc.fill = fill(C.slateSoft);

    const vc = valueRow.getCell(col);
    vc.value = value;
    vc.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: tone === 'green' ? C.green : tone === 'red' ? C.red : C.ink },
    };
    vc.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    vc.fill = fill(C.slateSoft);
    vc.border = { bottom: { style: 'medium', color: { argb: C.accent } } };
  });

  ws.getRow(6).height = 10;

  // ---- tabela de apostas ----
  const HEAD_ROW = 8;
  const headers = ['Data', 'Jogo', 'Mercado', 'Odd', 'Valor', 'Retorno', 'Estado', 'Lucro / Prejuízo', 'Nota'];
  const hr = ws.getRow(HEAD_ROW);
  hr.height = 22;
  headers.forEach((h, i) => {
    const cell = hr.getCell(i + 1);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = fill(C.primary);
    cell.alignment = {
      vertical: 'middle',
      horizontal: i >= 3 && i <= 7 ? 'center' : 'left',
      indent: i >= 3 && i <= 7 ? 0 : 1,
    };
    cell.border = { bottom: { style: 'medium', color: { argb: C.primaryDark } } };
  });

  rows.forEach((b, idx) => {
    const r = ws.getRow(HEAD_ROW + 1 + idx);
    r.height = 18;
    const zebra = idx % 2 === 1;
    const base = zebra ? fill(C.zebra) : undefined;

    const cells: {
      v: ExcelJS.CellValue;
      align?: 'left' | 'center' | 'right';
      numFmt?: string;
      bold?: boolean;
      color?: string;
      fillOverride?: ExcelJS.Fill;
    }[] = [
      { v: fmtDay(b.event_date), align: 'left' },
      { v: `${b.team_a}  vs  ${b.team_b}`, align: 'left', bold: true },
      { v: b.market, align: 'left' },
      { v: Number(b.odd), align: 'center', numFmt: '0.00' },
      { v: Number(b.stake), align: 'center', numFmt: MONEY },
      { v: b.status === 'green' ? Number(b.return_amount) : b.status === 'pending' ? '—' : 0, align: 'center', numFmt: MONEY },
      {
        v: STATUS_PT[b.status],
        align: 'center',
        bold: true,
        color: STATUS_FILL[b.status].fg,
        fillOverride: fill(STATUS_FILL[b.status].bg),
      },
      {
        v: b.status === 'pending' ? '—' : Number(b.profit),
        align: 'center',
        numFmt: SIGNED_MONEY,
        bold: true,
        color: Number(b.profit) > 0 ? C.green : Number(b.profit) < 0 ? C.red : C.muted,
      },
      { v: b.note ?? '', align: 'left', color: C.muted },
    ];

    cells.forEach((c, i) => {
      const cell = r.getCell(i + 1);
      cell.value = c.v;
      if (c.numFmt && typeof c.v === 'number') cell.numFmt = c.numFmt;
      cell.font = {
        name: 'Calibri',
        size: 10,
        bold: c.bold,
        color: { argb: c.color ?? C.ink },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: c.align ?? 'left',
        indent: c.align === 'left' ? 1 : 0,
        wrapText: i === 8,
      };
      if (c.fillOverride) cell.fill = c.fillOverride;
      else if (base) cell.fill = base;
      cell.border = { bottom: thin };
    });
  });

  // ---- linha de totais ----
  const totalRow = ws.getRow(HEAD_ROW + 1 + rows.length);
  totalRow.height = 20;
  const totStake = rows.reduce((s, b) => s + Number(b.stake), 0);
  const totReturn = rows.reduce((s, b) => s + (b.status === 'green' ? Number(b.return_amount) : 0), 0);
  const totProfit = rows.reduce((s, b) => s + Number(b.profit), 0);
  const totCells: (ExcelJS.CellValue | null)[] = [
    'TOTAL', null, null, null, totStake, totReturn, null, totProfit, null,
  ];
  totCells.forEach((v, i) => {
    const cell = totalRow.getCell(i + 1);
    if (v !== null) cell.value = v;
    if (typeof v === 'number') cell.numFmt = i === 7 ? SIGNED_MONEY : MONEY;
    cell.font = {
      name: 'Calibri',
      size: 10,
      bold: true,
      color: { argb: i === 7 ? (totProfit >= 0 ? C.green : C.red) : C.ink },
    };
    cell.alignment = { vertical: 'middle', horizontal: i >= 3 ? 'center' : 'left', indent: i >= 3 ? 0 : 1 };
    cell.fill = fill(C.slateSoft);
    cell.border = { top: { style: 'medium', color: { argb: C.accent } } };
  });

  ws.autoFilter = { from: { row: HEAD_ROW, column: 1 }, to: { row: HEAD_ROW, column: 9 } };

  // ---- descarregar ----
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planilha-el-pedrito-${group}-${now}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
