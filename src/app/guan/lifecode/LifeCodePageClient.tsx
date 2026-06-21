// ============================================================
// LifeCodePageClient —— AI 生命密码 · 天赋觉醒
// 主题：深空紫蓝（背景 #0a0a1a→#1a1c2e；主色 #7c3aed；副色 #38bdf8）
// 风格：毛玻璃 (bg-white/5 backdrop-blur-sm border border-white/10)
// ============================================================

'use client';

import { useState, useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import type { UserRole } from '@/lib/auth';
import ReportPaywall from '@/components/ReportPaywall';
import ExportPDFButton from '@/components/ExportPDFButton';
import type { LifeCodeReport } from '@/lib/lifecode-rules';

// ============================================================
// 性能埋点：模块加载基准 + 日志 helper
// 用法: lcLog('label', { key: value })
// 输出: [LC] +123.45ms | label | { key: value }
// ============================================================
const MODULE_LOAD_T0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
const lcLog = (label: string, extra?: Record<string, unknown>) => {
  if (typeof window === 'undefined') return; // SSR 安全
  const t = performance.now();
  const ms = (t - MODULE_LOAD_T0).toFixed(2);
  if (extra) console.log(`[LC] +${ms}ms | ${label}`, extra);
  else      console.log(`[LC] +${ms}ms | ${label}`);
};
// 首次模块执行即打点（不依赖组件挂载）
if (typeof window !== 'undefined') {
  console.log(`[LC] +0.00ms | module loaded | file=LifeCodePageClient.tsx`);
}

// ============================================================
// BreathRing — 呼吸光环（埋点：动画启动 / 周期性 iteration）
// ============================================================
function BreathRing() {
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let iter = 0;
    const onStart = (ev: AnimationEvent) => {
      if (ev.animationName === 'lcBreath') {
        iter += 1;
        if (iter <= 3) {
          lcLog(`BreathRing iteration #${iter} start`);
        }
      }
    };
    el.addEventListener('animationstart', onStart);
    lcLog('BreathRing mounted (lcBreath animation registered)');
    return () => {
      el.removeEventListener('animationstart', onStart);
    };
  }, []);
  return (
    <span
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-xl animate-pulse"
      style={{
        boxShadow: '0 0 0 0 rgba(167,139,250,0.6), 0 0 28px 6px rgba(124,58,237,0.35)',
        animation: 'lcBreath 2.4s ease-in-out infinite',
      }}
    />
  );
}

// ---------- 主题色 ----------
const C_BG_TOP = '#0a0a1a';         // 背景顶
const C_BG_BOT = '#1a1c2e';         // 背景底
const C_PURPLE = '#7c3aed';         // 主色 · 紫
const C_CYAN   = '#38bdf8';         // 副色 · 青
const C_PURPLE_SOFT = '#a78bfa';    // 紫柔
const C_CYAN_SOFT   = '#7dd3fc';    // 青柔
const C_TEXT         = 'rgba(255,255,255,0.95)';
const C_TEXT_SOFT    = 'rgba(255,255,255,0.72)';
const C_TEXT_DIM     = 'rgba(255,255,255,0.5)';
const C_GLASS_BG     = 'rgba(255,255,255,0.05)';
const C_GLASS_BORDER = 'rgba(255,255,255,0.10)';
const C_GLASS_HOVER  = 'rgba(255,255,255,0.08)';
const FONT_KAI = "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif";

// 工具：毛玻璃卡片 className
const glass = `bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl`;
const glassStrong = `bg-white/[0.08] backdrop-blur-md border border-white/15 rounded-2xl`;

// ============================================================
// Inline 自定义：紫色渐变 ScoreGauge
// ============================================================
function LifeCodeScoreGauge({ score, label }: { score: number; label: string }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  const id = `lc-gauge-grad-${score}`;
  return (
    <div className="flex flex-col items-center">
      <svg width="168" height="168" viewBox="0 0 168 168" className="drop-shadow-[0_0_18px_rgba(124,58,237,0.5)]">
        <defs>
          <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C_PURPLE} />
            <stop offset="100%" stopColor={C_CYAN} />
          </linearGradient>
        </defs>
        <circle cx="84" cy="84" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" />
        <circle
          cx="84" cy="84" r={radius}
          fill="none" stroke={`url(#${id})`} strokeWidth="12"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          transform="rotate(-90 84 84)"
          style={{ filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.6))' }}
        />
        <text x="84" y="78" textAnchor="middle" fontSize="36" fontWeight="700" fill="#e9d5ff">
          {score}
        </text>
        <text x="84" y="100" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.6)">
          / 100
        </text>
      </svg>
      <div
        className="mt-1 text-xs font-semibold tracking-wide"
        style={{ color: C_PURPLE_SOFT, fontFamily: FONT_KAI }}
      >
        {label}
      </div>
    </div>
  );
}

