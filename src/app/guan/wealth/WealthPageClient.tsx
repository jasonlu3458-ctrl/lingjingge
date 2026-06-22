'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import type { UserRole } from '@/lib/auth';
import ReportPaywall from '@/components/ReportPaywall';
import ExportPDFButton from '@/components/ExportPDFButton';
import ReportTTSButton from '@/components/ReportTTSButton';
import type { WealthReport, Career } from '@/lib/wealth-rules';

// 主题色（与其他 guan 页面保持一致：每个模块一种主色）
const WEALTH_THEME = '#7a5a3a';   // 暗金 · 与"财富"语义匹配
const WEALTH_ACCENT = '#b08551';  // 暖金
const FONT_KAI = "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif";

// ============================================================
// MiniMarkdown 渲染器（与 FamilyPageClient / EducationPageClient 一致）
// ============================================================
function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(<strong key={`b${key++}`}>{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function MiniMarkdown({ text }: { text: string }) {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed === '') { i++; continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (h) {
      const level = h[1].length;
      const cls = level === 1 ? 'text-lg font-bold mt-3' : level === 2 ? 'text-base font-bold mt-2' : 'text-sm font-bold mt-2';
      const Tag = (`h${level + 2}`) as 'h3' | 'h4' | 'h5';
      blocks.push(<Tag key={key++} className={cls}>{renderInline(h[2])}</Tag>);
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(<li key={items.length}>{renderInline(lines[i].trim().replace(/^[-*]\s+/, ''))}</li>);
        i++;
      }
      blocks.push(<ul key={key++} className="list-disc pl-5 space-y-1">{items}</ul>);
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(<li key={items.length}>{renderInline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>);
        i++;
      }
      blocks.push(<ol key={key++} className="list-decimal pl-5 space-y-1">{items}</ol>);
      continue;
    }
    const para: string[] = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^(#{1,3})\s+/.test(lines[i].trim()) && !/^[-*]\s+/.test(lines[i].trim()) && !/^\d+\.\s+/.test(lines[i].trim())) {
      para.push(lines[i]);
      i++;
    }
    blocks.push(<p key={key++} className="leading-relaxed">{renderInline(para.join(' '))}</p>);
  }
  return <>{blocks}</>;
}

// ============================================================
// 常量：时辰 / 职业
// ============================================================
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

const CAREER_OPTIONS: { value: Career; label: string; emoji: string }[] = [
  { value: '互联网',     label: '互联网 / AI / 产品', emoji: '💻' },
  { value: '金融',       label: '金融 / 投资 / 证券', emoji: '💰' },
  { value: '制造',       label: '制造 / 实业 / 硬件', emoji: '🏭' },
  { value: '教育',       label: '教育 / 培训 / 出版', emoji: '📚' },
  { value: '服务业',     label: '服务 / 医疗 / 法律', emoji: '🛎️' },
  { value: '自由职业',   label: '自由职业 / 创业 / IP', emoji: '🕊️' },
  { value: '其他',       label: '其他', emoji: '🌐' },
];

// ============================================================
// 评分仪表盘（圆形 SVG 进度环）
// ============================================================
function ScoreGauge({ score, label }: { score: number; label: string }) {
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dash = (score / 100) * circumference;
  // 颜色三档
  const color = score >= 85 ? '#16a34a' : score >= 70 ? '#ca8a04' : score >= 50 ? '#d97706' : '#b91c1c';
  return (
    <div className="flex flex-col items-center">
      <svg width="148" height="148" viewBox="0 0 148 148" className="drop-shadow-sm">
        <circle cx="74" cy="74" r={radius} fill="none" stroke="#f5e6cf" strokeWidth="12" />
        <circle
          cx="74" cy="74" r={radius}
          fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          transform="rotate(-90 74 74)"
        />
        <text x="74" y="70" textAnchor="middle" fontSize="32" fontWeight="700" fill={color}>
          {score}
        </text>
        <text x="74" y="92" textAnchor="middle" fontSize="11" fill="#7a5a3a">
          / 100
        </text>
      </svg>
      <div className="mt-1 text-xs font-semibold" style={{ color, fontFamily: FONT_KAI }}>
        {label}
      </div>
    </div>
  );
}

