// ============================================================
// HousePageClient —— 家居环境 · 空间能量诊断
// 配色：大地色 / 原木色（#cda87c 主 + #8b6a42 辅）
// 复用：ScoreGauge / FreeCard / LockedCard / ReportPaywall
// ============================================================

'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import ScoreGauge from '@/components/wealth-report/ScoreGauge';
import FreeCard from '@/components/wealth-report/FreeCard';
import LockedCard from '@/components/wealth-report/LockedCard';
import ReportPaywall from '@/components/ReportPaywall';
import type { UserRole } from '@/lib/auth';

// —— 主题色 ——
const THEME_PRIMARY = '#cda87c';   // 主色 · 大地色/原木色
const THEME_SECONDARY = '#8b6a42'; // 辅色 · 深原木
const THEME_BG_SOFT = '#f5ede0';   // 卡片底色
const THEME_BG_DARK = '#3a2e1f';   // 深底色
const FONT_KAI = "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif";

// —— 8 方位（与 house-rules 同步）——
type DirectionKey = 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest' | 'north' | 'northeast';
const DIRECTIONS: Array<{ key: DirectionKey; cn: string; pinyin: string; angle: number }> = [
  { key: 'east',      cn: '东',   pinyin: 'E',   angle: 0 },
  { key: 'southeast', cn: '东南', pinyin: 'SE',  angle: 45 },
  { key: 'south',     cn: '南',   pinyin: 'S',   angle: 90 },
  { key: 'southwest', cn: '西南', pinyin: 'SW',  angle: 135 },
  { key: 'west',      cn: '西',   pinyin: 'W',   angle: 180 },
  { key: 'northwest', cn: '西北', pinyin: 'NW',  angle: 225 },
  { key: 'north',     cn: '北',   pinyin: 'N',   angle: 270 },
  { key: 'northeast', cn: '东北', pinyin: 'NE',  angle: 315 },
];

// —— 类型 ——
interface HouseReport {
  success: true;
  input: { name: string; gender: 'male' | 'female'; birthYear: number; doorDirection: DirectionKey; area: number; familyStructure: string };
  guaNumber: number;
  guaCn: string;
  guaElement: string;
  guaGroup: 'east' | 'west';
  guaMethod: string;
  doorCn: string;
  doorIsGood: boolean;
  doorGoodLevel: number | null;
  doorBadLevel: number | null;
  goodDirections: Array<{ key: string; cn: string; pinyin: string; level: number; levelName: string; meaning: string }>;
  badDirections: Array<{ key: string; cn: string; pinyin: string; level: number; levelName: string; meaning: string }>;
  score: number;
  free: { gua: { title: string; content: string }; goodDir: { title: string; content: string }; badDir: { title: string; content: string }; door: { title: string; content: string }; harmony: { title: string; content: string } };
  paid: { remedy: { title: string; content: string }; yearEnergy: { title: string; content: string }; empower: { title: string; content: string } };
  meta: { generatedAt: string; engine: string };
}

interface FormState {
  name: string;
  gender: 'male' | 'female';
  birthYear: string;
  doorDirection: DirectionKey | null;
  area: string;
  familyStructure: 'single' | 'couple' | 'family-kids' | 'three-gen' | 'elderly';
}

