import { getUserRole } from '@/lib/auth';
import TiliClient from './TiliClient';

export const metadata = {
  title: 'AI 炼体师 · 灵境阁',
  description: '体质测评 + 定制炼体方案，动静相宜、身心同调。',
};

/**
 * AI炼体师页面
 *
 * 流程：
 * 1. 首次进入自动弹出"中医体质测评"（9 道专业题）
 * 2. 用户完成测评 → 自动判断体质 → 填入表单
 * 3. 用户填写年龄/症状 → 提交 → 调用 DIFY 生成个性化炼体方案
 *
 * 体验优化：
 * - localStorage 记录已测评状态，避免每次刷新都弹窗
 * - 模态框支持 ESC 键关闭
 * - 测评过程可视化进度条
 * - 结果页显示各体质得分对比
 */
export default async function TiliPage() {
  const userRole = await getUserRole();

  return <TiliClient userRole={userRole} />;
}
