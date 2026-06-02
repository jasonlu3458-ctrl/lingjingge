import Link from 'next/link';
import Navbar from '@/components/Navbar';

const dailyZenQuotes = [
  "心若无尘，岁月生香",
  "一念心清净，处处莲花开",
  "平常心是道",
  "行到水穷处，坐看云起时",
  "本来无一物，何处惹尘埃",
  "菩提本无树，明镜亦非台",
  "应无所住而生其心",
];

export default function Home() {
  const todayQuote = dailyZenQuotes[new Date().getDate() % dailyZenQuotes.length];

  return (
    <div className="min-h-screen bg-zen-beige">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 每日参悟 */}
        <section className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-zen-ink mb-4">
            每日参悟
          </h1>
          <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg p-8 max-w-3xl mx-auto shadow-lg border border-zen-gray">
            <p className="text-2xl md:text-3xl text-zen-ink font-light italic leading-relaxed">
              {todayQuote}
            </p>
            <div className="mt-4 w-24 h-1 bg-zen-ink mx-auto"></div>
          </div>
        </section>

        {/* 功能入口 */}
        <section className="grid md:grid-cols-3 gap-8">
          {/* AI 禅师 */}
          <Link href="/ai-zen-master" className="group">
            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-zen-gray hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-5xl mb-4 text-center">🧘</div>
              <h2 className="text-2xl font-bold text-zen-ink text-center mb-3">
                AI 禅师
              </h2>
              <p className="text-gray-600 text-center">
                与 AI 禅师对话，解开心灵困惑，寻找内心宁静
              </p>
            </div>
          </Link>

          {/* 体质观察 */}
          <Link href="/health" className="group">
            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-zen-gray hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
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
            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-zen-gray hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-5xl mb-4 text-center">✍️</div>
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
    </div>
  );
}
