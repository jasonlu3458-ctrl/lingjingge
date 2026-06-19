import { getUserRole } from '@/lib/auth';
import WealthPageClient from './WealthPageClient';

export const metadata = {
  title: '事业智富 · 破局之道 · 灵境阁',
  description: '君子爱财，取之有道。算清格局，谋定后动 —— 一份基于先天格局的个人商业行动指南。',
};

export default async function WealthPage() {
  const userRole = await getUserRole();
  return <WealthPageClient userRole={userRole} />;
}

export const dynamic = 'force-dynamic';
