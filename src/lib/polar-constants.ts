// ============================================
// Polar 产品 ID 常量
// ============================================
// 真实 ID（来自 Polar dashboard），请勿修改。
// 如需切换到环境变量集中管理，把字面量改为
// `process.env.POLAR_*_PRODUCT_ID!` 即可。
// ============================================

/**
 * 统一定价（UI 与 Polar Dashboard 必须保持一致）
 *
 *  - single  ¥9.9  单次解锁一份报告
 *  - monthly ¥29.9 月度会员（行者）
 *  - yearly  ¥299  年度会员（真人）
 *
 * ⚠️ 上述价格为全站唯一价，已与 UI 文案完全对齐，
 *    修改任何一处都必须同步修改另外两处（UI / Polar Dashboard / 本文件）。
 */
export const POLAR_PRODUCT_IDS = {
  /** 报告解锁 · 9.9 元 / 单次 */
  single: 'prod_2d866cc3-6693-4b3f-b796-9769759c82dc',
  /** 行者会员 · 29.9 元 / 月付 */
  monthly: 'prod_06ff530c-4e3e-42d5-a26b-85fe69269d44',
  /** 真人会员 · 299 元 / 年付 */
  yearly: 'prod_4e135623-da53-4514-879c-d7dfd1f7c66d',
} as const;

export type PolarPlan = keyof typeof POLAR_PRODUCT_IDS;

export function getPolarProductId(plan: string): string | null {
  if (plan === 'single' || plan === 'monthly' || plan === 'yearly') {
    return POLAR_PRODUCT_IDS[plan];
  }
  return null;
}
