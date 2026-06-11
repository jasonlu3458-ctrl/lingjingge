import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

export const metadata = {
  title: '身心疗愈 · 灵境阁',
  description: '针对不同情境的疗愈处方，重获身心平衡。',
};

/**
 * 身心疗愈页面 - 使用 PageRenderer 组件
 *
 * 这是使用 PageRenderer 组件的示例页面
 * 所有配置都集中在 src/config/pageConfigs.ts 中管理
 */
export default async function HealingPage() {
  const userRole = await getUserRole();

  return <PageRenderer configKey="healing" userRole={userRole} />;
}