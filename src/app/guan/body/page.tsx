import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

export const metadata = {
  title: 'AI 身心合一 · 灵境阁',
  description: '炼体炼心，内外同调。整合体质、炼体、情绪、前世因缘的综合报告。',
};

/**
 * AI 身心合一 - 整合自原 AI 体质观察 / AI 炼体师 / 照见前尘
 *
 * 包含：
 *  - formConfig 收集出生日期 / 性别 / 关注方向 / 当前状态 / 想照见的前因
 *  - ChatUI + ReportPaywall 标准结构（由 PageRenderer 自动应用）
 */
export default async function BodyPage() {
  const userRole = await getUserRole();
  return <PageRenderer configKey="body" userRole={userRole} />;
}

export const dynamic = 'force-dynamic';
