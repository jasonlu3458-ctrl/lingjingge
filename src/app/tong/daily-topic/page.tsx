import Link from 'next/link';
import DailyTopicClient from './DailyTopicClient';

export const metadata = {
  title: '每日话题 · 灵境阁',
  description: '今天的话头、当下的一念。',
};

interface Quote {
  text: string;
  source: string;
  category: '禅宗' | '道家' | '儒家' | '佛家' | '心学';
  reflection: string; // 今日参究
}

const QUOTES: Quote[] = [
  {
    text: '不审不思即般若。',
    source: '禅宗话头',
    category: '禅宗',
    reflection: '当下这一刻，不起评判、不生分别。看那"看"本身，不就是般若吗？',
  },
  {
    text: '道可道，非常道；名可名，非常名。',
    source: '《道德经·第一章》',
    category: '道家',
    reflection: '我们说出的"道"，已经不是道本身了。你能指认那不可指认的本身吗？',
  },
  {
    text: '我日三省吾身：为人谋而不忠乎？与朋友交而不信乎？传不习乎？',
    source: '《论语·学而》',
    category: '儒家',
    reflection: '三件小事，三面镜子。今日的你，三面如何？',
  },
  {
    text: '应无所住而生其心。',
    source: '《金刚经》',
    category: '佛家',
    reflection: '心无所住时，念头来去如风。心能驻于何处，又如何驻？',
  },
  {
    text: '未发之中，是心之本体。',
    source: '《传习录》',
    category: '心学',
    reflection: '情绪未起、思虑未动时，那一片清明是什么？',
  },
  {
    text: '佛在灵山莫远求，灵山只在汝心头。',
    source: '禅宗偈',
    category: '禅宗',
    reflection: '向外求佛时，回头即是。你要去的灵山，此刻在哪里？',
  },
  {
    text: '上善若水。水善利万物而不争。',
    source: '《道德经·第八章》',
    category: '道家',
    reflection: '不争、处下、利万物——水从不喊口号。今日你可曾柔软下来？',
  },
  {
    text: '知止而后有定，定而后能静。',
    source: '《大学》',
    category: '儒家',
    reflection: '止是定的前提。今日你止于何处？',
  },
  {
    text: '色即是空，空即是色。',
    source: '《心经》',
    category: '佛家',
    reflection: '看见的都不是"实有"，但这"空"也不是断灭。如何既不执有又不入空？',
  },
  {
    text: '无善无恶心之体，有善有恶意之动。',
    source: '《传习录》',
    category: '心学',
    reflection: '心体本无善恶，意动则善恶立。你此刻起念，是哪一种？',
  },
  {
    text: '心生种种法生，心灭种种法灭。',
    source: '《大乘起信论》',
    category: '佛家',
    reflection: '法由心造，相随心转。今日你所见的"世界"，是哪一颗心在投射？',
  },
  {
    text: '为学日益，为道日损。损之又损，以至于无为。',
    source: '《道德经·第四十八章》',
    category: '道家',
    reflection: '学是加法，道是减法。今天你打算"减"掉什么？',
  },
  {
    text: '格物致知，诚意正心。',
    source: '《大学》',
    category: '儒家',
    reflection: '格一物就是致一知。今日格什么？',
  },
  {
    text: '不怕念起，只怕觉迟。',
    source: '禅宗语',
    category: '禅宗',
    reflection: '念头会起，不必怕；要怕的是"看到念头时"太晚。今日你迟了几次？',
  },
];

function getTodayKey(): string {
  // 北京时间 YYYY-MM-DD
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60_000;
  const bj = new Date(utc + 8 * 60 * 60_000);
  return bj.toISOString().slice(0, 10);
}

function pickQuote(date: string): Quote {
  // 简单稳定哈希 → 取模
  let h = 0;
  for (let i = 0; i < date.length; i++) {
    h = (h * 31 + date.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % QUOTES.length;
  return QUOTES[idx];
}

export default function DailyTopicPage() {
  const today = getTodayKey();
  const quote = pickQuote(today);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <Link href="/tong" className="text-xs text-gray-400 hover:text-gray-600">
          ← 返回同修
        </Link>
      </div>

      <div className="text-center mb-6">
        <div className="text-amber-700 text-sm tracking-widest mb-2">☀︎ 今日参究</div>
        <h1
          className="text-3xl text-[#2c2c2c] mb-1"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          {today}
        </h1>
        <div className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          {quote.category}
        </div>
      </div>

      <article className="bg-gradient-to-br from-amber-50 via-white to-orange-50 rounded-3xl p-8 sm:p-12 border border-amber-100 shadow-sm">
        <blockquote
          className="text-2xl sm:text-3xl leading-relaxed text-[#2c2c2c] text-center mb-6"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          「{quote.text}」
        </blockquote>
        <div className="text-center text-sm text-amber-700 mb-8">— {quote.source}</div>

        <div className="border-t border-amber-200 pt-6">
          <div className="text-xs text-gray-500 mb-2 tracking-widest">今日参究</div>
          <p className="text-base leading-loose text-gray-700">{quote.reflection}</p>
        </div>
      </article>

      <DailyTopicClient quoteText={quote.text} today={today} />

      <div className="mt-8 text-center">
        <p className="text-xs text-gray-400">— 明日话头，更新 —</p>
      </div>
    </div>
  );
}
