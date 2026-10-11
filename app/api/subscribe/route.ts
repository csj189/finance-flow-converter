// 订阅校验 API
// GET /api/subscribe  查询订阅状态（demo：返回是否有效）
// POST /api/subscribe 携带订阅密钥，返回有效性与是否开通

import { NextRequest, NextResponse } from 'next/server';
import { isSubscribed } from '@/lib/subscription';

export async function GET(req: NextRequest) {
  const subKey = req.headers.get('x-subscriber-key');
  return NextResponse.json({ ok: true, data: { subscribed: isSubscribed(subKey) } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key: string = typeof body?.key === 'string' ? body.key : '';
    if (!key) {
      return NextResponse.json(
        { ok: false, error: '缺少订阅密钥。' },
        { status: 400 }
      );
    }
    const subscribed = isSubscribed(key);
    if (!subscribed) {
      return NextResponse.json(
        { ok: false, error: '订阅密钥无效。', code: 'INVALID_KEY' },
        { status: 403 }
      );
    }
    return NextResponse.json({ ok: true, data: { subscribed: true } });
  } catch (e) {
    const message = e instanceof Error ? e.message : '校验失败，请稍后重试。';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
