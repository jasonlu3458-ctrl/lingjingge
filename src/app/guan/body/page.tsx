import { getUserRole } from '@/lib/auth';
import BodyPageClient from './BodyPageClient';

export const metadata = {
  title: '身心合一 · 动静兼修 · 灵境阁',
  description: '静以养气，动以炼形，内外兼修。',
};

export default async function BodyPage() {
  const userRole = await getUserRole();
  return <BodyPageClient userRole={userRole} />;
}

export const dynamic = 'force-dynamic';
