// 导出 Excel API
// POST /api/export  请求体: JSON { rows: TransactionRow[] }
// 未订阅用户返回 403，触发前端订阅引导。
// 成功返回 .xlsx 文件流。

import { NextRequest, NextResponse } from 'next/server';
import { buildExcelBuffer } from '@/lib/exporter';
import { isSubscribed } from '@/lib/subscription';
import type { TransactionRow } from '@/lib/types';

export async function POST(req: NextRequest) {
  // 订阅鉴权
  const subKey = req.headers.get('x-subscriber-key');
  if (!isSubscribed(subKey)) {
    return NextResponse.json(
      { ok: false, error: '此功能需订阅后使用。', code: 'SUBSCRIPTION_REQUIRED' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const rows: TransactionRow[] = Array.isArray(body?.rows) ? body.rows : [];

    if (rows.length === 0) {
      return NextResponse.json(
        { ok: false, error: '没有可导出的流水数据。' },
        { status: 400 }
      );
    }

    const buffer = await buildExcelBuffer(rows);
    // 重新构造纯 Uint8Array，其内部是全新 ArrayBuffer，规避类型联合问题
    const uint8 = new Uint8Array(buffer);
    const xlsxBody = uint8.buffer as ArrayBuffer;

    return new NextResponse(xlsxBody, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="flow_transactions.xlsx"',
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : '导出失败，请稍后重试。';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
