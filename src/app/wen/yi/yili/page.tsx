import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

/**
 * AI易理师页面 - 使用 PageRenderer 组件
 * 
 * 这是使用 PageRenderer 组件的示例页面
 * 所有配置都集中在 src/config/pageConfigs.ts 中管理
 */
export default async function YiliPage() {
  const userRole = await getUserRole();
  
  return <PageRenderer configKey="yili" userRole={userRole} />;
}