// Excel 导出模块
// 用 exceljs 在服务端生成 .xlsx，列结构对账友好：
// 交易日期 | 摘要 | 收入 | 支出 | 余额
// 导出数据以用户预览纠错后的 rows 为准。

import ExcelJS from 'exceljs';
import type { TransactionRow } from './types';

export interface ExportOptions {
  sheetName?: string;
  currency?: string;
}

export async function buildExcelBuffer(
  rows: TransactionRow[],
  options: ExportOptions = {}
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Finance Flow Converter';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(options.sheetName || '流水明细');

  // 表头
  const header = ['交易日期', '摘要', '收入', '支出', '余额'];
  sheet.addRow(header);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).alignment = { vertical: 'middle' };

  // 数据
  for (const r of rows) {
    sheet.addRow([
      r.date,
      r.summary,
      r.income ? parseFloat(r.income) : '',
      r.expense ? parseFloat(r.expense) : '',
      r.balance ? parseFloat(r.balance) : '',
    ]);
  }

  // 列宽
  sheet.columns.forEach((col, i) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (col as any).width = i === 1 ? 32 : 16;
  });

  // 金额列格式：千分位两位小数
  for (let i = 2; i <= sheet.rowCount; i++) {
    const row = sheet.getRow(i);
    [3, 4, 5].forEach((colIdx) => {
      const cell = row.getCell(colIdx);
      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0.00';
      }
    });
  }

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}
