'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import type { UserRole } from '@/lib/auth';
import ReportPaywall from '@/components/ReportPaywall';
import type { WealthReport, Career } from '@/lib/wealth-rules';

// 主题色（与其他 guan 页面保持一致：每个模块一种主色）
const WEALTH_THEME = '#7a5a3a';   // 暗金 · 与"财富"语义匹配
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
    setPolished('');
    setPolishSource('');
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

  // 免费 / 付费内容拼接
  const freePart = report ? [
    report.free.origin.content,
    '',
    `【${report.free.fangxiang.title}】${report.free.fangxiang.content}`,
    '',
    `【${report.free.gongzhan.title}】${report.free.gongzhan.content}`,
    '',
    `【${report.free.shijian.title}】${report.free.shijian.content}`,
    '',
    `【${report.free.yishi.title}】${report.free.yishi.content}`,
  ].join('\n') : '';

  const premiumPart = report ? [
    `【${report.paid.qushi.title}】`,
    report.paid.qushi.content,
    '',
    `【${report.paid.jiating.title}】`,
    report.paid.jiating.content,
    '',
    `【${report.paid.guanli.title}】`,
    report.paid.guanli.content,
    '',
    `【${report.paid.fangkeng.title}】`,
    report.paid.fangkeng.content,
    '',
    `【${report.paid.zhidao.title}】`,
    report.paid.zhidao.content,
  ].join('\n') : '';

  const premiumSections = report ? [
    report.paid.qushi.title,
    report.paid.jiating.title,
    report.paid.guanli.title,
    report.paid.fangkeng.title,
    report.paid.zhidao.title,
  ] : [];

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
          <div id="wealth-report" className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-amber-200 p-6 mb-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-1">💎</div>
              <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: FONT_KAI }}>
                {report.input.name} · 事业智富报告
              </h2>
              <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: FONT_KAI }}>
                八字：<span className="text-amber-700">{report.bazi.yearGanzhi} {report.bazi.monthGanzhi} {report.bazi.dayGanzhi}</span>
                <span className="ml-2 text-gray-400">（{report.bazi.dayElement}）</span>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">
                  财星：{report.wealthSource.element}
                </span>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">
                  谋财：{report.careerType.type}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: FONT_KAI }}>
                职业：<strong>{report.career.label}</strong> · 匹配度 {report.career.matchLabel}
                <span className="mx-2">·</span>
                当前：<strong>{report.timing.season.label}（{report.timing.phase}）</strong>
                <span className="mx-2">·</span>
                建议工作方式：<strong>{report.careerType.workMode}</strong>
                <span className="ml-3 text-amber-700 font-bold">综合评分 {report.score}</span>
              </p>
            </div>

            {/* 免费 / 付费：复用 ReportPaywall */}
            <ReportPaywall
              userRole={userRole}
              freePart={polished && polishSource === 'dify'
                ? polished
                : freePart}
              premiumPart={premiumPart}
              premiumSections={premiumSections}
              reportKey="wealth"
              accentClass="text-amber-700"
            />

            {/* Dify 润色按钮（仅当还没润色时显示） */}
            {!polished && (
              <div className="mt-4 text-center">
                <button
                  onClick={handlePolish}
                  disabled={polishing}
                  className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ fontFamily: FONT_KAI }}
                >
                  {polishing ? '🤖 AI 润色中…' : '🤖 AI 智富心法润色（免费体验）'}
                </button>
                {polishSource && (
                  <p className="text-xs text-gray-400 mt-1">
                    数据来源：{polishSource === 'dify' ? 'Dify 智富顾问' : '本地模板（兜底）'}
                  </p>
                )}
              </div>
            )}

            {polished && polishSource === 'dify' && (
              <p className="text-xs text-gray-400 text-center mt-2">
                报告已通过 Dify 智富顾问润色 · 可滚动查看完整内容
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
