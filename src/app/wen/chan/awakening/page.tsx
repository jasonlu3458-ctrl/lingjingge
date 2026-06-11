import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

export const metadata = {
  title: '觉醒日记 · 灵境阁',
  description: '每日觉醒引导，记录灵性成长的瞬间。',
};

/**
 * 觉醒日记页面 - 使用 PageRenderer 组件
 *
 * 这是使用 PageRenderer 组件的示例页面
 * 所有配置都集中在 src/config/pageConfigs.ts 中管理
 */
export default async function AwakeningPage() {
  const userRole = await getUserRole();

  return <PageRenderer configKey="awakening" userRole={userRole} />;
}