// ============================================================
// Inline 自定义：发光药丸 BaziSummaryBar
// ============================================================
interface LCPillItem { label: string; value: string; variant?: 'purple' | 'cyan' | 'white' }
function LifeCodeSummaryBar({ items }: { items: LCPillItem[] }) {
  const variantClass = (v: LCPillItem['variant']) => {
    if (v === 'cyan')  return 'bg-cyan-500/20   text-cyan-300   border border-cyan-400/30   shadow-[0_0_12px_rgba(56,189,248,0.25)]';
    if (v === 'white') return 'bg-white/15      text-white      border border-white/20     shadow-[0_0_10px_rgba(255,255,255,0.18)]';
    return                  'bg-purple-500/20  text-purple-300 border border-purple-400/30 shadow-[0_0_12px_rgba(124,58,237,0.25)]';
  };
  // 默认交替紫/青
  const getVariant = (i: number, explicit?: LCPillItem['variant']) => explicit ?? (i % 2 === 0 ? 'purple' : 'cyan');
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it, i) => (
        <div
          key={i}
          className={`px-3 py-1.5 rounded-full ${variantClass(getVariant(i, it.variant))}`}
          style={{ fontFamily: FONT_KAI }}
        >
          <span className="text-[10px] mr-1.5 opacity-75">{it.label}</span>
          <span className="text-xs font-bold">{it.value}</span>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Inline 自定义：深色玻璃 FreeCard + 延迟滑入
// ============================================================
interface LCFreeCardProps {
  index: number;
  icon: string;
  subtitle: string;
  title: string;
  content: string;
  delayMs?: number; // 入场动画延迟
}
function LifeCodeFreeCard({ index, icon, subtitle, title, content, delayMs = 0 }: LCFreeCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onAnimStart = (ev: AnimationEvent) => {
      if (ev.animationName === 'reportFadeIn') {
        lcLog(`FreeCard #${index + 1} animation start`, {
          title,
          delayMs,
          elapsed: `${ev.elapsedTime.toFixed(2)}ms`,
        });
      }
    };
    const onAnimEnd = (ev: AnimationEvent) => {
      if (ev.animationName === 'reportFadeIn') {
        lcLog(`FreeCard #${index + 1} animation end`, { title });
      }
    };
    el.addEventListener('animationstart', onAnimStart);
    el.addEventListener('animationend', onAnimEnd);
    lcLog(`FreeCard #${index + 1} mounted (delayMs=${delayMs}ms)`, { title });
    return () => {
      el.removeEventListener('animationstart', onAnimStart);
      el.removeEventListener('animationend', onAnimEnd);
    };
  }, [index, title, delayMs]);
  return (
    <div
      ref={cardRef}
      className={`${glass} p-4 shadow-lg transition-all duration-300 hover:bg-white/[0.08] report-fade-in`}
      style={{ animationDelay: `${delayMs}ms`, animationFillMode: 'both' }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl border border-purple-400/30"
          style={{
            backgroundColor: 'rgba(124,58,237,0.18)',
            color: C_PURPLE_SOFT,
            boxShadow: '0 0 14px rgba(124,58,237,0.35)',
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: C_PURPLE, fontFamily: FONT_KAI }}
            >
              {index + 1}
            </span>
            <h3
              className="text-base font-bold"
              style={{ color: C_PURPLE_SOFT, fontFamily: FONT_KAI }}
            >
              {title}
            </h3>
            <span className="text-[10px]" style={{ color: C_TEXT_DIM }}>· {subtitle}</span>
          </div>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: C_TEXT_SOFT, fontFamily: FONT_KAI }}
          >
            {content}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------- MiniMarkdown ----------
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={`b${key++}`} style={{ color: C_PURPLE_SOFT }}>{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MiniMarkdown({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0, key = 0;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed === '') { i++; continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (h) {
      const level = h[1].length;
      const cls = level === 1 ? 'text-lg font-bold mt-3' : level === 2 ? 'text-base font-bold mt-2' : 'text-sm font-bold mt-2';
      const Tag = (`h${level + 2}`) as 'h3' | 'h4' | 'h5';
      blocks.push(<Tag key={key++} className={cls} style={{ color: C_CYAN_SOFT }}>{renderInline(h[2])}</Tag>);
      i++; continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(<li key={items.length} style={{ color: C_TEXT_SOFT }}>{renderInline(lines[i].trim().replace(/^[-*]\s+/, ''))}</li>);
        i++;
      }
      blocks.push(<ul key={key++} className="list-disc pl-5 space-y-1 my-2">{items}</ul>);
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(<li key={items.length} style={{ color: C_TEXT_SOFT }}>{renderInline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>);
        i++;
      }
      blocks.push(<ol key={key++} className="list-decimal pl-5 space-y-1 my-2">{items}</ol>);
      continue;
    }
    const para: string[] = [lines[i]];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,3})\s+/.test(lines[i].trim()) && !/^[-*]\s+/.test(lines[i].trim()) && !/^\d+\.\s+/.test(lines[i].trim())) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(<p key={key++} className="leading-relaxed my-2" style={{ color: C_TEXT_SOFT }}>{renderInline(para.join(' '))}</p>);
  }
  return <>{blocks}</>;
}

