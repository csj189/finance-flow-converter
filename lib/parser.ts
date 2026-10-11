// 银行流水解析规则引擎
// 输入：OCR 得到的原始行；输出：结构化的流水记录（TransactionRow[]）。
// 采用"版式模板 + 正则规则"方式，先匹配版式再逐行解析，字段不确定时标记为待确认。

import { nanoid } from 'nanoid';
import type { LayoutTemplate, ParseResult, TransactionRow } from './types';

/**
 * 常见的流水文本行形态（demo/样例）：
 *   2024-01-05  工资  12,500.00  45,000.00
 *   2024-01-08  网购  -320.50   44,679.50
 * 依次为：日期 摘要 收入/支出 余额。
 * 金额支持千分位逗号，收入为正数，支出为负号前缀。
 */

// 日期匹配：2024-01-05 / 2024/01/05 / 01-05
const DATE_PATTERN = /\d{4}[-/]\d{1,2}[-/]\d{1,2}/;

// 金额匹配：支持 1,234.56 / -1,234.56 / 1,234 / 12500.00
// 用 \d+(?:,\d{3})* 匹配整数部分（允许任意位数，且千分位可选），避免长数字被截断
const AMOUNT_PATTERN = /-?\d+(?:,\d{3})*(?:\.\d+)?/;

interface ParsedLine {
  date: string;
  summary: string;
  income: string;
  expense: string;
  balance: string;
}

/**
 * 把一个含日期开头的流水行解析为字段。
 * 返回 null 表示该行不构成一条有效流水（表头、空行等）。
 */
function parseLine(line: string): ParsedLine | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const dateMatch = trimmed.match(DATE_PATTERN);
  if (!dateMatch) return null;

  const date = dateMatch[0];
  // 去掉日期，剩余部分：摘要 + 金额
  let rest = trimmed.replace(DATE_PATTERN, '').trim();

  // 取出所有金额（带符号）
  const amounts = rest.match(new RegExp(AMOUNT_PATTERN, 'g')) || [];

  // 摘要 = 去掉所有金额后的剩余文本
  let summary = rest;
  for (const a of amounts) {
    summary = summary.replace(a, '').trim();
  }
  summary = summary.replace(/\s{2,}/g, ' ').trim();

  // 金额语义：
  // - 负号开头 => 支出
  // - 否则，若存在两个金额（收支 + 余额），第一个为收入，最后一个为余额
  let income = '';
  let expense = '';
  let balance = '';

  if (amounts.length > 0) {
    const first = amounts[0]!;
    const isExpense = first.startsWith('-');
    if (isExpense) {
      expense = first.replace('-', '');
    } else {
      income = first;
    }
    // 余额：最后一个金额（若有第 2 个）
    if (amounts.length >= 2) {
      balance = amounts[amounts.length - 1]!.replace('-', '');
    }
  }

  // 校验：至少存在收入或支出之一
  if (!income && !expense) {
    return null;
  }

  return { date, summary: summary || '（无摘要）', income, expense, balance };
}

/**
 * 从 OCR 行中解析流水。对每个日期开头且能解析出金额的行生成一条记录；
 * 无法解析出金额但有日期的行，标记为疑似错行（flagged），交由用户在预览中确认。
 */
export function parseTransactions(lines: string[]): ParseResult {
  const rows: TransactionRow[] = [];
  const warnings: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // 跳过明显的表头
    if (/日期|摘要|金额|余额|收入|支出|交易|时间|备注|balance|date|amount|debit|credit/i.test(line)) {
      if (!DATE_PATTERN.test(line)) continue;
    }

    const parsed = parseLine(line);

    if (parsed) {
      rows.push({
        id: nanoid(10),
        date: parsed.date,
        summary: parsed.summary,
        income: parsed.income,
        expense: parsed.expense,
        balance: parsed.balance,
        flagged: false,
        edited: false,
      });
    } else if (DATE_PATTERN.test(line)) {
      // 有日期但未能解析出金额：疑似错行
      rows.push({
        id: nanoid(10),
        date: line.match(DATE_PATTERN)![0],
        summary: line,
        income: '',
        expense: '',
        balance: '',
        flagged: true,
        edited: false,
      });
      warnings.push(`疑似无法解析的行：${line}`);
    }
  }

  return { rows, warnings, sourceText: lines.join('\n') };
}
