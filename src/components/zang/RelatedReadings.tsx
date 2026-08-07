import Link from 'next/link';
import { getArticlesByCategory, type Article } from '@/lib/zang-data';

interface RelatedReadingsProps {
  category: string;
  currentSlug: string;
  count?: number;
}

/**
 * 从当前 category 随机选取 2-3 篇其他文章作为推荐阅读。
 * 纯服务端组件，无客户端副作用。
 */
export default function RelatedReadings({ category, currentSlug, count = 3 }: RelatedReadingsProps) {
  const all = getArticlesByCategory(category);
  if (all.length <= 1) return null;

  const others = all.filter((a) => a.slug !== currentSlug);
  if (others.length === 0) return null;

  // 稳定伪随机：按 slug 排序后取 count 个，保证 SSG + RSC 输出一致
  const sorted = [...others].sort((a, b) => a.slug.localeCompare(b.slug));
  const picks = sorted.slice(0, Math.min(count, sorted.length));

  return (
    <section
      aria-label="同修也在读"
      className="mt-12 pt-8 border-t border-amber-200/60"
    >
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl">📚</span>
        <h2
          className="text-xl font-bold text-[#2c2c2c]"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          同修也在读
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {picks.map((a: Article) => {
          const summary = (a.content || '')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 60);
          return (
            <Link
              key={a.id}
              href={`/zang/library/${category}/${a.slug}`}
              className="group block rounded-xl p-4 bg-[#fbf6ec]/80 border border-amber-200/60 hover:bg-white hover:border-[#b88a4a]/60 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-2 mb-2">
                <span className="text-amber-600 text-base">📜</span>
                <h3
                  className="flex-1 text-sm font-semibold text-[#2c2c2c] group-hover:text-[#b88a4a] transition-colors leading-snug"
                  style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
                >
                  {a.title}
                </h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 italic min-h-[2.5rem]">
                {summary ? summary + '…' : '点击展卷 →'}
              </p>
              <div className="mt-2 text-[11px] text-amber-700/70 tracking-widest group-hover:translate-x-0.5 transition-transform">
                展卷 →
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
