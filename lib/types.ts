// 财务流水转 Excel 工具 - 共享类型定义

/** OCR 供应商统一接口（屏蔽不同服务商差异） */
export interface OcrProvider {
  /** 识别 PDF/图片文本，返回统一 OcrResult */
  recognize(buffer: Buffer, mimeType: string): Promise<OcrResult>;
}

/** 单条银行流水记录 */
export interface TransactionRow {
  id: string;
  date: string;          // 交易日期，格式 YYYY-MM-DD
  summary: string;       // 摘要 / 备注
  income: string;        // 收入金额（字符串保留原样，避免浮点误差）
  expense: string;       // 支出金额（字符串）
  balance: string;       // 余额（字符串）
  /** 字段是否被识别为可能错误（待用户确认） */
  flagged: boolean;
  /** 用户是否人工修正过该行 */
  edited: boolean;
}

/** 解析结果 */
export interface ParseResult {
  rows: TransactionRow[];
  warnings: string[];       // 解析过程中的提示，如疑似错行
  sourceText: string;       // OCR 提取的原始文本（用于预览/调试）
  bankName?: string;        // 识别出的银行名称（可选）
  currency?: string;        // 识别出的币种（可选）
}

/** OCR 识别结果（统一抽象，屏蔽不同供应商差异） */
export interface OcrResult {
  text: string;             // 全文本
  /** 文本中识别到的行级块（OCR 按行返回，解析引擎据此分行） */
  lines: string[];
}

/** 解析引擎的版式模板 */
export interface LayoutTemplate {
  name: string;
  /** 是否匹配该版式（基于文本特征） */
  match(text: string): boolean;
  /** 把一行原始文本解析成流水字段 */
  parseLine(line: string): Partial<TransactionRow> | null;
}
