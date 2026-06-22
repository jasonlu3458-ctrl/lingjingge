'use client';

import ReportTTSButton from './ReportTTSButton';
import ExportPDFButton from './ExportPDFButton';

/** TTS 按钮接受的主题色 */
type TTSTone = 'amber' | 'rose' | 'emerald' | 'violet' | 'indigo' | 'sky' | 'teal';
/** PDF 按钮接受的主题色（受 ExportPDFButton 限制） */
type PDFTone = 'amber' | 'rose' | 'purple' | 'emerald' | 'gray';

/**
 * 把上层传入的「统一主题色」映射到 PDF 按钮实际接受的主题色。
 * PDF 不支持 indigo / violet / sky / teal，所以做最近邻映射：
 *   - violet → purple
 *   - indigo → gray
 *   - sky    → sky (PDF 不支持 → gray)
 *   - teal   → emerald
 */
const PDF_TONE_MAP: Record<TTSTone, PDFTone> = {
  amber: 'amber',
  rose: 'rose',
  emerald: 'emerald',
  violet: 'purple',
  indigo: 'gray',
  sky: 'gray',
  teal: 'emerald',
};

export interface ReportActionBarProps {
  /** PDF / TTS 抓取的目标 DOM id */
  targetId: string;
  /** 朗读按钮标题（TTS 语音前缀展示） */
  ttsTitle: string;
  /** 朗读按钮主题色 */
  ttsTone?: TTSTone;
  /** TTS 朗读时附加的固定开头 */
  ttsPrefix?: string;
  /** 导出 PDF 文件名 */
  pdfFilename: string;
  /** PDF 按钮主题色（接受上层统一调色板，会自动映射到 PDF 支持的颜色） */
  pdfTone?: TTSTone;
  /** 自定义 PDF 按钮文案 */
  pdfLabel?: string;
  /** 顶部外间距，默认 mt-6 */
  className?: string;
}

/**
 * 全站统一的报告底部操作栏
 *
 * - 桌面端：横向排列，gap-4 居中
 * - 移动端：纵向排列，自适应间距，不会重叠
 * - 所有「内观」类报告页都使用此组件
 */
export default function ReportActionBar({
  targetId,
  ttsTitle,
  ttsTone = 'amber',
  ttsPrefix,
  pdfFilename,
  pdfTone = 'amber',
  pdfLabel,
  className = 'mt-6',
}: ReportActionBarProps) {
  return (
    <div
      className={`${className} flex flex-col sm:flex-row sm:gap-4 sm:justify-center items-stretch sm:items-center gap-3`}
    >
      <ReportTTSButton
        targetId={targetId}
        title={ttsTitle}
        tone={ttsTone}
        prefix={ttsPrefix}
        className="w-full sm:w-auto"
      />
      <ExportPDFButton
        targetId={targetId}
        filename={pdfFilename}
        tone={PDF_TONE_MAP[pdfTone]}
        label={pdfLabel}
        className="w-full sm:w-auto"
      />
    </div>
  );
}
