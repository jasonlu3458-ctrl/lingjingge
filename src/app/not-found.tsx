import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-3" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          404
        </div>
        <div className="text-5xl mb-4">🪷</div>
        <h1
          className="text-2xl font-bold text-zen-ink mb-3"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
        >
          此径不通
        </h1>
        <p className="text-zen-ink/70 mb-1">所寻之路，暂未开通。</p>
        <p className="text-zen-ink/50 text-sm mb-6">
          或许已改名，或许已迁途。不如回首，或另辟蹊径。
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href="/home"
            className="px-5 py-2.5 bg-zen-ink text-white rounded-lg hover:bg-zen-ink/80 transition-colors"
          >
            回到首页
          </Link>
          <Link
            href="/zang/library"
            className="px-5 py-2.5 bg-white text-zen-ink border border-zen-ink/20 rounded-lg hover:bg-zen-ink/5 transition-colors"
          >
            逛逛藏经阁
          </Link>
        </div>
      </div>
    </div>
  );
}
