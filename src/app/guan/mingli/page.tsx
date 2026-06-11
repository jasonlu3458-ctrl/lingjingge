import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

export const metadata = {
  title: 'AI 生命密码 · 灵境阁',
  description: '解读生辰背后的性格、天赋与人生轨迹。',
};

/**
 * AI生命密码页面 - 使用 PageRenderer 组件
 *
 * 这是使用 PageRenderer 组件的示例页面
 * 所有配置都集中在 src/config/pageConfigs.ts 中管理
 */
export default async function MingliPage() {
  const userRole = await getUserRole();

  return <PageRenderer configKey="mingli" userRole={userRole} />;
}