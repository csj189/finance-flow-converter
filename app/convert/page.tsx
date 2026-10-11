'use client';

import { useCallback, useRef, useState } from 'react';
import type { OcrResult, ParseResult, TransactionRow } from '@/lib/types';

type Stage = 'idle' | 'uploading' | 'parsing' | 'preview' | 'error';

export default function ConvertPage() {
  const [stage, setStage] = useState<Stage>('idle');
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState('');
  const [subscriberKey, setSubscriberKey] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError('');
    setMessage('');
    setFileName(file.name);

    // 1) 上传并 OCR
    setStage('uploading');
    let ocr: OcrResult;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/ocr', { method: 'POST', body: fd });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || '识别失败');
      ocr = j.data;
    } catch (e) {
      setStage('error');
      setError(e instanceof Error ? e.message : '识别失败，请重试');
      return;
    }

    // 2) 解析
    setStage('parsing');
    let parsed: ParseResult;
    try {
      const r = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines: ocr.lines }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || '解析失败');
      parsed = j.data;
    } catch (e) {
      setStage('error');
      setError(e instanceof Error ? e.message : '解析失败，请重试');
      return;
    }

    setRows(parsed.rows);
    setWarnings(parsed.warnings);
    setStage('preview');
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  // 单行字段编辑
  const editRow = useCallback(
    (id: string, field: keyof TransactionRow, value: string) => {
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, [field]: value, edited: true } : r
        )
      );
    },
    []
  );

  const clearFlag = useCallback((id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, flagged: false } : r)));
  }, []);

  // 导出（需要订阅）
  const handleExport = useCallback(async () => {
    setError('');
    setMessage('');
    if (!subscribed) {
      setMessage('导出功能需要订阅，请先开通（输入订阅密钥）。');
      return;
    }
    try {
      const r = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-subscriber-key': subscriberKey,
        },
        body: JSON.stringify({ rows }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => null);
        if (j?.code === 'SUBSCRIPTION_REQUIRED') {
          setSubscribed(false);
          setMessage('订阅已失效，请重新开通。');
        } else {
          setError(j?.error || '导出失败');
        }
        return;
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'flow_transactions.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      setMessage('导出成功，请检查下载文件。');
    } catch (e) {
      setError(e instanceof Error ? e.message : '导出失败');
    }
  }, [rows, subscribed, subscriberKey]);

  const activate = useCallback(async () => {
    setError('');
    setMessage('');
    try {
      const r = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: subscriberKey }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || '订阅失败');
      setSubscribed(true);
      setMessage('订阅开通成功，可以导出了。');
    } catch (e) {
      setError(e instanceof Error ? e.message : '订阅失败');
    }
  }, [subscriberKey]);

  return (
    <main style={styles.wrap}>
      <h1 style={styles.h1}>转换工作台</h1>

      {/* 上传区 */}
      <div
        style={styles.drop}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <p style={styles.dropText}>拖拽 PDF 到此处，或点击选择文件</p>
        <p style={styles.dropSub}>支持多页银行流水 / 账单 PDF，≤20MB</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>

      {fileName && <p style={styles.fileName}>已选择：{fileName}</p>}
      {stage === 'uploading' && <p style={styles.status}>正在识别文件…</p>}
      {stage === 'parsing' && <p style={styles.status}>正在解析流水…</p>}
      {error && <p style={styles.error}>{error}</p>}

      {/* 预览纠错 */}
      {stage === 'preview' && (
        <section style={styles.section}>
          <h2 style={styles.h2}>识别结果预览（可编辑）</h2>
          {warnings.length > 0 && (
            <p style={styles.warn}>提示：{warnings.join('；')}</p>
          )}

          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>日期</th>
                <th style={styles.th}>摘要</th>
                <th style={styles.th}>收入</th>
                <th style={styles.th}>支出</th>
                <th style={styles.th}>余额</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={r.flagged ? styles.rowFlag : undefined}>
                  <td style={styles.td}>
                    <input
                      style={styles.inp}
                      value={r.date}
                      onChange={(e) => editRow(r.id, 'date', e.target.value)}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      style={styles.inp}
                      value={r.summary}
                      onChange={(e) => editRow(r.id, 'summary', e.target.value)}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      style={styles.inp}
                      value={r.income}
                      onChange={(e) => editRow(r.id, 'income', e.target.value)}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      style={styles.inp}
                      value={r.expense}
                      onChange={(e) => editRow(r.id, 'expense', e.target.value)}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      style={styles.inp}
                      value={r.balance}
                      onChange={(e) => editRow(r.id, 'balance', e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.some((r) => r.flagged) && (
            <button style={styles.btnGhost} onClick={() => setRows((prev) => prev.map((r) => ({ ...r, flagged: false })))}>
              清除全部待确认标记
            </button>
          )}

          {/* 订阅 + 导出 */}
          <div style={styles.exportBox}>
            <h3 style={styles.h3}>导出 Excel</h3>
            <p style={styles.status}>上传、识别、预览免费；导出需订阅。</p>
            <div style={styles.row}>
              <input
                style={styles.inp}
                placeholder="输入订阅密钥"
                value={subscriberKey}
                onChange={(e) => setSubscriberKey(e.target.value)}
              />
              <button style={styles.btn} onClick={activate}>
                开通订阅
              </button>
              <button style={styles.btnPrimary} onClick={handleExport}>
                导出 Excel
              </button>
            </div>
            {subscribed && <p style={styles.ok}>已订阅，可正常导出。</p>}
            {message && <p style={styles.ok}>{message}</p>}
          </div>
        </section>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '40px 20px',
    fontFamily: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    color: '#1f2329',
  },
  h1: { fontSize: 26, marginBottom: 20 },
  h2: { fontSize: 19, marginBottom: 12 },
  h3: { fontSize: 16, marginBottom: 8 },
  drop: {
    border: '2px dashed #c0c4cc',
    borderRadius: 12,
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    background: '#fafbfc',
  },
  dropText: { fontSize: 16, color: '#1f2329', marginBottom: 6 },
  dropSub: { fontSize: 13, color: '#86909c' },
  fileName: { fontSize: 13, color: '#646a73', marginTop: 12 },
  status: { fontSize: 13, color: '#3370ff', marginTop: 8 },
  error: { fontSize: 13, color: '#d54941', marginTop: 8 },
  warn: { fontSize: 13, color: '#cc7a00', marginBottom: 10 },
  ok: { fontSize: 13, color: '#009a5b', marginTop: 8 },
  section: { marginTop: 24 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', padding: 8, borderBottom: '1px solid #dee0e3', background: '#f2f3f5' },
  td: { padding: 4, borderBottom: '1px solid #f0f1f3' },
  rowFlag: { background: '#fff7e6' },
  inp: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '6px 8px',
    border: '1px solid #dee0e3',
    borderRadius: 6,
    fontSize: 13,
  },
  btn: {
    padding: '8px 14px',
    border: '1px solid #3370ff',
    background: '#fff',
    color: '#3370ff',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  btnPrimary: {
    padding: '8px 14px',
    border: 'none',
    background: '#3370ff',
    color: '#fff',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 13,
  },
  btnGhost: {
    marginTop: 8,
    padding: '6px 12px',
    border: '1px solid #dee0e3',
    background: '#fff',
    color: '#646a73',
    borderRadius: 6,
    cursor: 'pointer',
    fontSize: 12,
  },
  exportBox: { marginTop: 24, padding: 16, border: '1px solid #dee0e3', borderRadius: 10 },
  row: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
};
