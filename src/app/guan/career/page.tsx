import { getUserRole } from '@/lib/auth';
import CareerPageClient from './CareerPageClient';

export const metadata = {
  title: 'AI 事业财富 · 灵境阁',
  description: '看清大势，顺势而为。事业是天赋与世界相遇的方式。',
};

export default async function CareerPage() {
  const userRole = await getUserRole();
  return <CareerPageClient userRole={userRole} />;
}

export const dynamic = 'force-dynamic';
