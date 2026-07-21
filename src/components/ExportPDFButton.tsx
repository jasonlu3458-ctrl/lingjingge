'use client';

import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportPDFButtonProps {
  /**
   * 报告容器的 DOM id。组件会从 document.getElementById 找该节点并截图。
   * 必传。
   */
  targetId: string;
  /**
   * 下载文件名（不含扩展名），建议包含用户/日期以方便归档。
   * 默认 "灵境阁报告"
   */
  filename?: string;
  /**
   * 按钮文案
   */
  label?: string;
  /**
   * 额外 className
   */
  className?: string;
  /**
   * 可选：自定义主题色
   */
  tone?: 'amber' | 'rose' | 'purple' | 'emerald' | 'gray';
}

const TONE_STYLES: Record<NonNullable<ExportPDFButtonProps['tone']>, string> = {
  amber:   'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:shadow-lg',
  rose:    'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md hover:shadow-lg',
  purple:  'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md hover:shadow-lg',
  emerald: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:shadow-lg',
  gray:    'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md hover:shadow-lg',
};

/**
 * 将指定 DOM 节点导出为 A4 多页 PDF。
 *  - 用 html2canvas 截图（2x scale，关闭 logging）；
 *  - 按 A4 比例分页切片（210x297 mm ≈ 1240x1754 px @ 150dpi 渲染，2x 后等比 2480x3508）；
 *  - 写入 jsPDF，使用纵向 A4。
 */
export default function ExportPDFButton({
  targetId,
  filename = '灵境阁报告',
  label = '📄 导出为 PDF',
  className = '',
  tone = 'amber',
}: ExportPDFButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  const handleExport = async () => {
    const el = document.getElementById(targetId);
    if (!el) {
      setError(`未找到目标节点 #${targetId}`);
      return;
    }
    setError(null);
    setExporting(true);
    setProgress(0);
    cancelledRef.current = false;

    try {
      // 等待字体就绪，避免中文方块
      if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }
      // 等一帧让布局稳定
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: el.scrollWidth,
        windowHeight: el.scrollHeight,
      });

      if (cancelledRef.current) return;

      const imgData = canvas.toDataURL('image/jpeg', 0.92);

      // A4 纵向：210 x 297 mm
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();   // 210
      const pageHeight = pdf.internal.pageSize.getHeight(); // 297
      const margin = 6; // mm
      const contentW = pageWidth - margin * 2;
      const contentH = pageHeight - margin * 2;

      // 等比缩放：img 实际宽高（px）→ 全部缩到 contentW 宽
      const ratio = contentW / canvas.width;          // mm / px
      const imgHeightMm = canvas.height * ratio;       // 整张图实际 mm 高度

      // 单页能放的高度
      const pageCapacityMm = contentH;
      // 切分到若干页
      let yOffsetMm = 0;
      let pageIndex = 0;
      const totalPages = Math.max(1, Math.ceil(imgHeightMm / pageCapacityMm));
      setProgress(0.1);

      while (yOffsetMm < imgHeightMm) {
        if (cancelledRef.current) return;
        const remainingMm = imgHeightMm - yOffsetMm;
        const sliceHeightMm = Math.min(pageCapacityMm, remainingMm);
        const sliceHeightPx = sliceHeightMm / ratio;

        // 创建切片 canvas
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHeightPx;
        const ctx = sliceCanvas.getContext('2d');
        if (!ctx) throw new Error('无法创建 canvas context');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0, yOffsetMm / ratio,                // sx, sy
          canvas.width, sliceHeightPx,          // sWidth, sHeight
          0, 0,                                  // dx, dy
          canvas.width, sliceHeightPx            // dWidth, dHeight
        );
        const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92);

        if (pageIndex > 0) pdf.addPage();
        pdf.addImage(
          sliceData,
          'JPEG',
          margin,
          margin,
          contentW,
          sliceHeightMm,
          undefined,
          'FAST'
        );

        yOffsetMm += sliceHeightMm;
        pageIndex += 1;
        setProgress(0.1 + 0.85 * (pageIndex / totalPages));
      }

      setProgress(1);
      // 文件名加日期
      const today = new Date().toISOString().slice(0, 10);
      pdf.save(`${filename}-${today}.pdf`);
    } catch (e: any) {
      console.error('[ExportPDF] 失败', e);
      setError(e?.message || 'PDF 生成失败，请重试');
    } finally {
      setExporting(false);
      setTimeout(() => setProgress(0), 1500);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-150 active:scale-95 active:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed ${
          TONE_STYLES[tone]
        }`}
      >
        {exporting ? (
          <>
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            <span>生成中 {Math.round(progress * 100)}%</span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </button>
      {error && (
        <span className="text-xs text-red-600">⚠️ {error}</span>
      )}
    </div>
  );
}
