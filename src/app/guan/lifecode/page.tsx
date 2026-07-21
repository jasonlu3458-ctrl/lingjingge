import { getUserRole } from '@/lib/auth';
import LifeCodePageClient from './LifeCodePageClient';

export const metadata = {
  title: 'AI 生命密码 · 天赋觉醒 · 灵境阁',
  description: '知命，是为了更好地活出自己。你不必向命运妥协，只需看懂命运的剧本。',
};

export default async function LifeCodePage() {
  const userRole = await getUserRole();
  return <LifeCodePageClient userRole={userRole} />;
}

export const dynamic = 'force-dynamic';
