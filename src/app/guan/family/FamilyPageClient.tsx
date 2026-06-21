'use client';

import { useState, useMemo, type FormEvent, type ReactNode } from 'react';
import type { UserRole } from '@/lib/auth';
import ReportPaywall from '@/components/ReportPaywall';
import ExportPDFButton from '@/components/ExportPDFButton';
import { handleDifyPolishResponse } from '@/lib/sse-client';
import type {
  MarriageReport,
  Gender,
  CalendarType,
  RelationshipStatus,
  PainPoint,
} from '@/lib/marriage-rules';

// ============================================================
// 轻量内联 Markdown 渲染器（与 EducationPageClient 保持一致）
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
      const content = h[2];
      const cls = level === 1 ? 'text-lg font-bold mt-3' : 'text-base font-bold mt-2';
      const Tag = (`h${level + 2}`) as 'h3' | 'h4';
      blocks.push(<Tag key={key++} className={cls}>{renderInline(content)}</Tag>);
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
// 主题与字体（与 pageConfigs 旧 family 主题一致：玫瑰红 #c45a6a）
// ============================================================
const FAMILY_THEME = '#c45a6a';
const FONT_KAI = "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif";

// 23:00-01:00 包含跨日，单独标注
const HOUR_OPTIONS: { value: number; label: string }[] = [
  { value: 23, label: '23:00-01:00（子时，跨日）' },
  { value: 1, label: '01:00-03:00（丑时）' },
  { value: 3, label: '03:00-05:00（寅时）' },
  { value: 5, label: '05:00-07:00（卯时）' },
  { value: 7, label: '07:00-09:00（辰时）' },
  { value: 9, label: '09:00-11:00（巳时）' },
  { value: 11, label: '11:00-13:00（午时）' },
  { value: 13, label: '13:00-15:00（未时）' },
  { value: 15, label: '15:00-17:00（申时）' },
  { value: 17, label: '17:00-19:00（酉时）' },
  { value: 19, label: '19:00-21:00（戌时）' },
  { value: 21, label: '21:00-23:00（亥时）' },
  { value: -1, label: '⏳ 时间不详' },
];

const RELATIONSHIP_LABELS: Record<RelationshipStatus, string> = {
  'dating': '🌱 恋爱中',
  'early-marriage': '💍 已婚（早期）',
  'long-marriage': '🏡 已婚（多年）',
  'crisis': '⚠️ 面临危机',
};

const PAIN_POINT_OPTIONS: { value: PainPoint; label: string; emoji: string }[] = [
  { value: 'personality', label: '性格是否互补', emoji: '🧬' },
  { value: 'inlaws', label: '婚后家庭/婆媳关系', emoji: '🏠' },
  { value: 'wealth', label: '双方财运', emoji: '💰' },
  { value: 'children', label: '子女缘分', emoji: '👶' },
  { value: 'private', label: '亲密关系和谐度', emoji: '🌹' },
];

// ============================================================
// 主组件
// ============================================================
interface FamilyPageClientProps {
  userRole: UserRole;
}

interface PersonForm {
  name: string;
  gender: Gender;
  birthDate: string;
  birthHour: number;
  calendarType: CalendarType;
}

const EMPTY_PERSON: PersonForm = {
  name: '',
  gender: 'female',
  birthDate: '',
  birthHour: 12,
  calendarType: 'solar',
};

