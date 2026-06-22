import { getUserRole } from '@/lib/auth';
import MeditationPageClient from './MeditationPageClient';

/**
 * 正念冥想页面
 *
 * 不再走 PageRenderer / ChatUI（这些是"对答"形态，不适合冥想）。
 * 改用自包含的 MeditationPageClient：选静功方案 → TTS 引导词 + 倒计时 → 完成埋点。
 */
export default async function MeditationPage() {
  const userRole = await getUserRole();
  // userRole 留作未来鉴权使用（仅会员解锁长方案）
  void userRole;
  return <MeditationPageClient />;
}

export const dynamic = 'force-dynamic';
