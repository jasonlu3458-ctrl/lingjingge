import { getUserRole } from '@/lib/auth';
import LightSolutionClient from './LightSolutionClient';

export const metadata = {
  title: '解忧师 · 灵境阁',
  description: '说一句你现在的烦恼，让 AI 陪你理一理。3 轮免费陪伴。',
};

/**
 * AI 解忧师页面 - 沉浸式对话流
 *
 * 内部由 LightSolutionClient 完成：
 *  - 顶部：标题 + 副标题 + AI 开场白
 *  - 中部：可滚动的消息流（初始化包含 1 条 AI 欢迎气泡 + 3 个快捷倾诉按钮）
 *  - 底部：sticky 输入区，含免费次数提示
 *  - 3 轮对话后自动生成报告并展示 ReportPaywall
 */
export default async function LightSolutionPage() {
  const userRole = await getUserRole();

  return <LightSolutionClient userRole={userRole} />;
}

export const dynamic = 'force-dynamic';
