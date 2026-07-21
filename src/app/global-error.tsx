'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 上报错误（生产可接 Sentry / Vercel Analytics）
    // eslint-disable-next-line no-console
    console.error('[AppError]', error);
  }, [error]);

  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-zen-beige px-4">
          <div className="max-w-md w-full text-center">
            <div className="text-6xl mb-4">🪷</div>
            <h1 className="text-2xl font-bold text-zen-ink mb-3" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              静观其变
            </h1>
            <p className="text-zen-ink/70 mb-2">修行路上偶遇波澜，不必慌张。</p>
            <p className="text-zen-ink/50 text-sm mb-6">
              {error.message || '页面遇到了一些意外，正在护送你回到正途。'}
            </p>
            {error.digest && (
              <p className="text-xs text-zen-ink/40 mb-6 font-mono">诊断编号：{error.digest}</p>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => reset()}
                className="px-5 py-2.5 bg-zen-ink text-white rounded-lg hover:bg-zen-ink/80 transition-colors"
              >
                重新尝试
              </button>
              <Link
                href="/home"
                className="px-5 py-2.5 bg-white text-zen-ink border border-zen-ink/20 rounded-lg hover:bg-zen-ink/5 transition-colors"
              >
                回到首页
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
