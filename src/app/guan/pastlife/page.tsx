import { getUserRole } from '@/lib/auth';
import PastLifeClient from './PastLifeClient';

export const metadata = {
  title: '照见前尘 · 灵境阁',
  description: '照见前世因缘，了悟此生课题。',
};

/**
 * 照见前尘（前世报告）页面
 *
 * 流程：
 * 1. 用户填写出生日期 / 时辰 / 性别
 * 2. 提交 → 调用 DIFY 生成前世报告
 * 3. 报告按 "PREMIUM:" 切分：免费部分公开，付费部分会员专享
 *
 * 付费墙与其他 6 份报告（mind / parenting / yili / mingli / name / tili / health）保持一致。
 */
export default async function PastLifePage() {
  const userRole = await getUserRole();

  return <PastLifeClient userRole={userRole} />;
}