// ---------- 时辰 ----------
const HOUR_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: '子时（23:00-01:00）' },
  { value: 2, label: '丑时（01:00-03:00）' },
  { value: 4, label: '寅时（03:00-05:00）' },
  { value: 6, label: '卯时（05:00-07:00）' },
  { value: 8, label: '辰时（07:00-09:00）' },
  { value: 10, label: '巳时（09:00-11:00）' },
  { value: 12, label: '午时（11:00-13:00）' },
  { value: 14, label: '未时（13:00-15:00）' },
  { value: 16, label: '申时（15:00-17:00）' },
  { value: 18, label: '酉时（17:00-19:00）' },
  { value: 20, label: '戌时（19:00-21:00）' },
  { value: 22, label: '亥时（21:00-23:00）' },
  { value: -1, label: '⏳ 时间不详' },
];

// ---------- 卡片元数据 ----------
const FREE_CARD_META: { key: keyof LifeCodeReport['free']; icon: string; subtitle: string }[] = [
  { key: 'origin',       icon: '🧬', subtitle: '日干人格 · 你的底色' },
  { key: 'personality',  icon: '🎭', subtitle: '性格解码 · 优势与盲区' },
  { key: 'relationship', icon: '💞', subtitle: '关系匹配 · 灵魂伴侣画像' },
  { key: 'potential',    icon: '✨', subtitle: '天赋潜力 · 最佳工作环境' },
  { key: 'whisper',      icon: '🌙', subtitle: '灵魂低语 · 一句话点题' },
];

const PAID_CARD_META: { key: keyof LifeCodeReport['paid']; icon: string; preview: string }[] = [
  { key: 'growth',     icon: '🌱', preview: '基于 10 种人格的 3 阶段成长路线 + 5 本必读书 + 3 个习惯' },
  { key: 'soulmate',   icon: '💞', preview: '3 类高匹配伴侣 + 3 类避雷类型 + 7 个识别问题清单' },
  { key: 'careerPath', icon: '🛤️', preview: '未来 3 年事业节奏 + 5 个细分赛道 + 创业/打工取舍' },
  { key: 'lifeSeason', icon: '🍂', preview: '人生"春夏秋冬"分布图 · 哪 10 年播种、收获、蛰伏' },
  { key: 'threeSteps', icon: '🎯', preview: '明早 / 本周 / 本月可立刻执行的 3 步觉醒清单' },
];

// ============================================================
// AI 天赋觉醒心法（Dify 润色结果）
// ============================================================
function PolishSection({ polished, source, streaming }: { polished: string; source: string; streaming?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div
      className={`${glassStrong} p-5 shadow-2xl`}
      style={{
        boxShadow: '0 0 30px rgba(124,58,237,0.18), 0 0 60px rgba(56,189,248,0.10)',
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🌌</span>
          <span
            className="text-base font-bold"
            style={{ color: C_PURPLE_SOFT, fontFamily: FONT_KAI }}
          >
            AI 天赋觉醒 · Dify 成长顾问润色
          </span>
          {streaming ? (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded text-white animate-pulse"
              style={{ backgroundColor: C_PURPLE }}
            >
              ✨ AI 正在撰写…
            </span>
          ) : (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: source === 'dify' ? '#16a34a' : '#9ca3af' }}
            >
              {source === 'dify' ? 'Dify' : '本地模板'}
            </span>
          )}
        </div>
        <span className="text-xs" style={{ color: C_TEXT_DIM }}>{open ? '收起 ▴' : '展开 ▾'}</span>
      </button>
      {open && (
        <div className="mt-3 text-sm" style={{ fontFamily: FONT_KAI }}>
          {polished ? (
            <MiniMarkdown text={polished} />
          ) : (
            <div className="flex items-center gap-2 italic py-4" style={{ color: C_TEXT_DIM }}>
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: C_PURPLE_SOFT }} />
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: C_PURPLE_SOFT, animationDelay: '0.2s' }} />
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: C_PURPLE_SOFT, animationDelay: '0.4s' }} />
              <span className="ml-2">AI 正在为你推演本年节奏…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 付费墙（5 锁定卡 + 价格 + 信任）
