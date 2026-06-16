import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

export const metadata = {
  title: 'AI 轻解忧 · 灵境阁',
  description: '说一句你现在的烦恼，让 AI 陪你理一理。3 轮免费陪伴。',
};

/**
 * AI 轻解忧页面 - 纯对话 + 报告付费墙
 *
 * 内部由 ChatUI 完成：
 *  - 纯对话模式（无 formConfig）
 *  - conversationConfig.reportStructure 提供 free / premium 报告内容
 *  - ChatUI 在 assistant 消息渲染时自动调用 <ReportPaywall />
 */
export default async function LightSolutionPage() {
  const userRole = await getUserRole();

  return <PageRenderer configKey="light-solution" userRole={userRole} />;
}
