import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

export const metadata = {
  title: 'AI 取名轩 · 灵境阁',
  description: '结合生辰与寓意，为你推荐雅致好名。',
};

/**
 * AI取名轩页面 - 使用 PageRenderer 组件
 *
 * 这是使用 PageRenderer 组件的示例页面
 * 所有配置都集中在 src/config/pageConfigs.ts 中管理
 */
export default async function NamePage() {
  const userRole = await getUserRole();

  return <PageRenderer configKey="name" userRole={userRole} />;
}