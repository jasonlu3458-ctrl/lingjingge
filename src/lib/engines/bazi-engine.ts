// ============================================================
// bazi-engine.ts —— 跨租户共享的八字排盘引擎（统一入口）
// ------------------------------------------------------------
// 这是灵境阁主站 (/api/lifecode) 与牧心堂 (/muxintang/api/bazi)
// 的统一计算入口。本文件本身**不实现任何业务逻辑**，只做：
//   1) 重新导出两侧已稳定的工具函数
//   2) 暴露纯计算函数 calculateBasicBazi 给未来新租户
//   3) 统一类型契约
//
// 上层业务逻辑（人格解读 / 唐密本尊 / 合婚打分）由调用方自行处理。
// ============================================================

import { Solar } from 'lunar-javascript';
import { STEM_TO_ELEMENT, BRANCH_TO_ELEMENT, ELEMENT_COLOR } from './bazi-core';

// ---------- 重新导出：让主站与牧心堂共享底层数据 ----------
export { STEM_TO_ELEMENT, BRANCH_TO_ELEMENT, ELEMENT_COLOR };

// ---------- 统一基础类型 ----------
export interface BasicBaziInput {
  year: number;
  month: number;
  day: number;
  hour: number;
}

export interface BasicBaziResult {
  yearPillar: string;
  monthPillar: string;
  dayPillar: string;
  hourPillar: string;
  dayMaster: string;          // 日干（如 '甲'）
  dayMasterElement: '木' | '火' | '土' | '金' | '水';
  lunarDate: string;
  zodiac: string;             // 生肖
}

/**
 * 纯计算：从公历日期算出四柱 + 日主 + 五行
 * 不包含任何人格/合婚/流年解读，调用方按需扩展。
 */
export function calculateBasicBazi(input: BasicBaziInput): BasicBaziResult {
  const { year, month, day, hour } = input;
  const solar = Solar.fromYmd(year, month, day);
  const lunar: any = solar.getLunar();

  const charAt = (str: string, idx: number): string => Array.from(str)[idx] ?? '';

  const yearPillar = lunar.getYearInGanZhi();
  const monthPillar = lunar.getMonthInGanZhi();
  const dayPillar = lunar.getDayInGanZhi();
  const hourPillar = (lunar as { getTimeInGanZhi(h: number): string }).getTimeInGanZhi(hour);

  const dayMaster = charAt(dayPillar, 0);
  const dayMasterElement = STEM_TO_ELEMENT[dayMaster] ?? '木';

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar,
    dayMaster,
    dayMasterElement,
    lunarDate: `${(lunar as { getYearInChinese(): string }).getYearInChinese()}年 ${(lunar as { getMonthInChinese(): string }).getMonthInChinese()}月 ${(lunar as { getDayInChinese(): string }).getDayInChinese()}`,
    zodiac: (lunar as { getYearShengXiao(): string }).getYearShengXiao(),
  };
}
