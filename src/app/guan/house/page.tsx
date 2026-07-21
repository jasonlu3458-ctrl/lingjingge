import { getUserRole } from '@/lib/auth';
import HousePageClient from './HousePageClient';

export const metadata = {
  title: '家居环境 · 空间能量 · 灵境阁',
  description: '宅安则心安。好的空间布局，是家庭和睦与个人能量节奏的稳定器。',
};

export default async function HousePage() {
  const userRole = await getUserRole();
  return <HousePageClient userRole={userRole} />;
}

export const dynamic = 'force-dynamic';
