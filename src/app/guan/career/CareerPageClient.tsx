// ============================================================
// CareerPageClient —— AI 事业财富 · 看清大势，顺势而为
// 主题：深棕金（主 #8a6a4a + 辅 #b08551）
// 复用：ScoreGauge / FreeCard / LockedCard / ReportPaywall
//
// 区别于 wealth 的是：career 不依赖八字规则引擎，直接调
// /api/dify?type=career 走 SSE 流式，输出整段 polished 报告。
// ============================================================

'use client';

import { useState, useRef, type FormEvent, type ReactNode } from 'react';
import type { UserRole } from '@/lib/auth';
import ReportPaywall from '@/components/ReportPaywall';
import ReportActionBar from '@/components/ReportActionBar';
import ScoreGauge from '@/components/wealth-report/ScoreGauge';
import FreeCard from '@/components/wealth-report/FreeCard';
import LockedCard from '@/components/wealth-report/LockedCard';

// ---------- 主题色 ----------
const THEME_PRIMARY = '#8a6a4a';  // 主色 · 深棕
const THEME_ACCENT = '#b08551';   // 辅色 · 暖金
const THEME_DARK = '#5a4030';     // 头部渐变深色
const FONT_KAI = "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif";

// ============================================================
// MiniMarkdown 渲染器
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
    const trimmed = lines[i].trim();
    if (trimmed === '') { i++; continue; }
    const h = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (h) {
      const level = h[1].length;
      const cls = level === 1 ? 'text-lg font-bold mt-3' : level === 2 ? 'text-base font-bold mt-2' : 'text-sm font-bold mt-2';
      const Tag = (`h${level + 2}`) as 'h3' | 'h4' | 'h5';
      blocks.push(<Tag key={key++} className={cls} style={{ color: THEME_ACCENT }}>{renderInline(h[2])}</Tag>);
      i++; continue;
    }
    if (/^[-*]\s+/.test(trimmed)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(<li key={items.length} className="text-amber-100">{renderInline(lines[i].trim().replace(/^[-*]\s+/, ''))}</li>);
        i++;
      }
      blocks.push(<ul key={key++} className="list-disc pl-5 space-y-1 my-2">{items}</ul>);
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(<li key={items.length} className="text-amber-100">{renderInline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>);
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
    blocks.push(<p key={key++} className="leading-relaxed text-amber-50 my-2">{renderInline(para.join(' '))}</p>);
  }
  return <>{blocks}</>;
}

// ============================================================
// 字段定义
// ============================================================
const INDUSTRY_OPTIONS = [
  { value: '互联网',   label: '互联网 / 科技' },
  { value: '金融',     label: '金融 / 投资' },
  { value: '文化传媒', label: '文化 / 传媒 / 内容' },
  { value: '设计',     label: '设计 / 艺术 / 品牌' },
  { value: '制造',     label: '制造 / 实业 / 硬件' },
  { value: '教育',     label: '教育 / 培训 / 出版' },
  { value: '服务业',   label: '服务 / 医疗 / 法律' },
  { value: '自由职业', label: '自由职业 / 创业 / IP' },
  { value: '其他',     label: '其他' },
];

const STAGE_OPTIONS = [
  { value: 'start',  label: '起步期 (0-3 年)' },
  { value: 'growth', label: '成长期 (3-8 年)' },
  { value: 'pivot',  label: '转型期' },
  { value: 'mature', label: '成熟期 (8 年+)' },
];

// ============================================================
// 5 大深度模块（locked）
// ============================================================
const PAID_CARD_META: { key: string; icon: string; title: string; preview: string; tone: string }[] = [
  { key: 'career3y',  icon: '📈', title: '未来 3 年事业蓝图',     preview: '逐年节奏 + 3 大关键节点 + 风险预案',   tone: THEME_PRIMARY },
  { key: 'switch',    icon: '🔀', title: '打工 / 创业 / 合伙 三选一', preview: '3 种路径利弊 + 决策清单 + 切换时机', tone: THEME_ACCENT },
  { key: 'wealthup',  icon: '💰', title: '收入跃迁路线图',         preview: '3 个收入台阶 + 突破卡点的具体动作',   tone: THEME_PRIMARY },
  { key: 'decisions', icon: '🎯', title: '今年 5 个关键决策',       preview: '排序 + 取舍 + 复盘节点',             tone: THEME_ACCENT },
  { key: 'mindset',   icon: '🧠', title: '事业心法 · 顺势而为',    preview: '3 句话让你看清大势 + 长期主义建议', tone: THEME_PRIMARY },
];

