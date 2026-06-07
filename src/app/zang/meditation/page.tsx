import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

/**
 * 正念冥想页面 - 使用 PageRenderer 组件
 * 
 * 这是使用 PageRenderer 组件的示例页面
 * 所有配置都集中在 src/config/pageConfigs.ts 中管理
 */
export default async function MeditationPage() {
  const userRole = await getUserRole();
  
  return <PageRenderer configKey="meditation" userRole={userRole} />;
}
