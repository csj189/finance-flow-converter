// OCR 识别模块
// 提供统一的 OcrResult 抽象，屏蔽不同供应商差异。
// 通过环境变量 OCR_PROVIDER 切换：demo（内置模拟，无需密钥）/ aws（AWS Textract）
// 接入新供应商时，实现 OcrProvider 接口并在 getProvider() 中注册即可，不改变调用方。

import type { OcrProvider, OcrResult } from '../types';

/**
 * 获取当前启用的 OCR 供应商。
 * 动态加载以避免为未使用的供应商拉取重依赖（如 AWS SDK）。
 */
export async function getProvider(): Promise<OcrProvider> {
  const name = process.env.OCR_PROVIDER || 'demo';
  if (name === 'aws') {
    const mod = await import('./aws');
    return mod.awsProvider;
  }
  // 默认 / demo
  const mod = await import('./demo');
  return mod.demoProvider;
}

/** 统一入口：识别 */
export async function recognize(buffer: Buffer, mimeType: string): Promise<OcrResult> {
  const provider = await getProvider();
  return provider.recognize(buffer, mimeType);
}
