import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '财务流水转Excel工具 - PDF/银行流水一键转表格',
  description:
    '上传银行流水或账单 PDF，自动识别并转成对账友好的 Excel 表格。多格式支持、OCR 识别、可预览纠错，省时又准确。',
};

export default function HomePage() {
  return (
    <main style={styles.wrap}>
      <h1 style={styles.h1}>财务 PDF / 银行流水 → Excel，一键完成</h1>
      <p style={styles.lead}>
        上传多页流水 PDF，自动识别、解析并生成对账友好的 Excel 表格，全程无需注册即可体验。
      </p>

      <div style={styles.card}>
        <h2 style={styles.h2}>立即转换</h2>
        <FlowStepNav />
      </div>

      <section style={styles.faq}>
        <h2 style={styles.h2}>常见问题</h2>
        <ul style={styles.ul}>
          <li><b>支持哪些格式？</b> 支持多页银行流水、账单 PDF，自动解析日期、摘要、收入、支出与余额。</li>
          <li><b>数据安全吗？</b> 文件仅用于本次转换，处理完成后即删除，不长期保存。</li>
          <li><b>怎么收费？</b> 上传、识别、预览免费；导出 Excel 需订阅。</li>
        </ul>
      </section>
    </main>
  );
}

// 简单流程引导（占位，主交互在 /convert 页面）
function FlowStepNav() {
  return (
    <p style={styles.link}>
      前往 <Link href="/convert" style={styles.a}>转换工作台 →</Link>
    </p>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 760,
    margin: '0 auto',
    padding: '48px 20px',
    fontFamily: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    color: '#1f2329',
  },
  h1: { fontSize: 28, lineHeight: 1.3, marginBottom: 12 },
  lead: { fontSize: 16, color: '#646a73', marginBottom: 28, lineHeight: 1.6 },
  card: {
    background: '#f7f8fa',
    border: '1px solid #dee0e3',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  h2: { fontSize: 18, marginBottom: 12 },
  link: { fontSize: 15 },
  a: { color: '#3370ff', textDecoration: 'none', fontWeight: 600 },
  faq: { fontSize: 14 },
  ul: { paddingLeft: 20, lineHeight: 1.8 },
};