export default function FamilyPageClient({ userRole }: FamilyPageClientProps) {
  // 双人表单
  const [self, setSelf] = useState<PersonForm>({ ...EMPTY_PERSON, gender: 'female' });
  const [partner, setPartner] = useState<PersonForm>({ ...EMPTY_PERSON, gender: 'male' });

  // 关系状态 + 痛点
  const [relationshipStatus, setRelationshipStatus] = useState<RelationshipStatus>('dating');
  const [painPoints, setPainPoints] = useState<PainPoint[]>([]);
  const [showPrivate, setShowPrivate] = useState(false);

  // 单人 / 双人 模式判断
  // 姓名 + 公历/农历日期 都填齐 → 双人；否则走单人「个人姻缘画像」
  const isPartnerFilled = useMemo(
    () => !!(partner.name && partner.name.trim() && partner.birthDate),
    [partner.name, partner.birthDate]
  );

  // 报告
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [report, setReport] = useState<MarriageReport | null>(null);

  // 润色
  const [polishing, setPolishing] = useState(false);
  const [polished, setPolished] = useState('');
  const [polishSource, setPolishSource] = useState('');

  // 痛点切换
  const togglePainPoint = (p: PainPoint) => {
    setPainPoints(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  // 提交
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setReport(null);
    setPolished('');
    setPolishSource('');
    try {
      // 单人模式：不传 partner / painPoints / relationshipStatus
      const body: Record<string, unknown> = {
        self: { ...self, birthHour: self.birthHour === -1 ? 12 : self.birthHour },
      };
      if (isPartnerFilled) {
        body.partner = { ...partner, birthHour: partner.birthHour === -1 ? 12 : partner.birthHour };
        body.relationshipStatus = relationshipStatus;
        body.painPoints = painPoints;
      }
      const res = await fetch('/api/marriage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.error || '生成报告失败');
        return;
      }
      setReport(json.data as MarriageReport);
      // 滚到报告区
      setTimeout(() => {
        document.getElementById('family-report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '网络异常');
    } finally {
      setLoading(false);
    }
  };

  // Dify 润色（SSE 流式）
  const handlePolish = async () => {
    setPolishing(true);
    setPolished('');
    setPolishSource('streaming');
    setErrorMsg('');
    try {
      // 单人模式不传 partner
      const body: Record<string, unknown> = {
        self: { ...self, birthHour: self.birthHour === -1 ? 12 : self.birthHour },
      };
      if (isPartnerFilled) {
        body.partner = { ...partner, birthHour: partner.birthHour === -1 ? 12 : partner.birthHour };
        body.relationshipStatus = relationshipStatus;
        body.painPoints = painPoints;
      }
      const res = await fetch('/api/marriage/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setErrorMsg(`HTTP ${res.status}`);
        return;
      }
      await handleDifyPolishResponse(res, {
        setPolished,
        setPolishSource,
        setErrorMsg,
      });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '网络异常');
    } finally {
      setPolishing(false);
    }
  };

  // 准备 ReportPaywall 的免费/付费内容
  const isSingle = report?.personCount === 'single';
  const partnerName = report?.input.partner.name || '对方';

  const freePart = report
    ? (isSingle
        ? [
            `## ${report.free.overview.title}`,
            report.free.overview.content,
            '',
            `【${report.free.personality.title}】`,
            `${report.input.self.name}：${report.free.personality.selfTrait}`,
            `理想对象：${report.free.personality.partnerTrait}`,
            `配偶宫：${report.free.personality.blend}`,
            '',
            `【${report.free.coreMatch.title}】`,
            ...report.free.coreMatch.bullets.map(b => `· ${b}`),
            '',
            `【${report.free.tips.title}】`,
            ...report.free.tips.items.map((t, i) => `${i + 1}. ${t}`),
            '',
            `> 💡 想知道未来伴侣的具体模样？现在填上「对方」的信息即可解锁【双人合婚】。`,
          ].join('\n')
        : [
            report.free.overview.content,
            '',
            `【${report.free.personality.title}】`,
            `${report.input.self.name}：${report.free.personality.selfTrait}`,
            `${partnerName}：${report.free.personality.partnerTrait}`,
            `融合：${report.free.personality.blend}`,
            '',
            `【${report.free.coreMatch.title}】`,
            ...report.free.coreMatch.bullets.map(b => `· ${b}`),
            '',
            `【${report.free.tips.title}】`,
            ...report.free.tips.items.map((t, i) => `${i + 1}. ${t}`),
          ].join('\n'))
    : '';

  const premiumPart = report ? (isSingle
    ? [
        `【${report.paid.yearlyFortune.title}】`,
        ...report.paid.yearlyFortune.years.map(y => `${y.year}年：${y.theme}。${y.advice}`),
        '',
        `【${report.paid.weddingTiming.title}】`,
        `最佳感情时点：${report.paid.weddingTiming.bestYear} 年（${report.paid.weddingTiming.bestMonth}）`,
        `理由：${report.paid.weddingTiming.reason}`,
        '',
        `【${report.paid.fengShui.title}】`,
        `卧室：${report.paid.fengShui.bedroom}`,
        `客厅：${report.paid.fengShui.livingRoom}`,
        `桃花位：${report.paid.fengShui.coupleCorner}`,
        `物品建议：${report.paid.fengShui.items}`,
      ].join('\n')
    : [
        `【${report.paid.yearlyFortune.title}】`,
        ...report.paid.yearlyFortune.years.map(y => `${y.year}年：${y.theme}。${y.advice}`),
        '',
        `【${report.paid.weddingTiming.title}】`,
        `最佳结婚年份：${report.paid.weddingTiming.bestYear} 年`,
        `最佳结婚月份：${report.paid.weddingTiming.bestMonth}`,
        `理由：${report.paid.weddingTiming.reason}`,
        '',
        `【${report.paid.fengShui.title}】`,
        `卧室：${report.paid.fengShui.bedroom}`,
        `客厅：${report.paid.fengShui.livingRoom}`,
        `夫妻位：${report.paid.fengShui.coupleCorner}`,
        `物品建议：${report.paid.fengShui.items}`,
      ].join('\n')) : '';

  return (
    <div className="flex flex-col" style={{ backgroundColor: FAMILY_THEME }}>
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 pb-32">
        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">💞</div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ fontFamily: FONT_KAI }}>
            婚姻家庭 · 一生一会
          </h1>
          <p className="text-white/80 text-sm" style={{ fontFamily: FONT_KAI }}>
            懂彼此，知进退，方可安顿一生的情与家
          </p>
          <p className="text-xs text-white/60 mt-1" style={{ fontFamily: FONT_KAI }}>
            源自《礼记·昏义》· 昏礼者，将合二姓之好
          </p>
        </div>

        {/* 仪式感引言卡 */}
        <div className="bg-white/85 backdrop-blur-sm rounded-lg p-6 mb-6 text-center border border-rose-200">
          <p className="text-lg text-rose-900" style={{ fontFamily: FONT_KAI }}>
            "懂彼此，知进退，方可安顿一生的情与家。"
          </p>
          <p className="text-xs text-rose-700/70 mt-2" style={{ fontFamily: FONT_KAI }}>
            —— 献给天下男女的枕下风水秘籍
          </p>
        </div>

        {/* 表单卡 */}
        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-rose-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4" style={{ fontFamily: FONT_KAI }}>
            🪷 请填写双方信息
          </h2>

          {/* 单人模式引导：未填对方时的小提示 */}
          {!isPartnerFilled && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-700" style={{ fontFamily: FONT_KAI }}>
              ✨ 当前为「<strong>个人姻缘画像</strong>」模式 —— 下方填上「对方」信息即可解锁「双人合婚」。
            </div>
          )}

          {/* 双人并排：左右镜像 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PersonColumn
              title="🪷 我"
              data={self}
              onChange={setSelf}
              accent="rose"
            />
            <div className="relative">
              <PersonColumn
                title="🌸 对方"
                data={partner}
                onChange={setPartner}
                accent="amber"
                disabled={!isPartnerFilled}
              />
              {/* 单人模式：对方列半透明灰底 + 引导文案 */}
              {!isPartnerFilled && (
                <div
                  className="absolute inset-0 rounded-lg bg-gray-200/70 backdrop-blur-[1px] flex items-center justify-center pointer-events-none"
                  style={{ fontFamily: FONT_KAI }}
                >
                  <p className="text-center text-gray-700 text-sm px-6 leading-relaxed">
                    <span className="block text-base font-semibold mb-1">🔒 双人合婚未解锁</span>
                    <span className="text-xs text-gray-500">
                      *请在下方输入对方信息，即可解锁双人合盘*
                    </span>
                    <br />
                    <span className="text-xs text-rose-600 mt-2 inline-block">
                      （继续填写即可激活「对方」列）
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 关系状态 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: FONT_KAI }}>
              💕 当前关系状态
              <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={relationshipStatus}
              onChange={e => setRelationshipStatus(e.target.value as RelationshipStatus)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-400"
              style={{ fontFamily: FONT_KAI }}
              required
            >
              {(Object.keys(RELATIONSHIP_LABELS) as RelationshipStatus[]).map(s => (
                <option key={s} value={s}>{RELATIONSHIP_LABELS[s]}</option>
              ))}
            </select>
          </div>

          {/* 痛点多选胶囊 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-3" style={{ fontFamily: FONT_KAI }}>
              🎯 你们最想了解以下哪方面？（多选）
            </label>
            <div className="flex flex-wrap gap-2">
              {PAIN_POINT_OPTIONS.filter(p => p.value !== 'private').map(p => {
                const active = painPoints.includes(p.value);
                return (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => togglePainPoint(p.value)}
                    className={`px-4 py-2 rounded-full text-sm transition-all border ${
                      active
                        ? 'bg-rose-100 border-rose-400 text-rose-800'
                        : 'bg-white border-gray-300 text-gray-600 hover:border-rose-300'
                    }`}
                    style={{ fontFamily: FONT_KAI }}
                  >
                    {p.emoji} {p.label}
                  </button>
                );
              })}
              {/* 私密话题：默认折叠为"私密话题" */}
              {!showPrivate ? (
                <button
                  type="button"
                  onClick={() => setShowPrivate(true)}
                  className="px-4 py-2 rounded-full text-sm bg-gray-50 border border-dashed border-gray-300 text-gray-500 hover:border-rose-300"
                  style={{ fontFamily: FONT_KAI }}
                >
                  🔒 私密话题
                </button>
              ) : (
                <button
                  key="private"
                  type="button"
                  onClick={() => togglePainPoint('private')}
                  className={`px-4 py-2 rounded-full text-sm transition-all border ${
                    painPoints.includes('private')
                      ? 'bg-rose-100 border-rose-400 text-rose-800'
                      : 'bg-white border-gray-300 text-gray-600 hover:border-rose-300'
                  }`}
                  style={{ fontFamily: FONT_KAI }}
                >
                  🌹 亲密关系和谐度
                </button>
              )}
            </div>
          </div>

          {/* 提交 */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-rose-700 text-white py-3 rounded-lg font-semibold hover:bg-rose-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ fontFamily: FONT_KAI }}
          >
            {loading
              ? '⏳ 排盘中…'
              : isPartnerFilled
                ? '🙏 生成专属合婚报告'
                : '✨ 生成我的单人姻缘解析'}
          </button>

          {errorMsg && (
            <p className="text-sm text-red-600 text-center mt-3" style={{ fontFamily: FONT_KAI }}>
              {errorMsg}
            </p>
          )}
        </form>

        {/* 报告展示区 */}
        {report && (
          <div id="family-report" className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-rose-200 p-6 mb-6">
            <div className="text-center mb-4">
              <div className="text-3xl mb-1">{isSingle ? '🌸' : '💞'}</div>
              <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: FONT_KAI }}>
                {isSingle
                  ? `${report.input.self.name} · 你 · 一个人的姻缘密码`
                  : `${report.input.self.name} ❤️ ${report.input.partner.name}`}
              </h2>
              {isSingle ? (
                <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: FONT_KAI }}>
                  八字：<span className="text-rose-700">{report.selfBazi.yearGanzhi} {report.selfBazi.monthGanzhi} {report.selfBazi.dayGanzhi}</span>
                  <span className="ml-2 text-gray-400">（{report.selfBazi.fiveElement}）</span>
                  {report.personal && (
                    <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs">
                      桃花：{report.personal.peachBlossom.label}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1" style={{ fontFamily: FONT_KAI }}>
                  合婚分数：<span className="text-2xl font-bold text-rose-700">{report.compatibility!.score}</span> 分
                  <span className="ml-2 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-xs">
                    {report.compatibility!.level}
                  </span>
                </p>
              )}
              {!isSingle && (
                <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: FONT_KAI }}>
                  {report.input.self.name}：{report.selfBazi.yearGanzhi} {report.selfBazi.monthGanzhi} {report.selfBazi.dayGanzhi}（{report.selfBazi.fiveElement}）
                  {'  ·  '}
                  {report.input.partner.name}：{report.partnerBazi!.yearGanzhi} {report.partnerBazi!.monthGanzhi} {report.partnerBazi!.dayGanzhi}（{report.partnerBazi!.fiveElement}）
                </p>
              )}
            </div>

            {/* 免费报告 4 项 + ReportPaywall */}
            <ReportPaywall
              userRole={userRole}
              freePart={freePart}
              premiumPart={premiumPart}
              premiumSections={['未来 3 年流年', '最佳结婚年份与月份', '婚后风水布局']}
              reportKey="marriage"
              accentClass="text-rose-600"
            />

            {/* 润色结果 */}
            {(polishing || polished) && (
              <div className="mt-6 p-5 border rounded-lg bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: FONT_KAI }}>
                    ✨ 完整版自然语言报告
                  </h3>
                  <span className="text-xs text-gray-400">
                    来源：{polishSource === 'dify' ? '🤖 Dify 润色' : '📋 本地模板'}
                  </span>
                </div>
                {polishing ? (
                  <p className="text-sm text-gray-500" style={{ fontFamily: FONT_KAI }}>正在润色中，请稍候…</p>
                ) : (
                  <div className="prose prose-stone max-w-none text-sm" style={{ fontFamily: FONT_KAI }}>
                    <MiniMarkdown text={polished} />
                  </div>
                )}
              </div>
            )}

            {/* 导出 PDF */}
            <div className="mt-6 text-center">
              <ExportPDFButton
                targetId="family-report"
                filename={`姻缘报告-${report.input.self.name || '匿名'}`}
                tone="rose"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// ============================================================
// 子组件：单边人员输入列
// ============================================================
interface PersonColumnProps {
  title: string;
  data: PersonForm;
  onChange: (next: PersonForm) => void;
  accent: 'rose' | 'amber';
  disabled?: boolean;   // 单人模式：对方列半透灰
}

function PersonColumn({ title, data, onChange, accent, disabled }: PersonColumnProps) {
  const borderClass = accent === 'rose' ? 'border-rose-200' : 'border-amber-200';
  const ringClass = accent === 'rose' ? 'focus:ring-rose-400' : 'focus:ring-amber-400';

  return (
    <div className={`p-4 border-2 ${borderClass} rounded-lg bg-white/60 ${disabled ? 'opacity-50' : ''}`}>
      <h3 className="text-base font-bold text-gray-800 mb-3" style={{ fontFamily: FONT_KAI }}>
        {title}
      </h3>

      {/* 姓名 */}
      <div className="mb-3">
        <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>姓名 *</label>
        <input
          type="text"
          value={data.name}
          onChange={e => onChange({ ...data, name: e.target.value })}
          maxLength={20}
          required
          disabled={disabled}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${ringClass} text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          style={{ fontFamily: FONT_KAI }}
          placeholder="请输入姓名"
        />
      </div>

      {/* 性别 */}
      <div className="mb-3">
        <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>性别 *</label>
        <div className="flex gap-4">
          <label className={`flex items-center gap-1 text-sm ${disabled ? 'cursor-not-allowed' : ''}`} style={{ fontFamily: FONT_KAI }}>
            <input
              type="radio"
              value="female"
              checked={data.gender === 'female'}
              onChange={() => onChange({ ...data, gender: 'female' })}
              disabled={disabled}
            />
            <span>女</span>
          </label>
          <label className={`flex items-center gap-1 text-sm ${disabled ? 'cursor-not-allowed' : ''}`} style={{ fontFamily: FONT_KAI }}>
            <input
              type="radio"
              value="male"
              checked={data.gender === 'male'}
              onChange={() => onChange({ ...data, gender: 'male' })}
              disabled={disabled}
            />
            <span>男</span>
          </label>
        </div>
      </div>

      {/* 出生日期 */}
      <div className="mb-3">
        <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>出生日期 *</label>
        <input
          type="date"
          value={data.birthDate}
          onChange={e => onChange({ ...data, birthDate: e.target.value })}
          required
          disabled={disabled}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${ringClass} text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          style={{ fontFamily: FONT_KAI }}
        />
      </div>

      {/* 出生时辰 */}
      <div className="mb-3">
        <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>出生时辰</label>
        <select
          value={data.birthHour}
          onChange={e => onChange({ ...data, birthHour: Number(e.target.value) })}
          disabled={disabled}
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 ${ringClass} text-sm ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          style={{ fontFamily: FONT_KAI }}
        >
          {HOUR_OPTIONS.map(h => (
            <option key={h.value} value={h.value}>{h.label}</option>
          ))}
        </select>
      </div>

      {/* 历法 */}
      <div>
        <label className="block text-xs text-gray-600 mb-1" style={{ fontFamily: FONT_KAI }}>历法 *</label>
        <div className="flex gap-4">
          <label className={`flex items-center gap-1 text-sm ${disabled ? 'cursor-not-allowed' : ''}`} style={{ fontFamily: FONT_KAI }}>
            <input
              type="radio"
              value="solar"
              checked={data.calendarType === 'solar'}
              onChange={() => onChange({ ...data, calendarType: 'solar' })}
              disabled={disabled}
            />
            <span>阳历</span>
          </label>
          <label className={`flex items-center gap-1 text-sm ${disabled ? 'cursor-not-allowed' : ''}`} style={{ fontFamily: FONT_KAI }}>
            <input
              type="radio"
              value="lunar"
              checked={data.calendarType === 'lunar'}
              onChange={() => onChange({ ...data, calendarType: 'lunar' })}
              disabled={disabled}
            />
            <span>农历</span>
          </label>
        </div>
      </div>
    </div>
  );
}
