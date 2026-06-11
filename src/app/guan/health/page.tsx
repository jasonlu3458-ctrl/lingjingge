import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

export const metadata = {
  title: 'AI 体质观察 · 灵境阁',
  description: '中医体质分析报告，了解身体现状。',
};

/**
 * AI体质观察页面 - 使用 PageRenderer 组件
 *
 * 这是使用 PageRenderer 组件的示例页面
 * 所有配置都集中在 src/config/pageConfigs.ts 中管理
 */
export default async function HealthPage() {
  const userRole = await getUserRole();

  return <PageRenderer configKey="health" userRole={userRole} />;
}