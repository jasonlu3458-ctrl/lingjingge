import Link from 'next/link';
import FloatingLandscape from '@/components/FloatingLandscape';

const dailyZenQuotes = [
  "心若无尘，岁月生香",
  "一念心清净，处处莲花开",
  "平常心是道",
  "行到水穷处，坐看云起时",
  "本来无一物，何处惹尘埃",
  "菩提本无树，明镜亦非台",
  "应无所住而生其心",
];

export default function HomePage() {
  const todayQuote = dailyZenQuotes[new Date().getDate() % dailyZenQuotes.length];

  return (
    <div className="min-h-screen bg-zen-beige">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 每日参悟 */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-zen-ink mb-6 zen-fade-in">
            每日参悟
          </h1>
          
          {/* 毛笔笔触分隔线 */}
          <div className="ink-brush-line mb-8 zen-fade-in-delay-1"></div>
          
          <div className="zen-card rounded-lg p-8 max-w-3xl mx-auto zen-fade-in-delay-2">
            <p className="text-2xl md:text-3xl text-zen-ink font-light italic leading-relaxed">
              {todayQuote}
            </p>
            <div className="mt-6 w-24 h-1 bg-zen-ink mx-auto opacity-30"></div>
          </div>
        </section>

        {/* 功能入口 */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* AI 禅师 */}
          <Link href="/ai-zen-master" className="group">
            <div className="zen-card rounded-lg p-8 hover:-translate-y-1">
              <div className="text-5xl mb-4 text-center">🧘</div>
              <h2 className="text-2xl font-bold text-zen-ink text-center mb-3">
                AI 禅师
              </h2>
              <p className="text-gray-600 text-center">
                与 AI 禅师对话，解开心灵困惑，寻找内心宁静
              </p>
            </div>
          </Link>

          {/* AI 疗愈师 */}
          <Link href="/mind" className="group">
            <div className="zen-card rounded-lg p-8 hover:-translate-y-1">
              <div className="text-5xl mb-4 text-center">💚</div>
              <h2 className="text-2xl font-bold text-zen-ink text-center mb-3">
                AI 疗愈师
              </h2>
              <p className="text-gray-600 text-center">
                音疗冥想，正念放松，找回身心平衡与内在平静
              </p>
            </div>
          </Link>

          {/* 体质观察 */}
          <Link href="/health" className="group">
            <div className="zen-card rounded-lg p-8 hover:-translate-y-1">
              <div className="text-5xl mb-4 text-center">🌿</div>
              <h2 className="text-2xl font-bold text-zen-ink text-center mb-3">
                体质观察
              </h2>
              <p className="text-gray-600 text-center">
                中医体质辨识，舌象分析，了解自己的身体状态
              </p>
            </div>
          </Link>

          {/* 取名轩 */}
          <Link href="/name" className="group">
            <div className="zen-card rounded-lg p-8 hover:-translate-y-1">
              <div className="text-5xl mb-4 text-center">📜</div>
              <h2 className="text-2xl font-bold text-zen-ink text-center mb-3">
                取名轩
              </h2>
              <p className="text-gray-600 text-center">
                融合传统文化与现代美学，为宝宝取一个好名字
              </p>
            </div>
          </Link>
        </section>

        {/* 底部装饰 */}
        <div className="mt-20 text-center">
          <div className="w-16 h-1 bg-zen-ink mx-auto opacity-30"></div>
          <p className="mt-4 text-gray-500 text-sm">
            灵境阁 · 东方智慧 AI 导引平台
          </p>
        </div>
      </main>

      {/* AI 引路人 - 水墨仙岛 */}
      <FloatingLandscape />
    </div>
  );
}