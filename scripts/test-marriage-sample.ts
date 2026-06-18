// 输出 JSON 让 UTF-8 字符不被乱码
import { checkMarriageRules } from '../src/lib/marriage-rules';

const r = checkMarriageRules({
  self: { name: '小芳', gender: 'female', birthDate: '1990-05-12', birthHour: 9, calendarType: 'solar' },
  partner: { name: '大伟', gender: 'male', birthDate: '1988-11-03', birthHour: 15, calendarType: 'solar' },
  relationshipStatus: 'dating',
  painPoints: ['inlaws', 'children'],
});

const c = r.compatibility!;
const p = r.partnerBazi!;
console.log(JSON.stringify({
  分数: c.score,
  等级: c.level,
  提示: c.levelHint,
  我: { 日柱: r.selfBazi.dayGanzhi, 五行: r.selfBazi.fiveElement, 生肖: r.selfBazi.yearZodiac },
  TA: { 日柱: p.dayGanzhi, 五行: p.fiveElement, 生肖: p.yearZodiac },
  年支关系: c.yearBranch.relation,
  日干关系: c.dayStem.relation,
  日支关系: c.dayBranch.relation,
  神煞: c.shenSha.items,
  评分明细: c.scoreBreakdown,
  最佳婚年: r.paid.weddingTiming.bestYear,
  最佳婚月: r.paid.weddingTiming.bestMonth,
  婚年理由: r.paid.weddingTiming.reason,
  流年数: r.paid.yearlyFortune.years.length,
  风水标题: r.paid.fengShui.title,
  场景: r.personCount,
}, null, 2));
