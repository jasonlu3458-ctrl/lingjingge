/**
 * 婚姻家庭规则引擎 · 烟测
 * 用 3 组典型输入验证：分数、年支、日干、神煞、流年 / 婚期 / 风水是否齐全
 */
import { checkMarriageRules } from '../src/lib/marriage-rules';

interface Case { title: string; self: any; partner: any; painPoints?: any[]; relationshipStatus?: any }

const cases: Case[] = [
  {
    title: '案例 1: 女 1990-05-12 巳时 阳历 × 男 1988-11-03 申时 阳历',
    self: { name: '小芳', gender: 'female', birthDate: '1990-05-12', birthHour: 9, calendarType: 'solar' },
    partner: { name: '大伟', gender: 'male', birthDate: '1988-11-03', birthHour: 15, calendarType: 'solar' },
    painPoints: ['inlaws', 'children'],
    relationshipStatus: 'dating',
  },
  {
    title: '案例 2: 女 1985-08-22 卯时 农历 × 男 1986-02-14 戌时 阳历',
    self: { name: '王姐', gender: 'female', birthDate: '1985-08-22', birthHour: 5, calendarType: 'lunar' },
    partner: { name: '李哥', gender: 'male', birthDate: '1986-02-14', birthHour: 19, calendarType: 'solar' },
    painPoints: ['wealth', 'personality'],
    relationshipStatus: 'long-marriage',
  },
  {
    title: '案例 3: 时间不详',
    self: { name: 'A', gender: 'female', birthDate: '1992-01-01', birthHour: 12, calendarType: 'solar' },
    partner: { name: 'B', gender: 'male', birthDate: '1993-01-01', birthHour: 12, calendarType: 'solar' },
    painPoints: ['private'],
    relationshipStatus: 'crisis',
  },
];

for (const c of cases) {
  console.log('\n========================================');
  console.log('📋', c.title);
  console.log('========================================');
  try {
    const r = checkMarriageRules({
      self: c.self,
      partner: c.partner,
      painPoints: c.painPoints || [],
      relationshipStatus: c.relationshipStatus || 'dating',
    });
    const compat = r.compatibility!;
    const pb = r.partnerBazi!;
    console.log(`  场景: ${r.personCount}`);
    console.log(`  分数: ${compat.score} (${compat.level})`);
    console.log(`  我:   ${r.selfBazi.yearGanzhi} ${r.selfBazi.monthGanzhi} ${r.selfBazi.dayGanzhi} (${r.selfBazi.yearZodiac}, ${r.selfBazi.fiveElement})`);
    console.log(`  TA:   ${pb.yearGanzhi} ${pb.monthGanzhi} ${pb.dayGanzhi} (${pb.yearZodiac}, ${pb.fiveElement})`);
    console.log(`  年支: ${compat.yearBranch.relation} - ${compat.yearBranch.detail}`);
    console.log(`  日干: ${compat.dayStem.relation} - ${compat.dayStem.detail}`);
    console.log(`  日支: ${compat.dayBranch.relation} - ${compat.dayBranch.detail}`);
    console.log(`  神煞: ${compat.shenSha.items.join('、') || '无'} (${compat.shenSha.description})`);
    console.log(`  流年: ${r.paid.yearlyFortune.years.length} 年`);
    console.log(`  婚期: ${r.paid.weddingTiming.bestYear}年 ${r.paid.weddingTiming.bestMonth}`);
    console.log(`  风水: ${r.paid.fengShui.title} (${r.paid.fengShui.bedroom.slice(0, 30)}...)`);
    console.log(`  评分明细:`, JSON.stringify(compat.scoreBreakdown));
    console.log('  ✓ 完整报告生成成功');
  } catch (e: any) {
    console.error('  ✗ 失败:', e.message);
    process.exitCode = 1;
  }
}
