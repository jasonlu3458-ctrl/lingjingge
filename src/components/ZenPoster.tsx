'use client';

import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * ZenPoster —— 每日禅机分享海报（宣纸风格）
 *
 * 设计要点：
 *  - 整张图 1080×1920（与常见短视频封面同比例，扫码识别清晰）
 *  - 留白 60px 四边，水墨晕染圆点装饰
 *  - 中部金句竖排大字号
 *  - 落款：今日日期 + 出处
 *  - 用户名 / 八字摘要 / 邀请数（昵称可选）
 *  - 底部二维码：扫码即跳灵境阁首页，携带 ?ref=当前用户ID
 *  - 仅作"被 html2canvas 截图"的纯展示组件，无交互按钮
 */
export interface ZenPosterProps {
  /** 今日禅机金句 */
  content: string;
  /** 金句出处 */
  source?: string;
  /** 用户昵称（已登录时显示） */
  nickname?: string | null;
  /** 八字摘要（可选，文案如"戊子年·戊午月·丙辰日"） */
  baziSummary?: string | null;
  /** 已邀请人数 */
  inviteCount?: number;
  /** 今日日期 YYYY-MM-DD */
  today: string;
  /** 带 ref 参数的邀请链接（已含 ?ref=xxx） */
  inviteLink: string;
  /** 主题色调（默认 amber） */
  theme?: 'amber' | 'jade' | 'ink';
}

const THEME = {
  amber: {
    bg: '#fbf6ec',
    accent: '#b88a4a',
    text: '#2c2c2c',
    soft: '#5a3e1a',
    border: '#d4a86a',
  },
  jade: {
    bg: '#f1f5ee',
    accent: '#5a8a6a',
    text: '#1f2a24',
    soft: '#3d5a48',
    border: '#9ab48a',
  },
  ink: {
    bg: '#ece6dc',
    accent: '#3a3a3a',
    text: '#1a1a1a',
    soft: '#2c2c2c',
    border: '#8a8a8a',
  },
} as const;

const ZenPoster = forwardRef<HTMLDivElement, ZenPosterProps>(function ZenPoster(
  {
    content,
    source = '禅宗法语',
    nickname = null,
    baziSummary = null,
    inviteCount = 0,
    today,
    inviteLink,
    theme = 'amber',
  },
  ref,
) {
  const c = THEME[theme];

  return (
    <div
      ref={ref}
      // 关键：固定 1080x1920，与 html2canvas.scale=2 配合输出 2160x3840 高清
      style={{
        width: 1080,
        height: 1920,
        background: c.bg,
        position: 'relative',
        fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif",
        color: c.text,
        overflow: 'hidden',
        // 宣纸纹理：用 inline svg 噪点模拟
        backgroundImage: `url("data:image/svg+xml;utf8,<svg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/></svg>")`,
        backgroundSize: '200px 200px',
      }}
    >
      {/* 顶部：品牌区 */}
      <div style={{ position: 'absolute', top: 100, left: 100, right: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: c.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
              color: '#fff',
              boxShadow: `0 4px 12px ${c.accent}55`,
            }}
          >
            灵
          </div>
          <div>
            <div style={{ fontSize: 56, fontWeight: 700, color: c.text, letterSpacing: 6 }}>
              灵境阁
            </div>
            <div style={{ fontSize: 24, color: c.soft, marginTop: 4, letterSpacing: 4 }}>
              东方智慧 · AI 导引
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, color: c.soft, letterSpacing: 2 }}>每日禅机</div>
          <div style={{ fontSize: 28, color: c.accent, marginTop: 4, fontFamily: 'monospace' }}>
            {today}
          </div>
        </div>
      </div>

      {/* 装饰横线 */}
      <div
        style={{
          position: 'absolute',
          top: 230,
          left: 100,
          right: 100,
          height: 2,
          background: `linear-gradient(to right, transparent, ${c.border}, transparent)`,
        }}
      />

      {/* 水墨晕染圆点（左上、右下装饰） */}
      <div
        style={{
          position: 'absolute',
          top: 320,
          right: 60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c.accent}22 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 380,
          left: 40,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c.accent}18 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      {/* 中部：金句 */}
      <div
        style={{
          position: 'absolute',
          top: 460,
          left: 120,
          right: 120,
          textAlign: 'center',
        }}
      >
        {/* 装饰大引号 */}
        <div style={{ fontSize: 180, color: c.accent, lineHeight: 0.8, opacity: 0.5, marginBottom: 20 }}>
          『
        </div>
        <div
          style={{
            fontSize: 92,
            lineHeight: 1.6,
            color: c.text,
            fontWeight: 500,
            letterSpacing: 8,
            margin: '0 auto',
            maxWidth: 840,
          }}
        >
          {content}
        </div>
        <div
          style={{
            fontSize: 36,
            color: c.soft,
            marginTop: 60,
            letterSpacing: 4,
            opacity: 0.8,
          }}
        >
          —— {source} ——
        </div>
      </div>

      {/* 落款：用户信息 / 八字摘要 */}
      <div
        style={{
          position: 'absolute',
          top: 1240,
          left: 120,
          right: 120,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'inline-block',
            padding: '24px 48px',
            background: '#fff8',
            border: `1.5px solid ${c.border}`,
            borderRadius: 20,
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          {nickname && (
            <div style={{ fontSize: 36, color: c.soft, marginBottom: 8, letterSpacing: 4 }}>
              {nickname} 谨识
            </div>
          )}
          {baziSummary && (
            <div style={{ fontSize: 26, color: c.accent, marginTop: 8, letterSpacing: 3, opacity: 0.85 }}>
              {baziSummary}
            </div>
          )}
          {inviteCount > 0 && (
            <div style={{ fontSize: 22, color: c.soft, marginTop: 10, opacity: 0.65 }}>
              ✨ 已邀 {inviteCount} 位同修
            </div>
          )}
          {!nickname && !baziSummary && (
            <div style={{ fontSize: 26, color: c.soft, letterSpacing: 4 }}>
              与你共参
            </div>
          )}
        </div>
      </div>

      {/* 装饰横线 */}
      <div
        style={{
          position: 'absolute',
          top: 1480,
          left: 200,
          right: 200,
          height: 1,
          background: c.border,
          opacity: 0.5,
        }}
      />

      {/* 底部：二维码 + 引导文案 */}
      <div
        style={{
          position: 'absolute',
          bottom: 140,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 60,
        }}
      >
        <div
          style={{
            padding: 24,
            background: '#fff',
            borderRadius: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: `2px solid ${c.border}`,
          }}
        >
          <QRCodeSVG
            value={inviteLink}
            size={260}
            level="H"
            marginSize={2}
            fgColor={c.text}
            bgColor="#ffffff"
          />
        </div>
        <div style={{ maxWidth: 460 }}>
          <div style={{ fontSize: 42, color: c.accent, fontWeight: 600, letterSpacing: 4, marginBottom: 16 }}>
            扫码入阁
          </div>
          <div style={{ fontSize: 30, color: c.soft, lineHeight: 1.7, letterSpacing: 2 }}>
            微信扫一扫
            <br />
            与千万同修共参
            <br />
            <span style={{ color: c.accent, fontWeight: 500 }}>首次入阁送 7 天会员</span>
          </div>
        </div>
      </div>

      {/* 最底部：网址 */}
      <div
        style={{
          position: 'absolute',
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 22,
          color: c.soft,
          letterSpacing: 4,
          opacity: 0.6,
          fontFamily: 'monospace',
        }}
      >
        lingjingge.cn
      </div>
    </div>
  );
});

export default ZenPoster;
