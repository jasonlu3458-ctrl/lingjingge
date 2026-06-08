import { NextResponse } from 'next/server';

const zenQuotes = [
  { zen: '心无挂碍，无挂碍故，无有恐怖，远离颠倒梦想。——《心经》' },
  { zen: '菩提本无树，明镜亦非台，本来无一物，何处惹尘埃。——六祖慧能' },
  { zen: '行到水穷处，坐看云起时。——王维' },
  { zen: '竹影扫阶尘不动，月穿潭底水无痕。——禅语' },
  { zen: '春有百花秋有月，夏有凉风冬有雪。——无门慧开' },
  { zen: '云在青天水在瓶。——药山惟俨' },
  { zen: '平常心是道。——马祖道一' },
  { zen: '应无所住而生其心。——《金刚经》' },
  { zen: '一切有为法，如梦幻泡影，如露亦如电，应作如是观。——《金刚经》' },
  { zen: '不是风动，不是幡动，仁者心动。——六祖慧能' },
  { zen: '山不在高，有仙则名；水不在深，有龙则灵。——刘禹锡' },
  { zen: '采菊东篱下，悠然见南山。——陶渊明' },
  { zen: '空山不见人，但闻人语响。——王维' },
  { zen: '千山鸟飞绝，万径人踪灭。——柳宗元' },
  { zen: '心若止水，波澜不惊。——禅语' },
];

export async function GET() {
  const todayIndex = new Date().getDate() % zenQuotes.length;
  const todayZen = zenQuotes[todayIndex];
  return NextResponse.json(todayZen);
}
