'use client';

import { useState } from 'react';

export default function PosterGenerator() {
  const [loading, setLoading] = useState(false);
  const [poster, setPoster] = useState<{
    theme: string;
    slogan: string;
    imageUrl: string;
    date: string;
  } | null>(null);
  const [history, setHistory] = useState<Array<{
    theme: string;
    date: string;
    imageUrl: string;
  }>>([]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cron/generate-poster?force=true');
      const data = await res.json();

      if (data.success) {
        setPoster({
          theme: data.theme,
          slogan: data.slogan,
          imageUrl: data.imageUrl,
          date: data.date,
        });
        fetchHistory();
      }
    } catch (error) {
      console.error('[poster] generate error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        return;
      }

      const res = await fetch(`${supabaseUrl}/rest/v1/generated_posters?tenant_id=eq.muxintang&order=date.desc&limit=10`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data.map((item: any) => ({
          theme: item.theme,
          date: item.date,
          imageUrl: item.image_url,
        })));
      }
    } catch {
      // ignore
    }
  };

  useState(() => {
    fetchHistory();
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          🎨 海报生成器
        </h1>
        <p className="text-[#808080] mt-2">自动生成适合朋友圈传播的海报文案与图片</p>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 text-center">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-lg font-semibold text-[#D4AF37] mb-2">生成今日海报</h3>
            <p className="text-sm text-[#808080] mb-6">
              AI 将自动生成一段适合朋友圈传播的文案，并生成一张黑金风格的海报图片
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-[#8B4513] text-[#D4AF37] px-8 py-3 rounded-lg hover:bg-[#A0522D] transition-colors text-lg disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="inline-block w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mr-2" />
                  生成中...
                </>
              ) : (
                '✨ 一键生成海报'
              )}
            </button>
          </div>

          {poster && (
            <div className="flex-1">
              <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#333333]">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-[#808080]">今日主题：{poster.theme}</span>
                  <span className="text-xs text-[#666]">{poster.date}</span>
                </div>
                <div className="relative aspect-[9/16] bg-[#0a0a0a] rounded-lg overflow-hidden">
                  <img
                    src={poster.imageUrl}
                    alt="生成的海报"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="mt-4">
                  <p className="text-sm text-[#C0C0C0] leading-relaxed">{poster.slogan}</p>
                </div>
                <div className="mt-4 flex gap-3">
                  <a
                    href={poster.imageUrl}
                    download={`poster_${poster.date}.png`}
                    className="flex-1 bg-[#8B4513] text-[#D4AF37] px-4 py-2 rounded-lg hover:bg-[#A0522D] transition-colors text-center text-sm"
                  >
                    📥 下载海报
                  </a>
                  <button
                    onClick={() => navigator.clipboard.writeText(poster.slogan)}
                    className="flex-1 bg-[#242424] text-[#C0C0C0] px-4 py-2 rounded-lg hover:bg-[#333] transition-colors text-center text-sm"
                  >
                    📋 复制文案
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
        <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">📜 历史海报</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {history.map((item, index) => (
            <div key={index} className="bg-[#0a0a0a] rounded-lg overflow-hidden">
              <div className="aspect-[9/16]">
                <img
                  src={item.imageUrl}
                  alt={item.theme}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <p className="text-sm text-[#D4AF37]">{item.theme}</p>
                <p className="text-xs text-[#808080]">{item.date}</p>
                <a
                  href={item.imageUrl}
                  download={`poster_${item.date}.png`}
                  className="block mt-2 text-xs text-[#8B4513] hover:text-[#D4AF37]"
                >
                  下载
                </a>
              </div>
            </div>
          ))}
          {history.length === 0 && (
            <div className="col-span-full text-center py-8 text-[#808080]">
              暂无历史海报，点击上方按钮生成第一张海报
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
