// 流水解析 API
// POST /api/parse  请求体: JSON { lines: string[] }
// 返回: { ok, data: { rows, warnings, sourceText } }

import { NextRequest, NextResponse } from 'next/server';
import { parseTransactions } from '@/lib/parser';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const lines: string[] = Array.isArray(body?.lines) ? body.lines : [];

    if (lines.length === 0) {
      return NextResponse.json(
        { ok: false, error: '未提供待解析的文本行。' },
        { status: 400 }
      );
    }

    const result = parseTransactions(lines);
    return NextResponse.json({ ok: true, data: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : '解析失败，请稍后重试。';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