// ============================================================
// 八字摘要栏（横向 6 chip）
// ============================================================
function BaziSummaryBar({ report }: { report: WealthReport }) {
  const items: { label: string; value: string; tone?: string }[] = [
    { label: '日柱', value: report.bazi.dayGanzhi, tone: '#7a5a3a' },
    { label: '日干五行', value: report.bazi.dayElement, tone: '#b08551' },
    { label: '财星', value: report.wealthSource.element, tone: '#b85a4a' },
    { label: '谋财方式', value: report.careerType.type, tone: '#7a5a3a' },
    { label: '当前季节', value: report.timing.season.monthLabel, tone: '#b08551' },
    { label: '职业匹配', value: report.career.matchLabel, tone: '#7a5a3a' },
  ];
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {items.map((it, i) => (
        <div
          key={i}
          className="rounded-lg border border-amber-200 bg-white/80 px-2 py-2 text-center"
        >
          <div className="text-[10px] text-gray-500" style={{ fontFamily: FONT_KAI }}>
            {it.label}
          </div>
          <div
            className="text-sm font-bold mt-0.5"
            style={{ color: it.tone, fontFamily: FONT_KAI }}
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 免费报告卡（5 张）
// ============================================================
const FREE_CARD_META: { key: keyof WealthReport['free']; icon: string; subtitle: string; tone: string }[] = [
  { key: 'origin',   icon: '🧬', subtitle: '你的命格底色', tone: '#7a5a3a' },
  { key: 'fangxiang', icon: '🧭', subtitle: '财源方向 + 适配行业', tone: '#b85a4a' },
  { key: 'gongzhan',  icon: '⚔️', subtitle: '打工 / 创业 / 合伙', tone: '#7a5a3a' },
  { key: 'shijian',   icon: '⏰', subtitle: '旺衰节点 + 最佳窗口', tone: '#b08551' },
  { key: 'yishi',     icon: '💎', subtitle: '智富小语 · 一句话点题', tone: '#b85a4a' },
];

function FreeCard({
  index,
  meta,
  title,
  content,
  source,
}: {
  index: number;
  meta: typeof FREE_CARD_META[number];
  title: string;
  content: string;
  source?: string;
}) {
  return (
    <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm hover:shadow-md transition">
      <div className="flex items-start gap-3">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
          style={{ backgroundColor: `${meta.tone}20`, color: meta.tone }}
        >
          {meta.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ backgroundColor: meta.tone, color: 'white', fontFamily: FONT_KAI }}
            >
              {index + 1}
            </span>
            <h3
              className="text-base font-bold"
              style={{ color: meta.tone, fontFamily: FONT_KAI }}
            >
              {title}
            </h3>
            <span className="text-[10px] text-gray-400">· {meta.subtitle}</span>
          </div>
          <p
            className="mt-2 text-sm text-gray-700 leading-relaxed"
            style={{ fontFamily: FONT_KAI }}
          >
            {content}
          </p>
          {source && (
            <p className="mt-2 text-[10px] text-gray-400 italic">— {source}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 锁定卡片（5 张付费）
// ============================================================
const PAID_CARD_META: { key: keyof WealthReport['paid']; icon: string; preview: string; tone: string }[] = [
  { key: 'qushi',    icon: '📈', preview: '未来 3 年流年趋势 + 关键转折点',       tone: '#b85a4a' },
  { key: 'jiating',  icon: '🏛️', preview: '家庭财富池 · 4 笔预算黄金比例',         tone: '#7a5a3a' },
  { key: 'guanli',   icon: '👥', preview: '管理用人 · 命中"什么搭档"',            tone: '#b08551' },
  { key: 'fangkeng', icon: '⚠️', preview: '防坑指南 · 3 个你一定要绕开的雷区',     tone: '#b85a4a' },
  { key: 'zhidao',   icon: '🎯', preview: '3 步落地清单 · 7-30-90 天行动表',      tone: '#7a5a3a' },
];

function LockedCard({
  index,
  meta,
  title,
}: {
  index: number;
  meta: typeof PAID_CARD_META[number];
  title: string;
}) {
  return (
    <div className="relative rounded-xl border-2 border-dashed border-amber-300 bg-white/40 p-4 overflow-hidden">
      {/* 模糊背景 */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none select-none"
        style={{
          background: `repeating-linear-gradient(45deg, transparent, transparent 8px, ${meta.tone}10 8px, ${meta.tone}10 16px)`,
        }}
      />
      <div className="relative">
        <div className="flex items-start gap-3">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-white/80"
          >
            {meta.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ backgroundColor: meta.tone, color: 'white', fontFamily: FONT_KAI }}
              >
                付费 {index + 1}
              </span>
              <h3
                className="text-base font-bold text-gray-700"
                style={{ fontFamily: FONT_KAI }}
              >
                {title}
              </h3>
            </div>
            <p
              className="mt-2 text-xs text-gray-500 leading-relaxed"
              style={{ fontFamily: FONT_KAI }}
            >
              {meta.preview}
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-amber-700">
              <span>🔒</span>
              <span style={{ fontFamily: FONT_KAI }}>解锁后查看完整内容</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AI 智富心法（Dify 润色结果）
// ============================================================
function DifyPolishSection({
  polished,
  source,
}: {
  polished: string;
  source: string;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-5 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🤖</span>
          <span
            className="text-base font-bold"
            style={{ color: WEALTH_ACCENT, fontFamily: FONT_KAI }}
          >
            AI 智富心法 · Dify 顾问润色
          </span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded text-white"
            style={{ backgroundColor: source === 'dify' ? '#16a34a' : '#9ca3af' }}
          >
            {source === 'dify' ? 'Dify' : '本地模板'}
          </span>
        </div>
        <span className="text-xs text-gray-500">{open ? '收起 ▴' : '展开 ▾'}</span>
      </button>
      {open && (
        <div
          className="mt-3 text-sm text-gray-800"
          style={{ fontFamily: FONT_KAI }}
        >
          <MiniMarkdown text={polished} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// 专属付费墙（5 卡片 + 价格 + 信任）
// ============================================================
function WealthPaywall({
  report,
  userRole,
  premiumSections,
  reportKey,
}: {
  report: WealthReport;
  userRole: UserRole;
  premiumSections: string[];
  reportKey: string;
}) {
  const isPaid = userRole === 'member' || userRole === 'admin';

  if (isPaid) {
    return (
      <div className="space-y-3">
        {PAID_CARD_META.map((meta, i) => {
          const content = (report.paid[meta.key] as { content: string }).content;
          return (
            <div
              key={meta.key}
              className="rounded-xl border-2 border-green-300 bg-gradient-to-br from-green-50 to-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${meta.tone}20`, color: meta.tone }}
                >
                  {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white"
                      style={{ backgroundColor: meta.tone, fontFamily: FONT_KAI }}
                    >
                      深度 {i + 1}
                    </span>
                    <h3
                      className="text-base font-bold"
                      style={{ color: meta.tone, fontFamily: FONT_KAI }}
                    >
                      {(report.paid[meta.key] as { title: string }).title}
                    </h3>
                  </div>
                  <p
                    className="mt-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                    style={{ fontFamily: FONT_KAI }}
                  >
                    {content}
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
      {/* 5 张锁定卡 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PAID_CARD_META.map((meta, i) => (
          <LockedCard
            key={meta.key}
            index={i}
            meta={meta}
            title={(report.paid[meta.key] as { title: string }).title}
          />
        ))}
      </div>

      {/* 价格 + CTA 区域 */}
      <div className="rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 text-white p-5 shadow-lg">
        <div className="text-center mb-4">
          <h3
            className="text-xl font-bold mb-1"
            style={{ fontFamily: FONT_KAI }}
          >
            💎 解锁 5 大深度模块
          </h3>
          <p
            className="text-sm text-amber-100"
            style={{ fontFamily: FONT_KAI }}
          >
            覆盖未来 3 年流年 · 家庭财富池 · 用人 · 防坑 · 落地清单
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
            <div className="text-xs text-amber-100" style={{ fontFamily: FONT_KAI }}>单次解锁</div>
            <div className="text-2xl font-bold mt-1">¥9.9</div>
            <div className="text-[10px] text-amber-200 mt-0.5" style={{ fontFamily: FONT_KAI }}>仅限本报告</div>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-3 text-center ring-2 ring-amber-300 relative">
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-300 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded"
              style={{ fontFamily: FONT_KAI }}
            >
              推荐
            </div>
            <div className="text-xs text-amber-100" style={{ fontFamily: FONT_KAI }}>月度会员</div>
            <div className="text-2xl font-bold mt-1">¥39</div>
            <div className="text-[10px] text-amber-200 mt-0.5" style={{ fontFamily: FONT_KAI }}>全站 6 大模块全解锁</div>
          </div>
        </div>

        <ReportPaywall
          userRole={userRole}
          freePart=""
          premiumPart={premiumSections.join('\n')}
          premiumSections={premiumSections}
          reportKey={reportKey}
          accentClass="text-amber-200"
        />

        {/* 信任标识 */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-amber-100">
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
    </div>
  );
}

// ============================================================
// 报告主区
// ============================================================
function WealthReportView({
  report,
  userRole,
  polished,
  polishSource,
  polishLoading,
  onPolish,
}: {
  report: WealthReport;
  userRole: UserRole;
  polished: string;
  polishSource: string;
  polishLoading: boolean;
  onPolish: () => void;
}) {
  return (
    <div id="wealth-report" className="space-y-5">
      {/* 头部：评分仪表盘 + 八字摘要 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-amber-200 p-5">
        <div className="flex flex-col md:flex-row gap-5 items-center">
          <ScoreGauge
            score={report.score}
            label={report.score >= 85 ? '极佳 · 可大举进攻' : report.score >= 70 ? '较佳 · 顺势而为' : report.score >= 50 ? '中等 · 稳中求进' : '偏弱 · 宜守不宜攻'}
          />
          <div className="flex-1 w-full">
            <div className="text-center md:text-left mb-3">
              <div className="text-2xl mb-1">💎</div>
              <h2
                className="text-2xl font-bold text-gray-800"
                style={{ fontFamily: FONT_KAI, color: WEALTH_THEME }}
              >
                {report.input.name} · 事业智富报告
              </h2>
              <p
                className="text-sm text-gray-600 mt-1"
                style={{ fontFamily: FONT_KAI }}
              >
                八字 <span style={{ color: WEALTH_THEME }}>{report.bazi.yearGanzhi} {report.bazi.monthGanzhi} {report.bazi.dayGanzhi}</span>
                <span className="mx-2 text-gray-400">|</span>
                生肖 {report.bazi.yearZodiac}
                <span className="mx-2 text-gray-400">|</span>
                阳历 {report.bazi.solarDate}
              </p>
            </div>
            <BaziSummaryBar report={report} />
          </div>
        </div>
      </div>

      {/* AI 智富心法（Dify 润色） */}
      {polished ? (
        <DifyPolishSection polished={polished} source={polishSource} />
      ) : (
        <div className="text-center">
          <button
            onClick={onPolish}
            disabled={polishLoading}
            className="px-6 py-2.5 rounded-lg text-white font-semibold shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: `linear-gradient(135deg, ${WEALTH_ACCENT}, ${WEALTH_THEME})`,
              fontFamily: FONT_KAI,
            }}
          >
            {polishLoading ? '🤖 AI 润色中…' : '🤖 召唤 AI 智富心法（基于 Dify 润色 · 免费体验）'}
          </button>
          <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: FONT_KAI }}>
            AI 会基于你的八字 + 职业，给出一份 500-700 字的可执行破局指南
          </p>
        </div>
      )}

      {/* 免费 5 大模块 */}
      <div>
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h3
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: WEALTH_THEME, fontFamily: FONT_KAI }}
          >
            <span>🎁</span>
            <span>免费 5 大模块</span>
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700"
            style={{ fontFamily: FONT_KAI }}
          >
            立即可读
          </span>
        </div>
        <div className="space-y-3">
          {FREE_CARD_META.map((meta, i) => {
            const c = report.free[meta.key];
            return (
              <FreeCard
                key={meta.key}
                index={i}
                meta={meta}
                title={c.title}
                content={c.content}
                source={'source' in c ? (c as { source?: string }).source : undefined}
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
            style={{ color: WEALTH_THEME, fontFamily: FONT_KAI }}
          >
            <span>🔒</span>
            <span>5 大深度模块</span>
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full bg-amber-100"
            style={{ color: WEALTH_THEME, fontFamily: FONT_KAI }}
          >
            会员 / 单解锁
          </span>
        </div>
        <WealthPaywall
          report={report}
          userRole={userRole}
          premiumSections={[
            report.paid.qushi.title,
            report.paid.jiating.title,
            report.paid.guanli.title,
            report.paid.fangkeng.title,
            report.paid.zhidao.title,
          ]}
          reportKey="wealth"
        />
      </div>

      {/* 导出 PDF + 朗读 */}
      <div className="pt-2 text-center flex flex-col sm:flex-row gap-2 sm:justify-center">
        <ReportTTSButton
          targetId="wealth-report"
          title="事业智富报告"
          tone="amber"
          prefix="以下是您的事业智富报告。"
        />
        <ExportPDFButton
          targetId="wealth-report"
          filename={`事业智富报告-${report.input.name || '匿名'}`}
          tone="amber"
        />
      </div>
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
interface WealthPageClientProps {
  userRole: UserRole;
}

export default function WealthPageClient({ userRole }: WealthPageClientProps) {
  const [showModal, setShowModal] = useState(false);

  // 个人信息
  const [form, setForm] = useState({
    name: '',
    gender: 'female' as 'female' | 'male',
    birthDate: '',
    birthHour: 12,
    calendarType: 'solar' as 'solar' | 'lunar',
    career: '互联网' as Career,
  });

  // 报告
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [report, setReport] = useState<WealthReport | null>(null);

  // 润色
  const [polishing, setPolishing] = useState(false);
  const [polished, setPolished] = useState('');
  const [polishSource, setPolishSource] = useState('');

  // 提交
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setReport(null);
    setPolished('');
    setPolishSource('');
    try {
      const res = await fetch('/api/wealth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          birthHour: form.birthHour === -1 ? 12 : form.birthHour,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.error || '生成报告失败');
        return;
      }
      setReport(json.data as WealthReport);
      setTimeout(() => {
        document.getElementById('wealth-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '网络异常');
    } finally {
      setLoading(false);
    }
  };

  // Dify 润色
  const handlePolish = async () => {
    setPolishing(true);
    try {
      const res = await fetch('/api/wealth/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          birthHour: form.birthHour === -1 ? 12 : form.birthHour,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.error || '润色失败');
        return;
      }
      setPolished(json.polished);
      setPolishSource(json.source);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '网络异常');
    } finally {
      setPolishing(false);
    }
  };

  return (
    <div className="flex flex-col" style={{ backgroundColor: WEALTH_THEME }}>
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 pb-32">
        {/* 标题区 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💎</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: FONT_KAI }}>
            事业智富 · 破局之道
          </h1>
          <p className="text-gray-600" style={{ fontFamily: FONT_KAI }}>
            <em>「君子爱财，取之有道。算清格局，谋定后动。」</em>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            源自《史记·货殖列传》·「天下熙熙，皆为利来；天下攘攘，皆为利往。」
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-3 text-blue-700 hover:underline text-sm"
          >
            📜 智富渊源（了解货殖智慧）
          </button>
        </div>

        {/* 欢迎语 */}
        <div className="bg-white bg-opacity-80 rounded-lg p-6 mb-6 text-center">
          <p className="text-lg text-gray-700" style={{ fontFamily: FONT_KAI }}>
            不讲虚无缥缈的「今年有横财」，给你一套基于先天格局的<strong>个人商业行动指南</strong>。
          </p>
        </div>

        {/* 典故模态框 */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">📜 货殖智慧 · 智富渊源</h2>
              <div className="space-y-3 text-sm text-gray-700">
                <p><strong>《史记·货殖列传》</strong>：司马迁所著，专门为工商业者立传，记录范蠡、子贡、白圭等富商之道。</p>
                <p><strong>「天下熙熙，皆为利来；天下攘攘，皆为利往。」</strong> —— 司马迁认为求利是人之常情，不必避讳，关键是"取之有道"。</p>
                <p><strong>「人弃我取，人取我与。」</strong> —— 战国白圭的经商之道：不追风口，反向布局。</p>
                <p><strong>「知斗则修备，时用则知物。」</strong> —— 懂得未雨绸缪、看准时机的人，才能真正聚财。</p>
                <p className="text-xs text-gray-500">本模块将这份"货殖智慧"与八字格局结合，让你的每一步都谋定而后动。</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="mt-4 w-full bg-black text-white py-2 rounded-lg"
              >
                我知道了
              </button>
            </div>
          </div>
        )}

        {/* 输入区 */}
        <form
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-amber-200 p-6 mb-6"
        >
          <h2 className="text-lg font-bold text-gray-800 mb-4" style={{ fontFamily: FONT_KAI }}>
            💎 请填写您的信息
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧：先天格局 */}
            <div className="p-4 border-2 border-amber-200 rounded-lg bg-white/60">
              <h3 className="text-base font-bold text-gray-800 mb-3" style={{ fontFamily: FONT_KAI }}>
                🧬 您的先天格局
              </h3>

              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>姓名 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  maxLength={20}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                  style={{ fontFamily: FONT_KAI }}
                  placeholder="请输入姓名"
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>性别 *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1 text-sm" style={{ fontFamily: FONT_KAI }}>
                    <input
                      type="radio"
                      value="female"
                      checked={form.gender === 'female'}
                      onChange={() => setForm({ ...form, gender: 'female' })}
                    />
                    <span>女</span>
                  </label>
                  <label className="flex items-center gap-1 text-sm" style={{ fontFamily: FONT_KAI }}>
                    <input
                      type="radio"
                      value="male"
                      checked={form.gender === 'male'}
                      onChange={() => setForm({ ...form, gender: 'male' })}
                    />
                    <span>男</span>
                  </label>
                </div>
              </div>

              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>出生日期 *</label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={e => setForm({ ...form, birthDate: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                  style={{ fontFamily: FONT_KAI }}
                />
              </div>

              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>出生时辰</label>
                <select
                  value={form.birthHour}
                  onChange={e => setForm({ ...form, birthHour: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                  style={{ fontFamily: FONT_KAI }}
                >
                  {HOUR_OPTIONS.map(h => (
                    <option key={h.value} value={h.value}>{h.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>历法 *</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1 text-sm" style={{ fontFamily: FONT_KAI }}>
                    <input
                      type="radio"
                      value="solar"
                      checked={form.calendarType === 'solar'}
                      onChange={() => setForm({ ...form, calendarType: 'solar' })}
                    />
                    <span>阳历</span>
                  </label>
                  <label className="flex items-center gap-1 text-sm" style={{ fontFamily: FONT_KAI }}>
                    <input
                      type="radio"
                      value="lunar"
                      checked={form.calendarType === 'lunar'}
                      onChange={() => setForm({ ...form, calendarType: 'lunar' })}
                    />
                    <span>农历</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 右侧：现状诊断 */}
            <div className="p-4 border-2 border-amber-200 rounded-lg bg-white/60">
              <h3 className="text-base font-bold text-gray-800 mb-3" style={{ fontFamily: FONT_KAI }}>
                🏛️ 您的现状诊断
              </h3>

              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>从事职业 *</label>
                <select
                  value={form.career}
                  onChange={e => setForm({ ...form, career: e.target.value as Career })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm"
                  style={{ fontFamily: FONT_KAI }}
                >
                  {CAREER_OPTIONS.map(c => (
                    <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: FONT_KAI }}>
                  选好职业，AI 会把它与你的财星五行做"匹配度分析"，给出更精准的行业微调建议。
                </p>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800" style={{ fontFamily: FONT_KAI }}>
                💡 <strong>为什么需要职业？</strong><br />
                同一天干、不同职业，财星五行的匹配度天差地别 ——<br />
                命中以「金」为财，做金融与做教育，前者 1.0 分，后者 0.3 分。
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-amber-700 text-white py-3 rounded-lg font-semibold hover:bg-amber-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontFamily: FONT_KAI }}
          >
            {loading ? '⏳ 排盘中…' : '📈 生成我的事业财富报告'}
          </button>

          {errorMsg && (
            <p className="text-sm text-red-600 text-center mt-2" style={{ fontFamily: FONT_KAI }}>
              {errorMsg}
            </p>
          )}
        </form>

        {/* 报告区 */}
        {report && (
          <WealthReportView
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