// ============================================================
// 自由 5 大模块（基于 Dify polished 文本的智能切分）
// ============================================================
interface FreeSection {
  title: string;
  content: string;
}
function splitPolishedToFreeCards(polished: string): FreeSection[] {
  if (!polished) return [];
  // 尝试按 ## 切分
  const blocks = polished.split(/\n(?=##\s+)/);
  const sections: FreeSection[] = [];
  for (const blk of blocks) {
    const m = /^##\s+(.+?)\n([\s\S]*)$/.exec(blk.trim());
    if (m) {
      sections.push({ title: m[1].trim(), content: m[2].trim() });
    } else if (blk.trim()) {
      // 没有 ## 标题：整段当作「整体观察」
      sections.push({ title: '整体观察', content: blk.trim() });
    }
  }
  return sections.slice(0, 5);
}

// ============================================================
// AI 报告区（SSE 流式）
// ============================================================
function PolishSection({
  polished,
  streaming,
  onRetry,
}: {
  polished: string;
  streaming: boolean;
  onRetry: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div
      className="rounded-xl border p-5 shadow-lg"
      style={{
        borderColor: THEME_ACCENT,
        background: `linear-gradient(135deg, ${THEME_DARK}, #6b4e34)`,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">💼</span>
          <span className="text-base font-bold" style={{ color: THEME_ACCENT, fontFamily: FONT_KAI }}>
            ✨ 灵境尊者 · 事业顺势指引
          </span>
          {streaming ? (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded text-white animate-pulse"
              style={{ backgroundColor: THEME_ACCENT }}
            >
              ✨ AI 撰写中…
            </span>
          ) : polished ? (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: '#16a34a' }}
            >
              完成
            </span>
          ) : null}
        </div>
        <span className="text-xs text-amber-200">{open ? '收起 ▴' : '展开 ▾'}</span>
      </button>
      {open && (
        <div className="mt-3 text-sm" style={{ fontFamily: FONT_KAI }}>
          {polished ? (
            <MiniMarkdown text={polished} />
          ) : streaming ? (
            <div className="flex items-center gap-2 text-amber-200 italic py-4">
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME_ACCENT }} />
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME_ACCENT, animationDelay: '0.2s' }} />
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: THEME_ACCENT, animationDelay: '0.4s' }} />
              <span className="ml-2">AI 正在为你推演事业节奏…</span>
            </div>
          ) : (
            <div className="text-amber-200 italic py-2">暂无内容，<button onClick={onRetry} className="underline">重新生成</button></div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// 主页面
// ============================================================
interface CareerPageClientProps {
  userRole: UserRole;
}

export default function CareerPageClient({ userRole }: CareerPageClientProps) {
  const [form, setForm] = useState({
    name: '',
    industry: '互联网',
    careerStage: 'growth' as 'start' | 'growth' | 'pivot' | 'mature',
    concern: '',
  });

  const [polished, setPolished] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  // 拼装 Dify 端要用的 query：把表单结构化转成自然语言
  const buildQuery = (f: typeof form) => {
    const stageLabel = STAGE_OPTIONS.find(o => o.value === f.careerStage)?.label || f.careerStage;
    return `我是 ${f.name || '（未填）'}，当前在【${f.industry}】行业，处于【${stageLabel}】。\n\n我现在的卡点是：${f.concern || '（未填）'}\n\n请基于以上信息，写一份 500-800 字的事业财富观察报告，要求：\n1) 先给一个总分（0-100）+ 一句话点题；\n2) 拆 3-5 个 ## 小节（如 ## 优势、## 风险、## 突破点、## 节奏、## 一句点题），每节 80-150 字；\n3) 语气要像一位懂命理又懂现代职场的顺势顾问，不堆砌古籍术语，给出可执行建议。`;
  };

  // 本地模板兜底（Dify 返回过短时使用）
  const buildLocalFallback = (f: typeof form): string => {
    const stageLabel = STAGE_OPTIONS.find(o => o.value === f.careerStage)?.label || f.careerStage;
    return [
      `## 一句话点题`,
      `${f.name || '你'}在【${f.industry}】的【${stageLabel}】，核心卡点不是能力不够，而是节奏没踩对。"顺势"不是躺赢，是把力气花在顺势的关节上。`,
      ``,
      `## 优势`,
      `你已积累足够的行业经验，对【${f.industry}】的运转逻辑有体感 —— 这是 0-3 年的人最羡慕的底牌。这个阶段的"势"在于：用确定性换话语权。`,
      ``,
      `## 风险`,
      `当前的"卡点"—— ${f.concern || '（你描述的瓶颈）'} —— 往往不是单一原因，而是多条暗线叠加。如果只盯着表象修，3 个月后还在原地。`,
      ``,
      `## 突破点`,
      `未来 90 天，把 80% 精力压在"能见度 + 关键决策"上，少做重复性勤奋：选 1 个跨部门项目、1 个向上汇报的节点、1 个对外发声的机会，先把"被看见"做出来。`,
      ``,
      `## 节奏`,
      `${stageLabel}的最佳窗口是"上探 + 横扩"：上探 1 个层级、横扩 2 个圈层。不要在低谷硬抗，等风来再起势。`,
      ``,
      `## 一句点题`,
      `顺势不是跟风，是把每一步都踩在势能的方向上。你已经走到该被看见的阶段，别再埋头。`,
    ].join('\n');
  };

  // 调用 /api/dify?type=career（SSE 流式）
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.concern.trim()) {
      setErrorMsg('请简单描述一下你当前的卡点');
      return;
    }
    setErrorMsg('');
    setPolished('');
    setStreaming(true);
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'career',
          query: buildQuery(form),
          user: `career-${(form.name || 'anon').slice(0, 8)}-${Date.now()}`,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        setErrorMsg(`请求失败：HTTP ${res.status}`);
        setStreaming(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';
      // SSE 解析
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const t = line.trim();
          if (!t || !t.startsWith('data:')) continue;
          const payload = t.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const obj = JSON.parse(payload);
            const ans = obj?.answer || obj?.data?.answer || obj?.message;
            if (ans) acc += ans;
          } catch { /* ignore non-JSON lines */ }
        }
        if (acc) setPolished(acc);
      }
      // Dify 返回过短时（mock 兜底或内容不足），用本地模板补全
      if (acc.length < 200) {
        const fallback = buildLocalFallback(form);
        setPolished(fallback);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setErrorMsg((err as Error).message || '网络异常');
      }
    } finally {
      setStreaming(false);
    }
  };

  // 重新生成
  const handleRetry = () => handleSubmit(new Event('submit') as unknown as FormEvent);

  // 从 polished 切 5 张 free
  const freeSections = splitPolishedToFreeCards(polished);
  const FREE_ICONS = ['🧬', '🧭', '⚔️', '⏰', '💎'];
  const FREE_TONES = [THEME_PRIMARY, THEME_ACCENT, THEME_PRIMARY, THEME_ACCENT, THEME_PRIMARY];

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      {/* ============ Hero ============ */}
      <section
        className="rounded-2xl shadow-xl p-6 mb-6 text-white"
        style={{
          background: `linear-gradient(135deg, ${THEME_DARK}, ${THEME_PRIMARY})`,
          fontFamily: FONT_KAI,
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">💼</span>
          <h1 className="text-2xl font-bold">AI 事业财富</h1>
        </div>
        <p className="text-amber-100 text-sm leading-relaxed">
          看清大势，顺势而为。<br />
          事业是天赋与世界相遇的方式。
        </p>
      </section>

      {/* ============ Form ============ */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl bg-white shadow-md p-5 mb-6 space-y-4 border"
        style={{ borderColor: THEME_ACCENT }}
      >
        <h2 className="text-lg font-bold" style={{ color: THEME_PRIMARY, fontFamily: FONT_KAI }}>
          📋 请简单填写 4 项
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>姓名（可选）</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="如：陆杰"
              className="w-full px-3 py-2 border border-amber-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
              style={{ fontFamily: FONT_KAI }}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>当前行业</label>
            <select
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="w-full px-3 py-2 border border-amber-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
              style={{ fontFamily: FONT_KAI }}
            >
              {INDUSTRY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>事业阶段</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {STAGE_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setForm({ ...form, careerStage: o.value as typeof form.careerStage })}
                  className="px-3 py-2 text-xs rounded-md border transition"
                  style={{
                    fontFamily: FONT_KAI,
                    backgroundColor: form.careerStage === o.value ? THEME_PRIMARY : 'white',
                    color: form.careerStage === o.value ? 'white' : THEME_PRIMARY,
                    borderColor: THEME_PRIMARY,
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>
            当前的卡点（必填）
          </label>
          <textarea
            value={form.concern}
            onChange={(e) => setForm({ ...form, concern: e.target.value })}
            rows={3}
            placeholder="是收入瓶颈？晋升难题？方向迷茫？转型抉择？"
            className="w-full px-3 py-2 border border-amber-200 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-400"
            style={{ fontFamily: FONT_KAI }}
            required
          />
        </div>

        {errorMsg && (
          <div className="text-sm text-red-600" style={{ fontFamily: FONT_KAI }}>⚠️ {errorMsg}</div>
        )}

        <button
          type="submit"
          disabled={streaming}
          className="w-full px-4 py-3 text-white font-bold rounded-md shadow-md transition disabled:opacity-60"
          style={{
            background: `linear-gradient(135deg, ${THEME_PRIMARY}, ${THEME_ACCENT})`,
            fontFamily: FONT_KAI,
          }}
        >
          {streaming ? '✨ AI 撰写中…' : '🔮 生成我的事业财富报告（免费）'}
        </button>
        <p className="text-xs text-gray-500 text-center" style={{ fontFamily: FONT_KAI }}>
          AI 会基于你的行业 / 阶段 / 卡点，给出 500-800 字顺势建议
        </p>
      </form>

      {/* ============ AI 流式报告区 ============ */}
      {(streaming || polished) && (
        <div id="career-report" className="space-y-6">
          <div>
            <PolishSection polished={polished} streaming={streaming} onRetry={handleRetry} />
          </div>

      {/* ============ 免费 5 大模块（基于 polished 切分）============ */}
      {freeSections.length > 0 && (
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-3 px-1">
            <h3
              className="text-lg font-bold flex items-center gap-2"
              style={{ color: THEME_PRIMARY, fontFamily: FONT_KAI }}
            >
              <span>🎁</span>
              <span>免费 5 大模块</span>
            </h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700"
              style={{ fontFamily: FONT_KAI }}
            >
              立即可读
            </span>
          </div>
          <div className="space-y-3">
            {freeSections.map((sec, i) => (
              <FreeCard
                key={i}
                index={i}
                meta={{
                  icon: FREE_ICONS[i] || '✨',
                  subtitle: '顺势观察',
                  tone: FREE_TONES[i] || THEME_PRIMARY,
                }}
                title={sec.title}
                content={sec.content}
                source="灵境尊者"
              />
            ))}
          </div>
        </div>
      )}

      {/* ============ 评分卡（无八字，用 polished 长度 + 一个固定等级）============ */}
      {polished && !streaming && (
        <div
          className="rounded-2xl shadow-md border p-5 mb-6 bg-white"
          style={{ borderColor: THEME_ACCENT }}
        >
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="bg-white rounded-xl p-2">
              <ScoreGauge
                score={Math.min(99, 60 + Math.floor(polished.length / 25))}
                label={
                  polished.length > 1500 ? '极佳 · 顺势而为'
                  : polished.length > 800 ? '良好 · 稳步推进'
                  : '基础 · 仍待深入'
                }
                themeColor={THEME_PRIMARY}
              />
            </div>
            <div className="flex-1" style={{ fontFamily: FONT_KAI }}>
              <div className="text-sm text-gray-600 mb-1">事业势能</div>
              <div className="text-base text-gray-800 leading-relaxed">
                基于你的「{form.industry} · {STAGE_OPTIONS.find(o => o.value === form.careerStage)?.label}」背景，
                AI 顺势顾问已生成 <strong>{polished.length}</strong> 字深度观察。
                <br />解锁下方 5 大模块，可获得具体的<strong>决策清单 / 节奏路线 / 心法</strong>。
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ 5 大深度模块（付费墙）============ */}
      <div>
        <div className="flex items-baseline justify-between mb-3 px-1">
          <h3
            className="text-lg font-bold flex items-center gap-2"
            style={{ color: THEME_PRIMARY, fontFamily: FONT_KAI }}
          >
            <span>🔒</span>
            <span>5 大深度模块</span>
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: `${THEME_PRIMARY}20`,
              color: THEME_PRIMARY,
              fontFamily: FONT_KAI,
            }}
          >
            会员 / 单解锁
          </span>
        </div>

        {userRole === 'member' || userRole === 'admin' ? (
          <div className="space-y-3">
            {PAID_CARD_META.map((meta) => (
              <div
                key={meta.key}
                className="rounded-xl border p-4 shadow-md"
                style={{
                  borderColor: '#34d399',
                  background: 'linear-gradient(135deg, #064e3b, #022c22)',
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: `${meta.tone}30`, color: meta.tone }}
                  >
                    {meta.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-amber-100" style={{ fontFamily: FONT_KAI }}>
                      {meta.title}
                    </h3>
                    <p className="mt-2 text-sm text-amber-100/80" style={{ fontFamily: FONT_KAI }}>
                      会员可查看完整内容（解锁后端到端展示）。
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PAID_CARD_META.map((meta, i) => (
                <LockedCard
                  key={meta.key}
                  index={i}
                  meta={meta}
                  title={meta.title}
                  chipPrefix="深度"
                />
              ))}
            </div>

            <div
              className="rounded-xl p-5 shadow-2xl border mt-4"
              style={{
                background: `linear-gradient(135deg, ${THEME_DARK}, ${THEME_PRIMARY})`,
                borderColor: THEME_ACCENT,
                color: 'white',
              }}
            >
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: FONT_KAI, color: THEME_ACCENT }}>
                  🔮 解锁 5 大事业财富深度模块
                </h3>
                <p className="text-sm text-amber-200" style={{ fontFamily: FONT_KAI }}>
                  覆盖 3 年蓝图 · 路径决策 · 收入跃迁 · 关键决策 · 顺势心法
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-3 text-center">
                  <div className="text-xs text-amber-200" style={{ fontFamily: FONT_KAI }}>单次解锁</div>
                  <div className="text-2xl font-bold mt-1">¥9.9</div>
                  <div className="text-[10px] text-amber-300 mt-0.5" style={{ fontFamily: FONT_KAI }}>仅限本报告</div>
                </div>
                <div
                  className="bg-white/20 backdrop-blur rounded-lg p-3 text-center ring-2 relative"
                  style={{ boxShadow: `0 0 0 2px ${THEME_ACCENT}` }}
                >
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded text-white"
                    style={{ backgroundColor: THEME_ACCENT, fontFamily: FONT_KAI }}
                  >
                    推荐
                  </div>
                  <div className="text-xs text-amber-200" style={{ fontFamily: FONT_KAI }}>月度会员</div>
                  <div className="text-2xl font-bold mt-1">¥39</div>
                  <div className="text-[10px] text-amber-300 mt-0.5" style={{ fontFamily: FONT_KAI }}>全站 6 大模块全解锁</div>
                </div>
              </div>

              <ReportPaywall
                userRole={userRole}
                freePart={polished.slice(0, 400)}
                premiumPart={PAID_CARD_META.map(c => c.title).join('\n')}
                premiumSections={PAID_CARD_META.map(c => c.title)}
                reportKey="career"
                accentClass="text-amber-200"
              />

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-amber-200">
                <div>
                  <div className="text-base">🛡️</div>
                  <div style={{ fontFamily: FONT_KAI }}>支付由 Polar.sh 保障</div>
                </div>
                <div>
                  <div className="text-base">🔒</div>
                  <div style={{ fontFamily: FONT_KAI }}>输入数据本地处理</div>
                </div>
                <div>
                  <div className="text-base">↩️</div>
                  <div style={{ fontFamily: FONT_KAI }}>7 天无理由退款</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 导出 PDF + 朗读（全站统一操作栏） */}
        <ReportActionBar
          targetId="career-report"
          ttsTitle="AI 事业财富报告"
          ttsTone="amber"
          ttsPrefix="以下是您的 AI 事业财富报告。"
          pdfFilename={`AI事业财富报告-${form.name || '匿名'}`}
          pdfTone="amber"
          className="pt-2"
        />
      </div>
    </div>
  )}

      <p
        className="text-center text-xs text-amber-700 mt-6"
        style={{ fontFamily: FONT_KAI }}
      >
        🌠 顺势而为，择时而动。明天记得来看看新的事业节奏。
      </p>
    </main>
  );
}
