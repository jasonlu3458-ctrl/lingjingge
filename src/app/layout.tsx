import type { Metadata } from "next";
import "./globals.css";
import NavbarWrapper from "@/components/NavbarWrapper";

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
      <body>
        <NavbarWrapper />
        {children}
      </body>
    </html>
  );
}
