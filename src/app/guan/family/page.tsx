import { getUserRole } from '@/lib/auth';
import PageRenderer from '@/components/PageRenderer';

export const metadata = {
  title: 'AI 婚姻家庭 · 灵境阁',
  description: '解结化怨，重建亲密。看清关系里那些没说出口的话。',
};

export default async function FamilyPage() {
  const userRole = await getUserRole();
  return <PageRenderer configKey="family" userRole={userRole} />;
}

export const dynamic = 'force-dynamic';
