import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

export const metadata = {
  title: 'AI 亲子导师 · 灵境阁',
  description: '育儿方案，陪伴父母共同成长。',
};

/**
 * AI亲子导师页面 - 使用 PageRenderer 组件
 *
 * 这是使用 PageRenderer 组件的示例页面
 * 所有配置都集中在 src/config/pageConfigs.ts 中管理
 */
export default async function ParentingPage() {
  const userRole = await getUserRole();

  return <PageRenderer configKey="parenting" userRole={userRole} />;
}
export const dynamic = 'force-dynamic';
