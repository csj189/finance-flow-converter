// AWS Textract OCR 供应商
// 接入 AWS Textract 进行文档文本提取。需配置 AWS_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY。
// 通过 next.config 的 serverExternalPackages 将 AWS SDK 作为外部依赖，
// 运行期使用 require 动态加载，避免在未使用 AWS 时引入包。

import type { OcrProvider, OcrResult } from '../types';

// 最小类型声明，避免对未安装包的顶层静态导入
interface TextractBlocks {
  Blocks?: Array<{
    BlockType?: string;
    Text?: string;
    Geometry?: { BoundingBox?: { Top?: number } };
  }>;
}

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`缺少环境变量 ${name}`);
  return v;
}

function getClient() {
  // 运行期 require：仅在 OCR_PROVIDER=aws 且 SDK 已安装时加载
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { TextractClient } = require('@aws-sdk/client-textract') as {
    TextractClient: new (cfg: {
      region: string;
      credentials: { accessKeyId: string; secretAccessKey: string };
    }) => {
      send(cmd: unknown): Promise<TextractBlocks>;
    };
  };
  const region = process.env.AWS_REGION || required('AWS_REGION');
  return new TextractClient({
    region,
    credentials: {
      accessKeyId: required('AWS_ACCESS_KEY_ID'),
      secretAccessKey: required('AWS_SECRET_ACCESS_KEY'),
    },
  });
}

export class AwsTextractProvider implements OcrProvider {
  async recognize(buffer: Buffer): Promise<OcrResult> {
    const client = getClient();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { DetectDocumentTextCommand } = require('@aws-sdk/client-textract') as {
      DetectDocumentTextCommand: new (cfg: {
        Document: { Bytes: Buffer };
      }) => unknown;
    };
    const cmd = new DetectDocumentTextCommand({ Document: { Bytes: buffer } });
    const resp = await client.send(cmd);

    const blocks = (resp.Blocks || []).filter((b) => b.BlockType === 'LINE');
    blocks.sort((a, b) => (a.Geometry?.BoundingBox?.Top ?? 0) - (b.Geometry?.BoundingBox?.Top ?? 0));

    const lines = blocks
      .map((b) => b.Text?.trim() ?? '')
      .filter((t) => t.length > 0);

    return { text: lines.join('\n'), lines };
  }
}

export const awsProvider = new AwsTextractProvider();
