// ============================================
// Polar 产品 ID 常量
// ============================================
// 真实 ID（来自 Polar dashboard），请勿修改。
// 如需切换到环境变量集中管理，把字面量改为
// `process.env.POLAR_*_PRODUCT_ID!` 即可。
// ============================================

export const POLAR_PRODUCT_IDS = {
  /** 报告解锁 · 9.9 元 / 单次 */
  single: 'prod_2d866cc3-6693-4b3f-b796-9769759c82dc',
  /** 行者会员 · 59 元 / 月付 */
  monthly: 'prod_06ff530c-4e3e-42d5-a26b-85fe69269d44',
  /** 真人会员 · 599 元 / 年付 */
  yearly: 'prod_4e135623-da53-4514-879c-d7dfd1f7c66d',
} as const;

export type PolarPlan = keyof typeof POLAR_PRODUCT_IDS;

export function getPolarProductId(plan: string): string | null {
  if (plan === 'single' || plan === 'monthly' || plan === 'yearly') {
    return POLAR_PRODUCT_IDS[plan];
  }
  return null;
}
