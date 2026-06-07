import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

/**
 * AI疗愈师页面 - 使用 PageRenderer 组件
 * 
 * 这是使用 PageRenderer 组件的示例页面
 * 所有配置都集中在 src/config/pageConfigs.ts 中管理
 */
export default async function MindPage() {
  const userRole = await getUserRole();
  
  return <PageRenderer configKey="mind" userRole={userRole} />;
}