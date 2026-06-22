import { getUserRole } from '@/lib/auth';
import YiliClient from './YiliClient';

export const metadata = {
  title: 'AI易理师 · 灵境阁',
  description: '以易理为镜，照见当下抉择的方向。起一智慧指引，答你心中惑。',
};

export default async function YiliPage() {
  const userRole = await getUserRole();
  return <YiliClient userRole={userRole} />;
}

export const dynamic = 'force-dynamic';
