/** @type {import('next').NextConfig} */
const nextConfig = {
  // 独立输出：生成 .next/standalone/，Docker 部署仅需 copy
  // 必要文件（standalone 目录 + public + .next/static），
  // 镜像体积可从 ~500MB 降至 ~150MB。
  output: 'standalone',
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
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
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

module.exports = nextConfig;
