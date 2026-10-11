// OCR 识别 API
// POST /api/ocr  请求体: multipart/form-data，字段 file
// 返回: { ok, data: { text, lines } } 或错误信息

import { NextRequest, NextResponse } from 'next/server';
import { recognize } from '@/lib/ocr';

const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: '缺少文件，请上传 PDF 或图片。' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { ok: false, error: '文件过大，请上传 20MB 以内的文件。' },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await recognize(buffer, file.type);

    return NextResponse.json({ ok: true, data: result });
  } catch (e) {
    const message = e instanceof Error ? e.message : '识别失败，请稍后重试。';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
