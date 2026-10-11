# 财务流水转 Excel 工具 · 项目使用说明

一个基于 Next.js 的 MVP，实现「上传 PDF → OCR 识别 → 流水解析 → 预览纠错 → 导出 Excel」全流程。遵循 Samuel Rondot「1% 优化 + 轻框架低维护」思路，适合单人维护、后续通过 SEO 获客。

## 一、项目结构

```
finance-flow-converter/
├── app/
│   ├── page.tsx              # 首页（SEO 落地页）
│   ├── convert/page.tsx      # 转换工作台（上传→识别→预览→导出）
│   ├── layout.tsx
│   └── api/
│       ├── ocr/route.ts      # POST 上传文件→OCR
│       ├── parse/route.ts    # POST 文本行→流水解析
│       ├── export/route.ts   # POST 导出Excel（需订阅）
│       └── subscribe/route.ts# 订阅鉴权
├── lib/
│   ├── types.ts              # 共享类型
│   ├── parser.ts             # 流水解析规则引擎
│   ├── exporter.ts           # Excel 生成（exceljs）
│   ├── subscription.ts       # 订阅鉴权
│   └── ocr/
│       ├── index.ts          # OCR 统一入口（按环境变量切换）
│       ├── demo.ts           # demo 识别（无需密钥，开发用）
│       └── aws.ts            # AWS Textract 接入
├── .env.example              # 环境变量模板
└── package.json
```

## 二、如何运行

```bash
cd finance-flow-converter
npm install
npm run dev          # 开发：http://localhost:3000
npm run build        # 构建
npm run start        # 生产
```

## 三、环境变量（复制 .env.example 为 .env.local）

| 变量 | 说明 |
|---|---|
| `OCR_PROVIDER` | `demo`（内置模拟识别，无需密钥）/ `aws`（接入 AWS Textract） |
| `AWS_REGION` / `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | 用 `aws` 时必填 |
| `SUBSCRIBER_KEYS` | 逗号分隔的已订阅密钥，demo 用；生产接入支付服务 |

## 四、已验证的端到端流程（2026-09 实测）

1. **OCR 识别** `/api/ocr`：上传文件返回 `text` + `lines` ✓
2. **流水解析** `/api/parse`：`2024-01-05 工资 12500.00 45000.00` → 收入 12500.00、余额 45000.00，方向正确 ✓
3. **订阅鉴权**：无密钥导出返回 403 `SUBSCRIPTION_REQUIRED`；有效密钥返回 200 ✓
4. **Excel 导出** `/api/export`：生成合法 `.xlsx`，表头 + 数据行，金额格式化 ✓

## 五、当前边界与后续建议

- **OCR 为 demo/aws 适配**：demo 模式按 UTF-8 文本分行，真实 PDF 需切到 aws 或接入其他 OCR；生产务必用真实识别服务并做数据即用即删。
- **解析为规则引擎**：覆盖「日期 摘要 金额 余额」常见版式；复杂银行版式需补充 LayoutTemplate。
- **订阅为密钥模拟**：生产需接入 Stripe 等支付，并把鉴权改为服务端会话/订阅状态。
- **后续路线**：SEO 落地页扩充 → 付费订阅 → 云会计导出 → 多币种换算（见 PRD 非目标）。
