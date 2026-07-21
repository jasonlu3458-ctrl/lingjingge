import { getUserRole } from '@/lib/auth';
import EducationPageClient from './EducationPageClient';

export const metadata = {
  title: 'AI 子女教育 · 灵境阁',
  description: '懂孩子，才能教孩子。每一个孩子，都有自己的时区。',
};

export default async function EducationPage() {
  const userRole = await getUserRole();
  return <EducationPageClient userRole={userRole} />;
}

export const dynamic = 'force-dynamic';
