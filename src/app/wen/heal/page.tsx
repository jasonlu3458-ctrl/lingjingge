import { getUserRole } from '@/lib/auth';
import MindClient from './MindClient';

export const metadata = {
  title: 'AI 疗愈师 · 灵境阁',
  description: '沉浸式情感陪伴工作坊。3 轮免费深度对话 + 7 天情绪打卡。',
};

/**
 * AI 疗愈师（沉浸式工作坊）
 *
 * - 顶部：极简标题 + 情绪胶囊（替代原工具箱）
 * - 中部：双 AI 气泡开场白 + 沉浸式聊天区
 * - 浮动 🌿 按钮 → 半屏抽屉（呼吸/观想/动作）
 * - 右上角：今日情绪打卡（5 级表情 → Supabase）
 * - 底部：固定输入区（44px+，placeholder 改为"此刻，你在想什么？"）
 * - 5 次后：付费墙软着陆（不跳走，弹轻量引导）
 */
export default async function MindPage() {
  const userRole = await getUserRole();
  return <MindClient userRole={userRole} />;
}

export const dynamic = 'force-dynamic';
