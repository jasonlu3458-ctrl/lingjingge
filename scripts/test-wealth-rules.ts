// 烟测脚本：直接调 checkWealthRules
import { checkWealthRules } from '../src/lib/wealth-rules';

const cases = [
  {
    name: '张三',
    input: { name: '张三', gender: 'male' as const, birthDate: '1990-01-15', birthHour: 10, calendarType: 'solar' as const, career: '互联网' as const },
  },
  {
    name: '李四',
    input: { name: '李四', gender: 'female' as const, birthDate: '1988-07-20', birthHour: 14, calendarType: 'solar' as const, career: '金融' as const },
  },
  {
    name: '王五',
    input: { name: '王五', gender: 'male' as const, birthDate: '1985-11-08', birthHour: 8, calendarType: 'solar' as const, career: '制造' as const },
  },
  {
    name: '赵六',
    input: { name: '赵六', gender: 'female' as const, birthDate: '1992-04-03', birthHour: 18, calendarType: 'lunar' as const, career: '教育' as const },
  },
];

for (const c of cases) {
  console.log('\n========================================');
  console.log('💎', c.name);
  console.log('========================================');
  try {
    const r = checkWealthRules(c.input);
    console.log(`  八字: ${r.bazi.yearGanzhi} ${r.bazi.monthGanzhi} ${r.bazi.dayGanzhi} (${r.bazi.yearZodiac}, 日干 ${r.bazi.dayStem} 属${r.bazi.dayElement})`);
    console.log(`  财星: ${r.wealthSource.element} (天干 ${r.wealthSource.wealthStem})`);
    console.log(`  方位: ${r.wealthSource.direction}`);
    console.log(`  行业: ${r.wealthSource.industries}`);
    console.log(`  谋财: ${r.careerType.type} → ${r.careerType.workMode}`);
    console.log(`  职业匹配: ${r.career.match} - ${r.career.matchLabel}`);
    console.log(`  季节: ${r.timing.season.label} (${r.timing.season.range})`);
    console.log(`  相位: ${r.timing.phase} - ${r.timing.tone}`);
    console.log(`  最佳窗口: ${r.timing.bestSeason} | ${r.timing.bestYear} 年`);
    console.log(`  评分: ${r.score} / 100`);
    console.log(`  免费版块: ${Object.keys(r.free).length} 项 / 付费版块: ${Object.keys(r.paid).length} 项`);
    console.log('  ✓ 报告生成成功');
  } catch (e: any) {
    console.error('  ✗ 失败:', e.message);
    process.exitCode = 1;
  }
}
