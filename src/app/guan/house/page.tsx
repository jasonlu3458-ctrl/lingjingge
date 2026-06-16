import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

export const metadata = {
  title: 'AI 家居环境 · 灵境阁',
  description: '住的舒服，是最好的风水。家，是身心的容器。',
};

export default async function HousePage() {
  const userRole = await getUserRole();
  return <PageRenderer configKey="house" userRole={userRole} />;
}
