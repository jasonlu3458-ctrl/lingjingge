import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';
import SelfHelpTools from '@/components/SelfHelpTools';

export const metadata = {
  title: 'AI 疗愈师 · 灵境阁',
  description: '用温暖对话，疗愈你的情绪。3 轮免费深度陪伴。',
};

/**
 * AI 疗愈师页面 - 三层结构
 *
 * 第一层：自助工具箱（纯免费，3 个工具入口）
 * 第二层：AI 对话（免费 5 次，由 ChatUI 处理）
 * 第三层：付费报告（由 ChatUI 内部 <ReportPaywall /> 包裹，配置见 conversationConfig.reportStructure）
 */
export default async function MindPage() {
  const userRole = await getUserRole();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 第一层：自助工具 */}
      <SelfHelpTools />

      {/* 第二层：AI 对话 + 第三层：付费报告（皆由 ChatUI 内部处理） */}
      <PageRenderer configKey="mind" userRole={userRole} />
    </div>
  );
}
