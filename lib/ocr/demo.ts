// Demo OCR 供应商
// 用于开发与演示：无需外部密钥，直接从 Buffer 中读取 UTF-8 文本并按行拆分。
// 真实场景请切换到 aws 供应商或接入其他 OCR 服务。

import type { OcrProvider, OcrResult } from '../types';

export class DemoOcrProvider implements OcrProvider {
  async recognize(buffer: Buffer): Promise<OcrResult> {
    // demo 模式：把内容当作纯文本处理；若为 PDF/图片则提示需真实 OCR
    const text = buffer.toString('utf-8');
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      return {
        text: '',
        lines: [],
      };
    }

    return { text, lines };
  }
}

export const demoProvider = new DemoOcrProvider();
