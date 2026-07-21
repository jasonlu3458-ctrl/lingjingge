'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import ZenPoster from './ZenPoster';

interface MeResponse {
  ok: boolean;
  user_id?: string;
  profile?: {
    id: string;
    nickname?: string | null;
    display_name?: string | null;
    bazi_summary?: string | null;
    invited_by?: string | null;
  };
  mock?: boolean;
}

interface InviteCountResponse {
  ok: boolean;
  count?: number;
  reward_claimed?: boolean;
  invited_by?: string | null;
  mock?: boolean;
}

interface Props {
  /** 今日禅机金句 */
  content: string;
  /** 金句出处 */
  source?: string;
  /** 今日日期 YYYY-MM-DD */
  today: string;
  /** Modal 是否打开 */
  open: boolean;
  /** 关闭 */
  onClose: () => void;
}

/**
 * ZenPosterModal
 *  - 拉取当前用户信息（昵称 / 八字 / userId）
 *  - 拼出带 ref= 的邀请链接
 *  - html2canvas 截屏 → 自动下载 PNG
 *  - 海报本身缩放显示（容器 540×960），但内部用 1080×1920 保证清晰
 */
export default function ZenPosterModal({ content, source, today, open, onClose }: Props) {
  const posterRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    nickname: string | null;
    baziSummary: string | null;
    inviteCount: number;
    inviteLink: string;
    userId: string | null;
  } | null>(null);

  // 拉取用户信息
  const loadMeta = useCallback(async () => {
    try {
      // 1) 我的资料（user_id / nickname / bazi_summary / invited_by）
      const meRes = await fetch('/api/user/me', { cache: 'no-store' });
      const meJson: MeResponse = await meRes.json();

      const userId: string | null = meJson.user_id ?? null;
      const profile = meJson.profile;
      const nickname = profile?.display_name || profile?.nickname || null;
      const baziSummary = profile?.bazi_summary || null;

      // 2) 我的邀请人数（独立端点）
      let inviteCount = 0;
      try {
        const cRes = await fetch('/api/user/invite/count', { cache: 'no-store' });
        const cJson: InviteCountResponse = await cRes.json();
        inviteCount = cJson.count ?? 0;
      } catch {
        inviteCount = 0;
      }

      // 3) 拼邀请链接：根 URL + ?ref=当前用户ID
      const base = typeof window !== 'undefined' ? window.location.origin : 'https://lingjingge.cn';
      const inviteLink = userId
        ? `${base}/tong/signup?ref=${userId}`
        : `${base}/tong/signup`;

      setMeta({ nickname, baziSummary, inviteCount, inviteLink, userId });
    } catch (e) {
      // fallback: 匿名海报
      const base = typeof window !== 'undefined' ? window.location.origin : 'https://lingjingge.cn';
      setMeta({
        nickname: null,
        baziSummary: null,
        inviteCount: 0,
        inviteLink: `${base}/tong/signup`,
        userId: null,
      });
    }
  }, []);

  useEffect(() => {
    if (open) {
      setDownloaded(false);
      setError(null);
      loadMeta();
    }
  }, [open, loadMeta]);

  // 锁定 body 滚动
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const handleDownload = useCallback(async () => {
    const el = posterRef.current;
    if (!el) return;
    setGenerating(true);
    setError(null);
    try {
      // 等所有 web 字体加载完成,避免截图缺字 / 字体降级导致 line-height 错位
      if (typeof document !== 'undefined' && (document as any).fonts) {
        await (document as any).fonts.ready;
        // 显式触发 Ma Shan Zheng 字体加载,html2canvas 不会主动 fetch
        try {
          await (document as any).fonts.load('160px "Ma Shan Zheng"');
          await (document as any).fonts.load('88px "Ma Shan Zheng"');
          await (document as any).fonts.load('36px "Ma Shan Zheng"');
        } catch {}
      }
      // 额外等两帧让浏览器布局稳定
      await new Promise(r => requestAnimationFrame(() => r(null)));
      await new Promise(r => requestAnimationFrame(() => r(null)));

      const canvas = await html2canvas(el, {
        backgroundColor: '#fbf6ec',
        scale: 2, // 高清 2x → 2160×3840
        useCORS: true,
        logging: false,
        width: 1080,
        height: 1920,
        windowWidth: 1080,
        windowHeight: 1920,
        // 强制 foreignObject 渲染,字体回退更可靠
        foreignObjectRendering: false,
      });

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png', 1.0),
      );
      if (!blob) throw new Error('生成图片失败');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `灵境阁·每日禅机_${today}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setDownloaded(true);
    } catch (e: any) {
      console.error('[ZenPoster] 生成失败', e);
      setError(e?.message || '生成失败，请重试');
    } finally {
      setGenerating(false);
    }
  }, [today]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[640px] max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: "'Ma Shan Zheng', serif" }}>
              🖼️ 生成禅意海报
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              长按或保存图片，分享至朋友圈 / 微信
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        {/* 海报预览（按比例缩放显示） */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50">
          <div
            className="mx-auto"
            style={{
              width: 540,
              height: 960,
              transform: 'scale(1)',
              transformOrigin: 'top center',
            }}
          >
            <div
              style={{
                width: 540,
                height: 960,
                overflow: 'hidden',
                borderRadius: 12,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                background: '#fbf6ec',
              }}
            >
              {/* 内部用 1080×1920 高分渲染，按 0.5 缩放显示 */}
              <div
                style={{
                  width: 1080,
                  height: 1920,
                  transform: 'scale(0.5)',
                  transformOrigin: 'top left',
                }}
              >
                {meta ? (
                  <ZenPoster
                    ref={posterRef}
                    content={content}
                    source={source}
                    nickname={meta.nickname}
                    baziSummary={meta.baziSummary}
                    inviteCount={meta.inviteCount}
                    today={today}
                    inviteLink={meta.inviteLink}
                  />
                ) : (
                  <div
                    style={{
                      width: 1080,
                      height: 1920,
                      background: '#fbf6ec',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 60,
                      color: '#999',
                    }}
                  >
                    准备中…
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          {error && (
            <div className="text-sm text-red-600 mb-3">⚠️ {error}</div>
          )}
          {downloaded && (
            <div className="text-sm text-green-600 mb-3">✓ 海报已下载到本地</div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-full text-sm text-gray-600 hover:bg-gray-100 transition"
            >
              关闭
            </button>
            <button
              onClick={handleDownload}
              disabled={generating || !meta}
              className={`flex-1 px-5 py-2.5 rounded-full text-sm font-medium transition ${
                generating
                  ? 'bg-amber-300 text-white cursor-wait'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:shadow-lg disabled:opacity-50'
              }`}
            >
              {generating ? '生成中…' : downloaded ? '🔄 重新下载' : '⬇️ 下载高清海报'}
            </button>
          </div>
          {meta?.inviteLink && (
            <div className="text-[11px] text-gray-400 mt-3 break-all font-mono">
              邀请链接：{meta.inviteLink}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
