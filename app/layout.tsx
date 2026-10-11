import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '财务流水转Excel工具',
  description: '上传银行流水或账单 PDF，自动识别并转成对账友好的 Excel 表格。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
