'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error('[RouteError]', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-3">🪷</div>
        <h1 className="text-xl font-bold text-zen-ink mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          静观其变
        </h1>
        <p className="text-zen-ink/70 mb-1">这一段路暂时走不通。</p>
        <p className="text-zen-ink/50 text-sm mb-5">
          {error.message || '页面遇到了一些意外。'}
        </p>
        {error.digest && (
          <p className="text-xs text-zen-ink/40 mb-5 font-mono">诊断编号：{error.digest}</p>
        )}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-zen-ink text-white rounded-lg hover:bg-zen-ink/80 transition-colors text-sm"
          >
            重新尝试
          </button>
          <Link
            href="/home"
            className="px-4 py-2 bg-white text-zen-ink border border-zen-ink/20 rounded-lg hover:bg-zen-ink/5 transition-colors text-sm"
          >
            回到首页
          </Link>
        </div>
      </div>
    </div>
  );
}
