'use client';

import { useState } from 'react';
import ZenPosterModal from '@/components/ZenPosterModal';

interface Props {
  /** 今日禅机金句 */
  content: string;
  /** 金句出处 */
  source: string;
  /** 今日参究 */
  reflection: string;
  /** 今日日期 YYYY-MM-DD */
  today: string;
}

export default function DailyTopicClient({ content, source, reflection, today }: Props) {
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');
  const [posterOpen, setPosterOpen] = useState(false);

  const shareText = `【灵境阁 · 每日话题 ${today}】${content}\n—— ${source}\n\n${reflection}\n来同修中参究。`;

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
    <>
      <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="text-xs text-gray-500">
          ⓘ 今日话头由日期生成，每日 0 点更新。
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className="text-sm px-4 py-2 rounded-full border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
          >
            {shareStatus === 'copied' ? '✓ 已复制' : '📋 复制话头'}
          </button>
          <button
            onClick={() => setPosterOpen(true)}
            className="text-sm px-4 py-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-md transition-all"
          >
            🖼️ 生成我的禅意海报
          </button>
        </div>
      </div>

      <ZenPosterModal
        open={posterOpen}
        onClose={() => setPosterOpen(false)}
        content={content}
        source={source}
        today={today}
      />
    </>
  );
}