// ============================================================
function LifeCodePaywall({
  report,
  userRole,
  premiumSections,
  reportKey,
}: {
  report: LifeCodeReport;
  userRole: UserRole;
  premiumSections: string[];
  reportKey: string;
}) {
  const isPaid = userRole === 'member' || userRole === 'admin';

  if (isPaid) {
    return (
      <div className="space-y-3">
        {PAID_CARD_META.map((meta, i) => {
          const card = report.paid[meta.key];
          return (
            <div
              key={meta.key}
              className={`${glassStrong} p-4`}
              style={{
                borderColor: 'rgba(52,211,153,0.4)',
                boxShadow: '0 0 18px rgba(52,211,153,0.12)',
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl border"
                  style={{ backgroundColor: 'rgba(52,211,153,0.15)', color: '#34d399', borderColor: 'rgba(52,211,153,0.3)' }}
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: '#059669', fontFamily: FONT_KAI }}
                    >
                      深度 {i + 1}
                    </span>
                    <h3
                      className="text-base font-bold"
                      style={{ color: C_PURPLE_SOFT, fontFamily: FONT_KAI }}
                    >
                      {card.title}
                    </h3>
                  </div>
                  <p
                    className="mt-2 text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: C_TEXT_SOFT, fontFamily: FONT_KAI }}
                  >
                    {card.content}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PAID_CARD_META.map((meta, i) => (
          // LockedCard 是 wealth-report 通用组件（米色），改为本地深色玻璃版
          <div
            key={meta.key}
            className={`${glass} p-4 border-dashed relative overflow-hidden`}
            style={{ borderColor: 'rgba(167,139,250,0.35)' }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'repeating-linear-gradient(135deg, transparent 0 8px, rgba(167,139,250,0.18) 8px 9px)',
              }}
            />
            <div className="flex items-start gap-3 relative">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl border"
                style={{ backgroundColor: 'rgba(124,58,237,0.15)', color: C_PURPLE_SOFT, borderColor: 'rgba(124,58,237,0.3)' }}
              >
                {meta.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                    style={{ backgroundColor: C_PURPLE, fontFamily: FONT_KAI }}
                  >
                    深度 {i + 1}
                  </span>
                  <h3 className="text-base font-bold" style={{ color: C_PURPLE_SOFT, fontFamily: FONT_KAI }}>
                    {report.paid[meta.key].title}
                  </h3>
                </div>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: C_PURPLE_SOFT, opacity: 0.85, fontFamily: FONT_KAI }}>
                  🔒 {meta.preview}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`${glassStrong} p-5 shadow-2xl`}
        style={{
          boxShadow: '0 0 40px rgba(124,58,237,0.25), 0 0 80px rgba(56,189,248,0.12)',
        }}
      >
        <div className="text-center mb-4">
          <h3
            className="text-xl font-bold mb-1"
            style={{ fontFamily: FONT_KAI, color: C_PURPLE_SOFT }}
          >
            🔮 解锁 5 大深度模块
          </h3>
          <p
            className="text-sm"
            style={{ fontFamily: FONT_KAI, color: C_TEXT_SOFT }}
          >
            覆盖成长路线 · 灵魂伴侣 · 事业方向 · 人生季节 · 3 步觉醒
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-3 text-center"
            style={{ fontFamily: FONT_KAI }}
          >
            <div className="text-xs" style={{ color: C_TEXT_SOFT }}>单次解锁</div>
            <div className="text-2xl font-bold mt-1 text-white">¥9.9</div>
            <div className="text-[10px] mt-0.5" style={{ color: C_TEXT_DIM }}>仅限本报告</div>
          </div>
          <div
            className="bg-white/10 backdrop-blur-md border-2 rounded-lg p-3 text-center relative"
            style={{ borderColor: C_PURPLE, boxShadow: '0 0 18px rgba(124,58,237,0.45)' }}
          >
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: C_PURPLE, fontFamily: FONT_KAI }}
            >
              推荐
            </div>
            <div className="text-xs" style={{ color: C_TEXT_SOFT, fontFamily: FONT_KAI }}>月度会员</div>
            <div className="text-2xl font-bold mt-1 text-white">¥39</div>
            <div className="text-[10px] mt-0.5" style={{ color: C_TEXT_DIM, fontFamily: FONT_KAI }}>全站 6 大模块全解锁</div>
          </div>
        </div>

        <ReportPaywall
          userRole={userRole}
          freePart=""
          premiumPart={premiumSections.join('\n')}
          premiumSections={premiumSections}
          reportKey={reportKey}
          accentClass="text-purple-300"
        />

        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px]" style={{ color: C_TEXT_SOFT }}>
          <div>
            <div className="text-base">🛡️</div>
            <div style={{ fontFamily: FONT_KAI }}>支付由 Stripe 保障</div>
          </div>
          <div>
            <div className="text-base">🔒</div>
            <div style={{ fontFamily: FONT_KAI }}>八字数据本地计算</div>
          </div>
          <div>
            <div className="text-base">↩️</div>
            <div style={{ fontFamily: FONT_KAI }}>7 天无理由退款</div>
          </div>
        </div>
      </div>

      <p
        className="text-center text-xs mt-2"
        style={{ fontFamily: FONT_KAI, color: C_TEXT_DIM }}
      >
        🌠 明天的运势会自动更新，明天记得来查看哦。
      </p>

      {/* 导出 PDF */}
      <div className="pt-4 text-center">
        <ExportPDFButton
          targetId="lifecode-report"
          filename={`数字修行报告-${report.input.name || '匿名'}`}
          tone="purple"
        />
      </div>
    </div>
  );
}

// ============================================================
// 报告主区
// ============================================================
function LifeCodeReportView({
  report,
  userRole,
  polished,
  polishSource,
  polishLoading,
  onPolish,
}: {
  report: LifeCodeReport;
  userRole: UserRole;
  polished: string;
  polishSource: string;
  polishLoading: boolean;
  onPolish: () => void;
}) {
  return (
    <div id="lifecode-report" className="space-y-5">
      {/* 头部：评分 + 八字摘要 */}
      <div className={`${glassStrong} p-5 shadow-2xl`}>
        <div className="flex flex-col md:flex-row gap-5 items-center">
          <div
            className="rounded-xl p-2"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 0 24px rgba(124,58,237,0.25)',
            }}
          >
            <LifeCodeScoreGauge
              score={report.score}
              label={
                report.score >= 85 ? '极佳 · 顺势觉醒'
                : report.score >= 70 ? '较佳 · 稳步前行'
                : report.score >= 50 ? '中等 · 厚积薄发'
                : '偏弱 · 宜内观沉淀'
              }
            />
          </div>
          <div className="flex-1 w-full">
            <div className="text-center md:text-left mb-3">
              <div className="text-2xl mb-1">🌌</div>
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: FONT_KAI }}
              >
                {report.input.name} · 生命密码报告
              </h2>
              <p
                className="text-sm mt-1"
                style={{ fontFamily: FONT_KAI, color: C_TEXT_SOFT }}
              >
                <span style={{ color: C_PURPLE_SOFT }}>核心人格 {report.coreCode.label} · {report.coreCode.personality}</span>
                <span className="mx-2" style={{ color: C_TEXT_DIM }}>|</span>
                日柱 {report.bazi.dayGanzhi}（属{report.bazi.dayElement}）
                <span className="mx-2" style={{ color: C_TEXT_DIM }}>|</span>
                阳历 {report.bazi.solarDate}
              </p>
            </div>
            <LifeCodeSummaryBar
              items={[
                { label: '日柱',     value: report.bazi.dayGanzhi,                          variant: 'purple' },
                { label: '日干五行', value: report.bazi.dayElement,                         variant: 'cyan' },
                { label: '核心人格', value: report.coreCode.label,                          variant: 'purple' },
                { label: '出生季节', value: report.seasonType.type,                         variant: 'cyan' },
                { label: '本年流年', value: report.currentYearAdvice.yearGanzhi,            variant: 'purple' },
                { label: '关系类型', value: report.currentYearAdvice.relation,              variant: 'cyan' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* AI 润色 */}
      {polished || polishLoading ? (
        <PolishSection polished={polished} source={polishSource} streaming={polishLoading} />
      ) : (
        <div className="text-center">
          <div className="relative inline-block">
            {/* 呼吸光环（提示可点击）*/}
            <BreathRing />
            <button
              onClick={onPolish}
              disabled={polishLoading}
              className="relative px-6 py-3 rounded-xl text-white font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#6d28d9] hover:to-[#9333ea]"
              style={{
                fontFamily: FONT_KAI,
                boxShadow: '0 0 22px rgba(124,58,237,0.45)',
              }}
            >
              {polishLoading ? '🌌 AI 觉醒中…' : '🌌 召唤 AI 天赋觉醒心法（基于 Dify 润色 · 免费体验）'}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ fontFamily: FONT_KAI, color: C_TEXT_DIM }}>
            AI 会基于你的日干人格 + 季节能量 + 本年流年，给出一份 500-700 字的天赋觉醒指南
          </p>
        </div>
      )}

      {/* 免费 5 大模块（依次滑入）*/}
      <div>
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h3
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: C_PURPLE_SOFT, fontFamily: FONT_KAI }}
          >
            <span>🎁</span>
            <span>免费 5 大模块</span>
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full border"
            style={{
              backgroundColor: 'rgba(52,211,153,0.15)',
              color: '#34d399',
              borderColor: 'rgba(52,211,153,0.3)',
              fontFamily: FONT_KAI,
            }}
          >
            立即可读
          </span>
        </div>
        <div className="space-y-3">
          {FREE_CARD_META.map((meta, i) => {
            const c = report.free[meta.key];
            return (
              <LifeCodeFreeCard
                key={meta.key}
                index={i}
                icon={meta.icon}
                subtitle={meta.subtitle}
                title={c.title}
                content={c.content}
                delayMs={i * 100}  // 0/100/200/300/400 ms 依次滑入
              />
            );
          })}
        </div>
      </div>

      {/* 付费墙 / 5 张深度模块 */}
      <div>
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h3
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: C_PURPLE_SOFT, fontFamily: FONT_KAI }}
          >
            <span>🔒</span>
            <span>5 大深度模块</span>
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'rgba(124,58,237,0.18)',
              color: C_PURPLE_SOFT,
              border: '1px solid rgba(124,58,237,0.3)',
              fontFamily: FONT_KAI,
            }}
          >
            会员 / 单解锁
          </span>
        </div>
        <LifeCodePaywall
          report={report}
          userRole={userRole}
          premiumSections={[
            report.paid.growth.title,
            report.paid.soulmate.title,
            report.paid.careerPath.title,
            report.paid.lifeSeason.title,
            report.paid.threeSteps.title,
          ]}
          reportKey="lifecode"
        />
      </div>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