// ============================================================
// 交互式 SVG 罗盘
// ============================================================
function CompassPicker({ value, onChange }: { value: DirectionKey | null; onChange: (k: DirectionKey) => void }) {
  const cx = 110, cy = 110, rOuter = 100, rInner = 35;

  // 把方向角度转成 SVG 路径扇区
  // SVG 0° 在 3 点钟方向；我们让"东"在右上，所以角度需要偏移 +45
  const polarToCartesian = (angleDeg: number, radius: number) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(angleRad), y: cy + radius * Math.sin(angleRad) };
  };

  return (
    <div className="flex flex-col items-center">
      <svg width="220" height="220" viewBox="0 0 220 220" className="drop-shadow-md">
        {/* 外圈 + 内圈底色 */}
        <circle cx={cx} cy={cy} r={rOuter} fill="#fff" stroke={THEME_PRIMARY} strokeWidth="3" />
        <circle cx={cx} cy={cy} r={rInner} fill={THEME_BG_SOFT} stroke={THEME_SECONDARY} strokeWidth="2" />
        <circle cx={cx} cy={cy} r="3" fill={THEME_SECONDARY} />

        {/* 8 方向扇区 */}
        {DIRECTIONS.map((dir) => {
          const a1 = dir.angle - 22.5;
          const a2 = dir.angle + 22.5;
          const p1 = polarToCartesian(a1, rOuter);
          const p2 = polarToCartesian(a2, rOuter);
          const p3 = polarToCartesian(a2, rInner);
          const p4 = polarToCartesian(a1, rInner);
          const largeArc = 0;
          const path = [
            `M ${p1.x} ${p1.y}`,
            `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
            `L ${p3.x} ${p3.y}`,
            `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
            'Z',
          ].join(' ');
          const isSelected = value === dir.key;
          return (
            <g key={dir.key} className="cursor-pointer" onClick={() => onChange(dir.key)}>
              <path
                d={path}
                fill={isSelected ? THEME_PRIMARY : (dir.key === 'south' ? '#fef3c7' : '#fff')}
                stroke={THEME_SECONDARY}
                strokeWidth="1.2"
                opacity={isSelected ? 1 : 0.95}
                className="transition-all hover:fill-amber-200"
              />
              <text
                x={polarToCartesian(dir.angle, (rOuter + rInner) / 2).x}
                y={polarToCartesian(dir.angle, (rOuter + rInner) / 2).y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight={isSelected ? '700' : '500'}
                fill={isSelected ? '#fff' : THEME_SECONDARY}
                style={{ fontFamily: FONT_KAI }}
                className="pointer-events-none select-none"
              >
                {dir.cn}
              </text>
            </g>
          );
        })}

        {/* 罗盘中心标签 */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="11"
          fill={THEME_SECONDARY}
          style={{ fontFamily: FONT_KAI }}
        >
          {value ? `朝${DIRECTIONS.find(d => d.key === value)!.cn}` : '大门朝向'}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fill="#a08a6c"
          style={{ fontFamily: FONT_KAI }}
        >
          {value ? '点击其他方位切换' : '点击选择'}
        </text>
      </svg>
      <p className="text-xs text-amber-700 mt-1" style={{ fontFamily: FONT_KAI }}>
        🧭 八方位罗盘 · 点击选择大门/主阳台朝向
      </p>
    </div>
  );
}

// ============================================================
// 命卦摘要条（代替 BaziSummaryBar）
// ============================================================
function GuaSummaryBar({ report }: { report: HouseReport }) {
  const items: Array<{ label: string; value: string; icon: string }> = [
    { label: '命卦', value: `${report.guaCn}卦（${report.guaElement}）`, icon: '☯' },
    { label: '所属', value: report.guaGroup === 'east' ? '东四命' : '西四命', icon: '🧭' },
    { label: '大门', value: `${report.doorCn}方（${report.doorIsGood ? '吉' : '凶'}）`, icon: '🚪' },
    { label: '首吉方', value: report.goodDirections[0]?.cn || '-', icon: '✨' },
    { label: '首凶方', value: report.badDirections[0]?.cn || '-', icon: '⚠️' },
  ];
  return (
    <div className="rounded-xl border-2 p-3 shadow-sm" style={{ borderColor: THEME_PRIMARY, background: `linear-gradient(135deg, ${THEME_BG_SOFT}, #fff)` }}>
      <div className="flex flex-wrap gap-2 justify-around text-center">
        {items.map((it, i) => (
          <div key={i} className="min-w-[80px]">
            <div className="text-[10px] text-amber-800 flex items-center justify-center gap-1" style={{ fontFamily: FONT_KAI }}>
              <span>{it.icon}</span>
              <span>{it.label}</span>
            </div>
            <div className="text-sm font-bold mt-0.5" style={{ color: THEME_SECONDARY, fontFamily: FONT_KAI }}>{it.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 付费墙下方的小字提示
// ============================================================
function RetentionHint() {
  return (
    <p className="text-[11px] text-amber-700 italic mt-3 text-center" style={{ fontFamily: FONT_KAI }}>
      🪴 明年的家宅气运会自动更新，明年记得来查看哦。
    </p>
  );
}

// ============================================================
// AI 流式润色区（仿 LifeCodePageClient 写法）
// ============================================================
function PolishSection({ polished, source, streaming }: { polished: string; source: string; streaming?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border p-5 shadow-lg" style={{ borderColor: THEME_PRIMARY, background: `linear-gradient(135deg, ${THEME_BG_SOFT}, #fff7e8)` }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🪴</span>
          <span className="text-base font-bold" style={{ color: THEME_SECONDARY, fontFamily: FONT_KAI }}>
            空间能量觉醒 · Dify 空间顾问润色
          </span>
          {streaming ? (
            <span className="text-[10px] px-1.5 py-0.5 rounded text-white animate-pulse" style={{ backgroundColor: THEME_PRIMARY }}>
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
        <span className="text-xs text-amber-700">{open ? '收起 ▴' : '展开 ▾'}</span>
      </button>
      {open && (
        <div className="mt-3 text-sm whitespace-pre-wrap text-amber-900" style={{ fontFamily: FONT_KAI }}>
          {polished ? polished : (
            <div className="flex items-center gap-2 text-amber-700 italic py-4">
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME_PRIMARY }} />
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME_PRIMARY, animationDelay: '0.2s' }} />
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME_PRIMARY, animationDelay: '0.4s' }} />
              <span className="ml-2">AI 正在为你的家推演能量地图…</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 报告主区
// ============================================================
function HouseReportView({
  report,
  userRole,
  onPolish,
  polishing,
  polished,
  polishSource,
}: {
  report: HouseReport;
  userRole: UserRole;
  onPolish: () => void;
  polishing: boolean;
  polished: string;
  polishSource: string;
}) {
  // 5 张免费卡的元数据
  const freeMeta = [
    { key: 'gua',      meta: { icon: '☯',  subtitle: '命理总览',     tone: THEME_SECONDARY } },
    { key: 'goodDir',  meta: { icon: '✨', subtitle: '4 大吉方',     tone: '#16a34a' } },
    { key: 'badDir',   meta: { icon: '⚠️', subtitle: '4 大凶方',     tone: '#b91c1c' } },
    { key: 'door',     meta: { icon: '🚪', subtitle: '大门方位诊断', tone: THEME_PRIMARY } },
    { key: 'harmony',  meta: { icon: '👨‍👩‍👧', subtitle: '家庭和谐度',  tone: THEME_SECONDARY } },
  ] as const;

  // 3 张付费卡的元数据
  const paidMeta = [
    { key: 'remedy',     meta: { icon: '🛡️', preview: '大门凶方的 3 步化解 + 入门化煞绿植清单 + 玄关镜/门槛石方案', tone: THEME_PRIMARY } },
    { key: 'yearEnergy', meta: { icon: '📅', preview: '本年五运 + 您命卦的相生相克 + 重点布置的核心区域', tone: THEME_SECONDARY } },
    { key: 'empower',    meta: { icon: '🌿', preview: '山水画 / 床头朝向 / 莲花灯 / 金边虎皮兰 一键赋能清单', tone: '#16a34a' } },
  ] as const;

  const isPaid = userRole === 'member' || userRole === 'admin';

  return (
    <div id="house-report" className="space-y-5">
      {/* 头部：评分 + 命卦摘要条 */}
      <div className="rounded-2xl shadow-2xl border p-5" style={{ background: `linear-gradient(135deg, ${THEME_BG_DARK}, ${THEME_SECONDARY})`, borderColor: THEME_PRIMARY }}>
        <div className="flex flex-col md:flex-row gap-5 items-center">
          <div className="bg-white/95 rounded-xl p-2">
            <ScoreGauge
              score={report.score}
              label={
                report.score >= 85 ? '极佳 · 家运昌盛' :
                report.score >= 70 ? '较佳 · 顺势调整' :
                report.score >= 50 ? '中等 · 化解可期' :
                '偏弱 · 重点化解'
              }
              themeColor={THEME_PRIMARY}
            />
          </div>
          <div className="flex-1 text-white">
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: FONT_KAI }}>
              {report.input.name} 的家宅空间能量诊断
            </h2>
            <GuaSummaryBar report={report} />
            <p className="text-xs text-amber-200 mt-2 leading-relaxed" style={{ fontFamily: FONT_KAI }}>
              {report.guaMethod} → 命卦 {report.guaCn}（属{report.guaElement}）→
              大门朝{report.doorCn}{report.doorIsGood ? '正在' : '正冲'}{report.doorGoodLevel || report.doorBadLevel ? `第 ${report.doorGoodLevel ?? report.doorBadLevel} 级` : ''}
              {report.doorIsGood ? '吉方' : '凶方'}。
            </p>
          </div>
        </div>
      </div>

      {/* AI 流式润色 */}
      {polished || polishing ? (
        <PolishSection polished={polished} source={polishSource} streaming={polishing} />
      ) : (
        <div className="text-center">
          <button
            onClick={onPolish}
            disabled={polishing}
            className="px-6 py-2.5 rounded-lg text-white font-semibold shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: `linear-gradient(135deg, ${THEME_PRIMARY}, ${THEME_SECONDARY})`, fontFamily: FONT_KAI }}
          >
            {polishing ? '🪴 AI 觉醒中…' : '🪴 召唤 AI 空间能量觉醒（基于 Dify 润色 · 免费体验）'}
          </button>
          <p className="text-xs text-amber-700 mt-2" style={{ fontFamily: FONT_KAI }}>
            AI 会基于你的命卦 + 大门方位 + 户型，给出一份 500-700 字的空间调整指南
          </p>
        </div>
      )}

      {/* 免费 5 大模块 */}
      <div>
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: THEME_SECONDARY, fontFamily: FONT_KAI }}>
            <span>🌿</span>
            <span>免费 · 5 大空间模块</span>
          </h3>
        </div>
        <div className="space-y-3">
          {freeMeta.map((fm, i) => {
            const card = report.free[fm.key];
            return (
              <FreeCard
                key={fm.key}
                index={i}
                meta={fm.meta}
                title={card.title}
                content={card.content}
              />
            );
          })}
        </div>
      </div>

      {/* 付费 3 大模块 + ReportPaywall */}
      <div>
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: THEME_SECONDARY, fontFamily: FONT_KAI }}>
            <span>🔒</span>
            <span>会员 · 3 大深度方案</span>
          </h3>
        </div>

        {isPaid ? (
          <div className="space-y-3">
            {paidMeta.map((pm, i) => {
              const card = report.paid[pm.key];
              return (
                <div key={pm.key} className="rounded-xl border-2 p-4 shadow-md" style={{ borderColor: '#34d399', background: 'linear-gradient(135deg, #064e3b, #022c22)' }}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-white/80">
                      {pm.meta.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#10b981', color: 'white', fontFamily: FONT_KAI }}>
                          会员 {i + 1}
                        </span>
                        <h4 className="text-base font-bold text-emerald-100" style={{ fontFamily: FONT_KAI }}>{card.title}</h4>
                      </div>
                      <p className="mt-2 text-sm text-emerald-50 leading-relaxed" style={{ fontFamily: FONT_KAI }}>{card.content}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            <RetentionHint />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {paidMeta.map((pm, i) => (
                <LockedCard key={pm.key} index={i} meta={pm.meta} title={report.paid[pm.key].title} />
              ))}
            </div>

            {/* 付费墙：把 3 张付费内容拼成 premiumPart */}
            <div className="mt-6">
              <ReportPaywall
                userRole={userRole}
                freePart=""
                premiumPart={paidMeta.map((pm, i) => `【${report.paid[pm.key].title}】\n${report.paid[pm.key].content}`).join('\n\n')}
                premiumSections={paidMeta.map(pm => report.paid[pm.key].title)}
                reportKey="house"
                accentClass="text-amber-700"
              />
            </div>

            <RetentionHint />
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// 主组件
// ============================================================
export default function HousePageClient({ userRole }: { userRole: UserRole }) {
  const currentYear = new Date().getFullYear();
  const [form, setForm] = useState<FormState>({
    name: '',
    gender: 'male',
    birthYear: '1990',
    doorDirection: null,
    area: '90',
    familyStructure: 'couple',
  });
  const [loading, setLoading] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [polished, setPolished] = useState('');
  const [polishSource, setPolishSource] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [report, setReport] = useState<HouseReport | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!form.doorDirection) {
      setErrorMsg('请在罗盘上点击选择大门/主阳台朝向');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/house', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          birthYear: parseInt(form.birthYear, 10),
          area: parseInt(form.area, 10),
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.error || '计算失败');
        return;
      }
      setReport(json);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '网络异常');
    } finally {
      setLoading(false);
    }
  };

  const handlePolish = async () => {
    setPolishing(true);
    setPolished('');
    setPolishSource('streaming');
    setErrorMsg('');
    try {
      const res = await fetch('/api/house/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          birthYear: parseInt(form.birthYear, 10),
          area: parseInt(form.area, 10),
        }),
      });
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream') && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let acc = '';
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
              if (!payload || payload === '[DONE]') continue;
              try {
                const obj = JSON.parse(payload);
                if (obj.event === 'message' && typeof obj.answer === 'string') {
                  acc += obj.answer;
                  setPolished(acc);
                } else if (obj.event === 'message_end') {
                  if (obj.metadata?.fallback) {
                    setPolishSource('local-template');
                    lastError = obj.metadata.error || '';
                  } else {
                    setPolishSource('dify');
                  }
                } else if (obj.event === 'error') {
                  lastError = obj.message || '流式错误';
                }
              } catch { /* ignore parse error */ }
            }
          }
        }
        if (lastError) console.warn('[house] polish stream error:', lastError);
        return;
      }

      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.error || '润色失败');
        return;
      }
      setPolished(json.polished || '');
      setPolishSource(json.source || 'local-template');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '网络异常');
    } finally {
      setPolishing(false);
    }
  };

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{
        background: `linear-gradient(180deg, #faf3e3 0%, #f5ede0 100%)`,
      }}
    >
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 pb-32">
        {/* 标题区 */}
        <div className="text-center mb-8 pt-4">
          <div className="text-5xl mb-2">🏠</div>
          <h1 className="text-3xl font-bold mb-3" style={{ color: THEME_SECONDARY, fontFamily: FONT_KAI }}>
            家居环境 · 空间能量诊断
          </h1>
          <p className="text-sm text-amber-800 italic" style={{ fontFamily: FONT_KAI }}>
            「宅安则心安。好的空间布局，<br />
            是家庭和睦与个人运势的稳定器。」
          </p>
          <div className="mt-4 text-xs text-amber-600 tracking-widest">
            ✦  ✦  ✦
          </div>
        </div>

        {/* 欢迎语 */}
        <div
          className="rounded-lg p-6 mb-6 text-center border"
          style={{ background: `linear-gradient(135deg, ${THEME_BG_SOFT}, #fff7e8)`, borderColor: THEME_PRIMARY }}
        >
          <p className="text-lg text-amber-900" style={{ fontFamily: FONT_KAI }}>
            不讲<strong style={{ color: THEME_SECONDARY }}>「摆这个能招财」</strong>这种空话，
            给你一份基于<strong style={{ color: THEME_SECONDARY }}>玄空大卦 + 现代生活</strong>的家居能量地图。
          </p>
        </div>

        {/* 输入区 */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border-2 p-5 shadow-sm mb-6"
          style={{ borderColor: THEME_PRIMARY, background: '#fff' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 姓名 */}
            <div>
              <label className="text-xs font-bold mb-1 block" style={{ color: THEME_SECONDARY, fontFamily: FONT_KAI }}>
                👤 你的姓名
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="如：陆杰"
                className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:border-amber-500 text-sm"
                style={{ borderColor: THEME_PRIMARY, fontFamily: FONT_KAI }}
                required
              />
            </div>

            {/* 性别 */}
            <div>
              <label className="text-xs font-bold mb-1 block" style={{ color: THEME_SECONDARY, fontFamily: FONT_KAI }}>
                ⚧ 性别（用于命卦推算）
              </label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}
                className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:border-amber-500 text-sm"
                style={{ borderColor: THEME_PRIMARY, fontFamily: FONT_KAI }}
              >
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>

            {/* 出生年 */}
            <div>
              <label className="text-xs font-bold mb-1 block" style={{ color: THEME_SECONDARY, fontFamily: FONT_KAI }}>
                📅 出生年份
              </label>
              <input
                type="number"
                min="1900"
                max={currentYear}
                value={form.birthYear}
                onChange={(e) => setForm({ ...form, birthYear: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:border-amber-500 text-sm"
                style={{ borderColor: THEME_PRIMARY, fontFamily: FONT_KAI }}
                required
              />
              <p className="text-[10px] text-amber-700 mt-1" style={{ fontFamily: FONT_KAI }}>仅需年份（用于男命/女命推算）</p>
            </div>

            {/* 房屋面积 */}
            <div>
              <label className="text-xs font-bold mb-1 block" style={{ color: THEME_SECONDARY, fontFamily: FONT_KAI }}>
                📐 房屋面积（㎡）
              </label>
              <input
                type="number"
                min="10"
                max="2000"
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:border-amber-500 text-sm"
                style={{ borderColor: THEME_PRIMARY, fontFamily: FONT_KAI }}
                required
              />
            </div>

            {/* 家庭结构（占满整行） */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold mb-1 block" style={{ color: THEME_SECONDARY, fontFamily: FONT_KAI }}>
                👨‍👩‍👧 家庭成员构成
              </label>
              <select
                value={form.familyStructure}
                onChange={(e) => setForm({ ...form, familyStructure: e.target.value as FormState['familyStructure'] })}
                className="w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:border-amber-500 text-sm"
                style={{ borderColor: THEME_PRIMARY, fontFamily: FONT_KAI }}
              >
                <option value="single">独居</option>
                <option value="couple">夫妻二人</option>
                <option value="family-kids">核心家庭（有孩子）</option>
                <option value="three-gen">三代同堂</option>
                <option value="elderly">退休长者居所</option>
              </select>
            </div>

            {/* 罗盘（占满整行） */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold mb-1 block text-center" style={{ color: THEME_SECONDARY, fontFamily: FONT_KAI }}>
                🧭 大门 / 主阳台朝向
              </label>
              <CompassPicker
                value={form.doorDirection}
                onChange={(k) => setForm({ ...form, doorDirection: k })}
              />
            </div>
          </div>

          {errorMsg && (
            <div className="mt-3 p-2 rounded text-sm bg-red-50 text-red-700 border border-red-200">
              ⚠ {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 rounded-lg text-white font-bold shadow-md transition disabled:opacity-60"
            style={{ background: `linear-gradient(135deg, ${THEME_PRIMARY}, ${THEME_SECONDARY})`, fontFamily: FONT_KAI }}
          >
            {loading ? '🔮 推演中…' : '🏠 生成我的家宅能量诊断'}
          </button>
        </form>

        {/* 报告区 */}
        {report && (
          <HouseReportView
            report={report}
            userRole={userRole}
            onPolish={handlePolish}
            polishing={polishing}
            polished={polished}
            polishSource={polishSource}
          />
        )}
      </main>
    </div>
  );
}
