'use client';

import { useState } from 'react';

interface Props {
  quoteText: string;
  today: string;
}

export default function DailyTopicClient({ quoteText, today }: Props) {
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  const shareText = `【灵境阁 · 每日话题 ${today}】${quoteText}\n来同修中参究。`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000);
    } catch {
      setShareStatus('idle');
    }
  };

  return (
    <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div className="text-xs text-gray-500">
        ⓘ 今日话头由日期生成，每日 0 点更新。
      </div>
      <button
        onClick={handleCopy}
        className="text-sm px-4 py-2 rounded-full bg-amber-600 text-white hover:bg-amber-700 transition-colors"
      >
        {shareStatus === 'copied' ? '✓ 已复制' : '📋 分享今日话头'}
      </button>
    </div>
  );
}
