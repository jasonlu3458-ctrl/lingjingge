export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f0eb]">
      <div className="flex flex-col items-center gap-4">
        {/* 简易水墨呼吸圆 */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[rgba(44,44,44,0.18)] via-[rgba(44,44,44,0.06)] to-transparent border border-[rgba(44,44,44,0.25)] animate-pulse" />
        <p
          className="text-sm text-[rgba(44,44,44,0.6)] tracking-widest"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          灵境阁 · 加载中…
        </p>
      </div>
    </div>
  );
}