interface LifeCodePageClientProps {
  userRole: UserRole;
}

export default function LifeCodePageClient({ userRole }: LifeCodePageClientProps) {
  const [form, setForm] = useState({
    name: '',
    gender: 'female' as 'female' | 'male',
    birthDate: '',
    birthHour: 12,
    calendarType: 'solar' as 'solar' | 'lunar',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [report, setReport] = useState<LifeCodeReport | null>(null);

  const [polishing, setPolishing] = useState(false);
  const [polished, setPolished] = useState('');
  const [polishSource, setPolishSource] = useState('');

  // —— 组件 mount / unmount 埋点 ——
  useEffect(() => {
    lcLog('LifeCodePageClient mounted', { userRole: userRole ?? 'guest' });
    return () => lcLog('LifeCodePageClient unmounted');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // —— 报告首次出现埋点 ——
  useEffect(() => {
    if (report) {
      lcLog('report state set', {
        keys: Object.keys(report),
        freeCount: Object.keys(report.free ?? {}).length,
      });
    }
  }, [report]);

  // —— Dify 流式首 token / 结束埋点（ref 避免闭包陈旧） ——
  const polishFirstTokenLoggedRef = useRef(false);
  const polishStartedAtRef = useRef<number | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const t0 = performance.now();
    lcLog('handleSubmit start', { name: form.name, gender: form.gender });
    setLoading(true);
    setErrorMsg('');
    setReport(null);
    setPolished('');
    setPolishSource('');
    try {
      const fetchStart = performance.now();
      const res = await fetch('/api/lifecode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          birthHour: form.birthHour === -1 ? 12 : form.birthHour,
        }),
      });
      lcLog('handleSubmit /api/lifecode response received', {
        status: res.status,
        networkMs: (performance.now() - fetchStart).toFixed(2),
      });
      const json = await res.json();
      lcLog('handleSubmit /api/lifecode JSON parsed', {
        success: json.success,
        parseMs: (performance.now() - fetchStart).toFixed(2),
      });
      if (!json.success) {
        setErrorMsg(json.error || '生成报告失败');
        return;
      }
      setReport(json.data as LifeCodeReport);
      lcLog('handleSubmit setReport committed', {
        totalMs: (performance.now() - t0).toFixed(2),
      });
      setTimeout(() => {
        document.getElementById('lifecode-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        lcLog('handleSubmit scrollIntoView dispatched');
      }, 100);
    } catch (err) {
      lcLog('handleSubmit error', { msg: err instanceof Error ? err.message : String(err) });
      setErrorMsg(err instanceof Error ? err.message : '网络异常');
    } finally {
      setLoading(false);
      lcLog('handleSubmit end', { totalMs: (performance.now() - t0).toFixed(2) });
    }
  };

  const handlePolish = async () => {
    const t0 = performance.now();
    let sawEnd = false; // 提到外层供 finally 读取
    polishStartedAtRef.current = t0;
    polishFirstTokenLoggedRef.current = false;
    lcLog('handlePolish start (Dify stream)', { polishedBytes: polished.length });
    setPolishing(true);
    setPolished('');
    setPolishSource('streaming');
    setErrorMsg('');

    try {
      const res = await fetch('/api/lifecode/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          birthHour: form.birthHour === -1 ? 12 : form.birthHour,
        }),
      });

      const contentType = res.headers.get('content-type') || '';

      // —— 分支 A：SSE 流式 ——
      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let acc = '';
        let sawEnd = false;
        let lastError = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf('\n\n')) !== -1) {
            const rawEvent = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);

            for (const line of rawEvent.split('\n')) {
              if (!line.startsWith('data:')) continue;
              const payload = line.slice(5).trim();
              if (!payload || payload === '[DONE]') {
                sawEnd = true;
                continue;
              }
              try {
                const obj = JSON.parse(payload);
                if (obj.event === 'message' && typeof obj.answer === 'string') {
                  acc += obj.answer;
                  if (!polishFirstTokenLoggedRef.current) {
                    polishFirstTokenLoggedRef.current = true;
                    lcLog('Dify first token received', {
                      ttftMs: polishStartedAtRef.current
                        ? (performance.now() - polishStartedAtRef.current).toFixed(2)
                        : 'n/a',
                      chunkBytes: obj.answer.length,
                    });
                  }
                  setPolished(acc);
                } else if (obj.event === 'message_end') {
                  sawEnd = true;
                  if (obj.metadata?.fallback) {
                    setPolishSource('local-template');
                    lastError = obj.metadata.error || '';
                  } else {
                    setPolishSource('dify');
                  }
                } else if (obj.event === 'error') {
                  lastError = obj.message || '流式错误';
                }
              } catch { /* ignore */ }
            }
          }
        }
        if (lastError) console.warn('[lifecode] polish stream error:', lastError);
        return;
      }

      // —— 分支 B：JSON 降级 ——
      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.error || '润色失败');
        return;
      }
      setPolished(json.polished || '');
      setPolishSource(json.source || 'local-template');
      lcLog('handlePolish ended (JSON fallback path)', {
        totalMs: polishStartedAtRef.current
          ? (performance.now() - polishStartedAtRef.current).toFixed(2)
          : 'n/a',
        bytes: (json.polished || '').length,
      });
    } catch (err) {
      lcLog('handlePolish error', { msg: err instanceof Error ? err.message : String(err) });
      setErrorMsg(err instanceof Error ? err.message : '网络异常');
    } finally {
      setPolishing(false);
      lcLog('handlePolish stream end', {
        totalMs: polishStartedAtRef.current
          ? (performance.now() - polishStartedAtRef.current).toFixed(2)
          : 'n/a',
        firstTokenHit: polishFirstTokenLoggedRef.current,
        sawEnd,
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-gradient-to-b from-[#0a0a1a] via-[#161830] to-[#1a1c2e] text-white">
      {/* 极淡紫色径向光晕（背景氛围，不干扰交互）*/}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[260px] -translate-x-1/2 w-[680px] h-[680px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(56,189,248,0.06) 40%, transparent 70%)',
          filter: 'blur(100px)',
        }}
      />
      <main className="relative max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 pb-32 z-10">
        {/* 标题区 */}
        <div className="text-center mb-8 pt-4">
          <div className="text-5xl mb-2">🌌</div>
          <h1
            className="text-3xl font-bold mb-3"
            style={{ color: C_PURPLE_SOFT, fontFamily: FONT_KAI }}
          >
            AI 生命密码 · 天赋觉醒
          </h1>
          <p
            className="text-sm italic"
            style={{ fontFamily: FONT_KAI, color: C_TEXT_SOFT }}
          >
            「知命，是为了更好地活出自己。<br />
            你不必向命运妥协，只需看懂命运的剧本。」
          </p>
          <div className="mt-4 text-xs tracking-widest" style={{ color: C_TEXT_DIM }}>
            ✦  ✦  ✦
          </div>
        </div>

        {/* 欢迎语 */}
        <div className={`${glass} p-6 mb-6 text-center`}>
          <p
            className="text-lg"
            style={{ fontFamily: FONT_KAI, color: C_TEXT }}
          >
            不讲<strong style={{ color: C_PURPLE_SOFT }}>「你命好/命不好」</strong>这种二元判断，给你一份基于日干人格的<strong style={{ color: C_PURPLE_SOFT }}>个人成长地图</strong>。
          </p>
        </div>

        {/* 输入区 */}
        <form
          onSubmit={handleSubmit}
          className={`${glassStrong} shadow-2xl p-6 mb-6`}
        >
          <h2
            className="text-lg font-bold mb-4 text-white"
            style={{ fontFamily: FONT_KAI }}
          >
            🌌 请填写您的信息
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 border border-purple-400/20 rounded-xl bg-purple-500/5 backdrop-blur-sm">
              <h3
                className="text-base font-bold text-white mb-3"
                style={{ fontFamily: FONT_KAI }}
              >
                🧬 您的先天格局
              </h3>

              <div className="mb-3">
                <label className="block text-xs mb-1" style={{ fontFamily: FONT_KAI, color: C_TEXT_SOFT }}>姓名 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  maxLength={20}
                  required
                  className="w-full px-3 py-2 rounded-lg focus:outline-none text-sm text-white placeholder:text-gray-400 border border-white/20 bg-white/10 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                  style={{ fontFamily: FONT_KAI }}
                  placeholder="请输入姓名"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs mb-1" style={{ fontFamily: FONT_KAI, color: C_TEXT_SOFT }}>性别 *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1 text-sm cursor-pointer" style={{ color: C_TEXT_SOFT, fontFamily: FONT_KAI }}>
                    <input
                      type="radio"
                      value="female"
                      checked={form.gender === 'female'}
                      onChange={() => setForm({ ...form, gender: 'female' })}
                      className="accent-purple-500"
                    />
                    <span>女</span>
                  </label>
                  <label className="flex items-center gap-1 text-sm cursor-pointer" style={{ color: C_TEXT_SOFT, fontFamily: FONT_KAI }}>
                    <input
                      type="radio"
                      value="male"
                      checked={form.gender === 'male'}
                      onChange={() => setForm({ ...form, gender: 'male' })}
                      className="accent-purple-500"
                    />
                    <span>男</span>
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs mb-1" style={{ fontFamily: FONT_KAI, color: C_TEXT_SOFT }}>出生日期 *</label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={e => setForm({ ...form, birthDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg focus:outline-none text-sm text-white placeholder:text-gray-400 border border-white/20 bg-white/10 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                  style={{ fontFamily: FONT_KAI, colorScheme: 'dark' }}
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs mb-1" style={{ fontFamily: FONT_KAI, color: C_TEXT_SOFT }}>出生时辰</label>
                <select
                  value={form.birthHour}
                  onChange={e => setForm({ ...form, birthHour: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none text-sm text-white placeholder:text-gray-400 border border-white/20 bg-white/10 focus:border-purple-400 focus:ring-1 focus:ring-purple-400"
                  style={{ fontFamily: FONT_KAI, colorScheme: 'dark' }}
                >
                  {HOUR_OPTIONS.map(h => (
                    <option key={h.value} value={h.value} style={{ backgroundColor: '#1a1c2e', color: '#fff' }}>{h.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs mb-1" style={{ fontFamily: FONT_KAI, color: C_TEXT_SOFT }}>历法 *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1 text-sm cursor-pointer" style={{ color: C_TEXT_SOFT, fontFamily: FONT_KAI }}>
                    <input
                      type="radio"
                      value="solar"
                      checked={form.calendarType === 'solar'}
                      onChange={() => setForm({ ...form, calendarType: 'solar' })}
                      className="accent-purple-500"
                    />
                    <span>阳历</span>
                  </label>
                  <label className="flex items-center gap-1 text-sm cursor-pointer" style={{ color: C_TEXT_SOFT, fontFamily: FONT_KAI }}>
                    <input
                      type="radio"
                      value="lunar"
                      checked={form.calendarType === 'lunar'}
                      onChange={() => setForm({ ...form, calendarType: 'lunar' })}
                      className="accent-purple-500"
                    />
                    <span>农历</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 border border-cyan-400/20 rounded-xl bg-cyan-500/5 backdrop-blur-sm">
              <h3
                className="text-base font-bold text-white mb-3"
                style={{ fontFamily: FONT_KAI }}
              >
                🌠 您的内在星空
              </h3>

              <p
                className="text-sm leading-relaxed"
                style={{ fontFamily: FONT_KAI, color: C_TEXT_SOFT }}
              >
                你填写的信息会用来推算：
              </p>
              <ul
                className="mt-2 text-sm list-disc pl-5 space-y-1"
                style={{ fontFamily: FONT_KAI, color: C_TEXT_SOFT }}
              >
                <li>你的<strong style={{ color: C_PURPLE_SOFT }}>日干人格</strong>（10 种核心人格）</li>
                <li>你的<strong style={{ color: C_CYAN_SOFT }}>出生季节</strong>（春/夏/秋/冬的能量底色）</li>
                <li>你的<strong style={{ color: C_PURPLE_SOFT }}>本年流年</strong>（2026 丙午年 vs 日干的关系）</li>
                <li>一份<strong style={{ color: C_CYAN_SOFT }}>个人成长地图</strong>（基于"觉醒顾问"风格）</li>
              </ul>

              <div
                className="mt-6 p-3 rounded-lg text-sm border border-purple-400/20 bg-purple-500/5"
                style={{ color: C_PURPLE_SOFT, fontFamily: FONT_KAI }}
              >
                💡 <strong>我们不预测未来</strong>，<br />
                我们帮你<strong style={{ color: C_CYAN_SOFT }}>看见自己</strong>。<br />
                知道你是谁，比知道会发生什么更重要。
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full text-white py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 bg-gradient-to-r from-[#7c3aed] to-[#a78bfa] hover:from-[#6d28d9] hover:to-[#9333ea]"
            style={{
              fontFamily: FONT_KAI,
              boxShadow: '0 0 24px rgba(124,58,237,0.45)',
            }}
          >
            {loading ? '⏳ 推算中…' : '🌌 生成我的生命密码报告'}
          </button>

          {errorMsg && (
            <p
              className="text-sm text-red-300 text-center mt-2"
              style={{ fontFamily: FONT_KAI }}
            >
              {errorMsg}
            </p>
          )}
        </form>

        {/* 报告区 */}
        {report && (
          <LifeCodeReportView
            report={report}
            userRole={userRole}
            polished={polished}
            polishSource={polishSource}
            polishLoading={polishing}
            onPolish={handlePolish}
          />
        )}
      </main>
    </div>
  );
}
