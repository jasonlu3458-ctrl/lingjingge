const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ============================================================
  // SEO 静态化说明（藏经阁 /zang/library/[category]/[slug]）：
  //   App Router 下，generateStaticParams 必须由 page.tsx 导出，
  //   不可写在 next.config.js。这里仅做以下配合：
  //     1. trailingSlash=false  → 避免收录时出现双 URL
  //     2. 头部加 X-Robots-Tag 友好默认值
  //   真正预生成在 src/app/zang/library/[category]/[slug]/page.tsx 内：
  //     - generateStaticParams()  预生成《道德经》81 章 + 金刚经 / 心经 / 坛经 / 易经
  //     - generateMetadata()      每篇独立 title / description / keywords
  //     - dynamicParams=true      白名单外仍可动态渲染
  // ============================================================
  trailingSlash: false,
  // 隐藏 Next.js dev 指示器（右下角圆形按钮）：
  // 固定在 right-0 / bottom-0，会盖住浏览器窗口右侧约 40px 的
  // 拖动/调整大小热区。在报告页（内容很长、滚动条贴近右缘）体感尤为明显。
  // Next 14 这里必须是对象，不能直接传 false。
  devIndicators: {
    appIsrStatus: false,
    buildActivity: false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: 'https', hostname: 'trae-api-cn.mchost.guru' },
    ],
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  async redirects() {
    // ============================================================
    // /wen/ 扁平化路由的 301 永久重定向
    //   2026-07-30 重构：将 wen/chan/ai-zen-master → wen/zen 等
    //   改 next.config.js 的 redirects()，发真正的 HTTP 301；
    //   改 rewrites() 不会发 301，只做内部 rewrite（URL 栏不变），
    //   搜索索引不会更新，反而对 SEO 有害。
    // ============================================================
    return [
      { source: '/wen/chan/ai-zen-master', destination: '/wen/zen', permanent: true },
      { source: '/wen/liao/mind',           destination: '/wen/heal', permanent: true },
      { source: '/wen/yi/yili',             destination: '/wen/yili', permanent: true },
      // ============================================================
      // /admin 入口重定向到 poster-generator
      //   2026-08-07 修复 Vercel 部署 ENOENT 错误：
      //   原 (admin)/page.tsx 是 client component，触发 client-reference-manifest
      //   在 Vercel 严格环境下偶发找不到 page_client-reference-manifest.js。
      //   社区验证方案：删除极简 page.tsx，把根入口改写为重定向到真实子页面。
      //   middleware 仍通过 startsWith('/admin') 守护所有 admin/* 子路径。
      // ============================================================
      { source: '/admin', destination: '/poster-generator', permanent: true },
    ];
  },
  async headers() {
    // dev 模式禁用 _next/static 强缓存
    // 因为 NEXT_PUBLIC_* 变量会随 .env.local 变化而变化，
    // 但 chunk 文件名 hash 不会变，会导致浏览器持有旧 env 值
    const staticCacheControl =
      process.env.NODE_ENV === 'development'
        ? 'no-store, must-revalidate'
        : 'public, max-age=31536000, immutable';

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      {
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: staticCacheControl,
          },
        ],
      },
      {
        // /api/* 默认禁缓存，避免支付/会话接口返回旧数据
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
      {
        // SVG 等无 hash 资源，限缓存 + 允许 revalidate
        source: '/:path*.svg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, must-revalidate' },
        ],
      },
      {
        // 公共安全头（覆盖所有路由）
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
