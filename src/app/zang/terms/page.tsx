'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

interface Term {
  id: string;
  term: string;
  pinyin: string;
  category: '禅宗' | '道家' | '佛教' | '易经' | '儒家' | '中医';
  definition: string;
}

const TERMS: Term[] = [
  // 禅宗
  { id: 't1', term: '见性', pinyin: 'jiàn xìng', category: '禅宗', definition: '禅宗术语，指彻见自心本性。即通过修行，破除妄想执着，直接体认自己本来具有的佛性。' },
  { id: 't2', term: '公案', pinyin: 'gōng àn', category: '禅宗', definition: '禅宗特有的教学方式，师父以一则简短的事例或机锋话头，启发行人参悟本性。' },
  { id: 't3', term: '机锋', pinyin: 'jī fēng', category: '禅宗', definition: '禅宗接引学人时所用的激烈言句或动作，如棒喝、竖指、举拂等。' },
  { id: 't4', term: '顿悟', pinyin: 'dùn wù', category: '禅宗', definition: '无须渐次修行，于一念之间直见本性。与"渐修"相对。' },
  { id: 't5', term: '明心', pinyin: 'míng xīn', category: '禅宗', definition: '明白自家本心，与"见性"同义，慧能《坛经》核心概念。' },
  // 道家
  { id: 't6', term: '道', pinyin: 'dào', category: '道家', definition: '道家最高范畴，是宇宙万物的本源与运行规律，不可名，不可道。' },
  { id: 't7', term: '德', pinyin: 'dé', category: '道家', definition: '道家"道"的具象化，是万物得之于道并内化于自身的本性。' },
  { id: 't8', term: '无为', pinyin: 'wú wéi', category: '道家', definition: '道家思想，顺其自然，不妄为。无为不是无所作为，而是指顺应事物的自然规律。' },
  { id: 't9', term: '虚静', pinyin: 'xū jìng', category: '道家', definition: '道家修养境界，心灵空明澄澈，不被外物所扰。' },
  { id: 't10', term: '玄', pinyin: 'xuán', category: '道家', definition: '深远不可测之意。"玄之又玄，众妙之门"——《道德经》。' },
  // 佛教
  { id: 't11', term: '无明', pinyin: 'wú míng', category: '佛教', definition: '佛教术语，指众生心中无有智慧，处于黑暗状态。无明是烦恼的根源。' },
  { id: 't12', term: '般若', pinyin: 'bō rě', category: '佛教', definition: '梵语，意为智慧，特指超越世俗的智慧。般若智慧能洞察实相、破除执着。' },
  { id: 't13', term: '菩萨', pinyin: 'pú sà', category: '佛教', definition: '菩提萨埵的简称，意译为"觉有情"，是上求佛道、下化众生的修行者。' },
  { id: 't14', term: '涅槃', pinyin: 'niè pán', category: '佛教', definition: '佛教追求的最高境界，意为灭除烦恼、超越生死轮回的寂静清凉之境。' },
  { id: 't15', term: '因果', pinyin: 'yīn guǒ', category: '佛教', definition: '佛教基本法则，"因"能生"果"，善有善报，恶有恶报。' },
  // 易经
  { id: 't16', term: '太极', pinyin: 'tài jí', category: '易经', definition: '易学概念，指宇宙万物的本源。太极生两仪，两仪生四象，四象生八卦。' },
  { id: 't17', term: '阴阳', pinyin: 'yīn yáng', category: '易经', definition: '宇宙间两种基本力量，对立统一，消长变化。阳代表刚健、动、外、亮；阴代表柔顺、静、内、暗。' },
  { id: 't18', term: '八卦', pinyin: 'bā guà', category: '易经', definition: '乾、坤、震、巽、坎、离、艮、兑八种基本符号，代表八种自然现象与基本属性。' },
  { id: 't19', term: '爻', pinyin: 'yáo', category: '易经', definition: '易经的基本符号，分阳爻"⚊"与阴爻"⚋"。每卦由六爻组成。' },
  { id: 't20', term: '象数', pinyin: 'xiàng shù', category: '易经', definition: '易学的两大路径："象"指卦象、爻象所象征的事物；"数"指阴阳奇偶之数理。' },
  // 五行 / 中医
  { id: 't21', term: '五行', pinyin: 'wǔ xíng', category: '中医', definition: '金、木、水、火、土五种基本元素，代表宇宙万物的构成和相互关系。' },
  { id: 't22', term: '气血', pinyin: 'qì xuè', category: '中医', definition: '中医对人体基本物质的两大分类。"气"主推动与温煦；"血"主滋养与濡润。' },
  { id: 't23', term: '经络', pinyin: 'jīng luò', category: '中医', definition: '运行气血、联络脏腑肢节、沟通内外上下的通路系统。' },
  { id: 't24', term: '阴阳', pinyin: 'yīn yáng', category: '中医', definition: '中医用以概括人体两种对立统一的属性。阴阳平衡是健康的根本。' },
  // 儒家
  { id: 't25', term: '仁', pinyin: 'rén', category: '儒家', definition: '儒家核心概念，孔子释为"爱人"，是最高的道德准则。' },
  { id: 't26', term: '中庸', pinyin: 'zhōng yōng', category: '儒家', definition: '儒家追求的不偏不倚、恰到好处的处事态度与方法。' },
  { id: 't27', term: '格物致知', pinyin: 'gé wù zhì zhī', category: '儒家', definition: '通过探究事物本原而获得知识，是儒家认识论与修养论的重要命题。' },
];

const CATEGORIES = ['全部', '禅宗', '道家', '佛教', '易经', '中医', '儒家'] as const;
type Category = typeof CATEGORIES[number];

export default function TermsIndexPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('全部');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return TERMS.filter((t) => {
      if (activeCategory !== '全部' && t.category !== activeCategory) return false;
      if (!q) return true;
      return (
        t.term.toLowerCase().includes(q) ||
        t.pinyin.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
      );
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50">
      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1
            className="text-4xl text-[#2c2c2c] mb-2"
            style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
          >
            📖 术语百科
          </h1>
          <p className="text-gray-500 text-sm">禅宗 / 道家 / 佛教 / 易经 / 中医 / 儒家 速查</p>
          <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            ✨ 完全免费
          </span>
        </div>

        {/* Search */}
        <div className="mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 搜索词条、拼音、释义…"
            className="w-full px-4 py-2.5 rounded-full border border-stone-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3.5 py-1.5 text-xs rounded-full transition-colors ${
                activeCategory === c
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-stone-200 hover:border-amber-300'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Result Count */}
        <p className="text-xs text-gray-400 mb-3">共 {filtered.length} 条</p>

        {/* Term List */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-stone-100">
              <div className="text-3xl mb-2">🍃</div>
              没有匹配的词条，换个词试试
            </div>
          ) : (
            filtered.map((t) => (
              <article
                key={t.id}
                className="bg-white rounded-2xl p-5 border border-stone-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <div className="flex items-baseline gap-2">
                    <h3
                      className="text-xl text-[#2c2c2c]"
                      style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
                    >
                      {t.term}
                    </h3>
                    <span className="text-xs text-gray-400">{t.pinyin}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex-shrink-0">
                    {t.category}
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{t.definition}</p>
              </article>
            ))
          )}
        </div>

        {/* Back to Zang */}
        <div className="text-center mt-10">
          <Link
            href="/zang"
            className="text-xs text-gray-500 hover:text-amber-700 transition-colors"
          >
            ← 返回藏经
          </Link>
        </div>
      </main>
    </div>
  );
}
