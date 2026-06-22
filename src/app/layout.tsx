import type { Metadata } from "next";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";
import MockBootstrap from "@/components/MockBootstrap";

// 中文字体：当前环境无法访问 Google Fonts CDN，因此直接使用系统字体栈。
// 浏览器在无 Ma Shan Zheng 时自动 fallback 到 STKaiti / KaiTi / serif，
// 保持观感与原先一致。
const maShanZhengVariable = "--font-ma-shan-zheng";

export const metadata: Metadata = {
  title: "灵境阁 - 东方智慧 AI 导引平台",
  description: "融合东方智慧与 AI 科技，提供 AI 禅师、体质观察、取名轩等服务",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" style={{ [maShanZhengVariable]: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" } as React.CSSProperties}>
      <body className="flex flex-col min-h-screen">
        <NavbarWrapper />
        <div className="flex-1">{children}</div>
        <MockBootstrap />
        <footer className="text-xs text-gray-400 text-center py-2 border-t border-gray-100">
          <div>
            ⚠️ 本平台内容仅供传统文化交流与娱乐参考，不构成专业建议。
            <a href="/disclaimer" className="underline hover:text-gray-600">详细了解</a>
            <span className="mx-2">|</span>
            <a href="/privacy" className="underline hover:text-gray-600">隐私政策</a>
            <span className="mx-2">|</span>
            <a href="/terms" className="underline hover:text-gray-600">服务条款</a>
          </div>
          <div className="mt-1 text-gray-300" title="移动端改造前基线版本">
            v0.1.0 · 移动端改造前 · baseline @ 2026-06-16
          </div>
        </footer>
      </body>
    </html>
  );
}
