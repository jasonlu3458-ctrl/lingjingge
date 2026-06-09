/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ];
  },
};

module.exports = nextConfig;
