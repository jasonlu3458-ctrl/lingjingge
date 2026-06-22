'use client';

import { useState, type FormEvent, type ReactNode } from 'react';
import type { UserRole } from '@/lib/auth';
import { handleDifyPolishResponse } from '@/lib/sse-client';
import ExportPDFButton from '@/components/ExportPDFButton';
import ReportTTSButton from '@/components/ReportTTSButton';

// 轻量内联 Markdown 渲染器（替换 react-markdown@10）：
// react-markdown 是 ESM-only，Next.js 14 + RSC 静态/动态 import
// 都会在浏览器侧触发
//   "Cannot read properties of undefined (reading 'call')"
// 的 hydration 错误（mountLazyComponent → readChunk 失败）。
// Dify / 本地模板返回的文本结构很有限，** / ## / 列表 / 段落就够用。
function renderInline(text: string): ReactNode[] {
  // 处理 **加粗** 与 \n
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

    // 标题
    const h = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (h) {
      const level = h[1].length;
      const content = h[2];
      const cls = level === 1 ? 'text-lg font-bold mt-3' : level === 2 ? 'text-base font-bold mt-2' : 'text-sm font-bold mt-2';
      const Tag = (`h${level + 2}`) as 'h3' | 'h4' | 'h5';
      blocks.push(<Tag key={key++} className={cls}>{renderInline(content)}</Tag>);
      i++;
      continue;
    }

    // 无序列表（- / * 开头）
    if (/^[-*]\s+/.test(trimmed)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(<li key={items.length}>{renderInline(lines[i].trim().replace(/^[-*]\s+/, ''))}</li>);
        i++;
      }
      blocks.push(<ul key={key++} className="list-disc pl-5 space-y-1">{items}</ul>);
      continue;
    }

    // 有序列表
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(<li key={items.length}>{renderInline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>);
        i++;
      }
      blocks.push(<ol key={key++} className="list-decimal pl-5 space-y-1">{items}</ol>);
      continue;
    }

    // 普通段落：合并连续非空行
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

interface EducationPageClientProps {
  userRole: UserRole;
}

// 与其他 guan 页面保持一致的主题色（来自 pageConfigs.education.theme）
const EDUCATION_THEME = '#5a8a6a';
const FONT_KAI = "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif";

// ============================================================
// 学霸密码 · 通俗解释字典（地支/天干 → 自然语言解读）
// 孩子爸爸妈妈都能一眼看懂
// ============================================================
const WENCHANG_EXPLAIN: Record<string, string> = {
  '巳': '（东南方），代表孩子善于写作和表达；',
  '午': '（正南方），意味着孩子热情开朗，适合演讲；',
  '申': '（西南方），说明孩子逻辑思维强，擅长理科；',
  '酉': '（正西方），代表孩子语言天赋突出；',
  '亥': '（西北方），暗示孩子有很强的想象力和创造力；',
  '子': '（正北方），代表孩子专注力极佳；',
  '寅': '（东北方），说明孩子行动力强；',
  '卯': '（正东方），代表孩子学习新事物特别快。',
};

const XUETANG_EXPLAIN: Record<string, string> = {
  '己': '代表孩子适合通过实践和动手来学习；',
  '丙': '意味着孩子需要多一点引导和鼓励；',
  '戊': '说明孩子适合在稳定的环境中学习；',
  '辛': '代表孩子擅长精雕细琢的学习方式；',
  '甲': '暗示孩子自学能力强，喜欢主动探索。',
};

// 与 /api/education 返回的数据结构保持一致
interface EducationReport {
  input: { name: string; birthDate: string; calendarType: 'solar' | 'lunar'; grade: string };
  bazi: {
    yearGanzhi: string;
    monthGanzhi: string;
    dayGanzhi: string;
    yearZodiac: string;
    dayStem: string;
    yearBranch: string;
    solarDate: string;
    lunarDate: string;
  };
  season: { type: 'water' | 'fire'; label: string; range: string; monthLabel: string };
  free: {
    origin: { title: string; content: string; source: string };
    talent: { title: string; trait: string; style: string };
    code: {
      title: string;
      wenchang: string;
      xuetang: string;
      ciguan: string;
      huagai: string;
      guceng: string;
      guagu: string;
    };
    food: { title: string; content: string };
    studyRoom: {
      title: string;
      deskDirection: string;
      mascot: string;
      footpadColor: string;
      house: string;
    };
  };
  paid: {
    clothing: { title: string; content: string };
    housing: { title: string; content: string };
    travel: { title: string; content: string };
    boost: { title: string; content: string };
    mindset: { title: string; content: string };
  };
}

export default function EducationPageClient({ userRole }: EducationPageClientProps) {
  const [showModal, setShowModal] = useState(false);

  // 子女学业信息输入状态
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    birthDate: '',
    calendarType: 'solar' as 'solar' | 'lunar',
  });

  // 报告状态
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [report, setReport] = useState<EducationReport | null>(null);

  // 第五层：Dify 润色（解锁后才会调用）
  const [polishing, setPolishing] = useState(false);
  const [polished, setPolished] = useState<string>('');
  const [polishSource, setPolishSource] = useState<string>('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setReport(null);
    try {
      const res = await fetch('/api/education', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          birthDate: formData.birthDate,
          calendarType: formData.calendarType,
          grade: formData.grade,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setErrorMsg(json.error || '生成报告失败，请稍后再试');
        return;
      }
      setReport(json.data as EducationReport);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '网络异常，请稍后再试');
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
      const res = await fetch('/api/education/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          birthDate: formData.birthDate,
          calendarType: formData.calendarType,
          grade: formData.grade,
        }),
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

  return (
    <>
      {/* ====== 绿色主题外层（与其他 guan 页面一致） ====== */}
      <div className="flex flex-col" style={{ backgroundColor: EDUCATION_THEME }}>
        <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1 pb-32">
          {/* ====== 页面标题（与 ChatUI 一致：icon + title + subtitle） ====== */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🎓</div>
            <h1
              className="text-3xl font-bold text-gray-800 mb-2"
              style={{ fontFamily: FONT_KAI }}
            >
              子女学业 · 奎星点斗
            </h1>
            <p className="text-gray-600" style={{ fontFamily: FONT_KAI }}>
              奎宿主文，魁星点斗 —— 愿你的孩子学业有成，独占鳌头
            </p>
            <p className="text-xs text-gray-500 mt-1">
              源自《孝经援神契》· 奎星主文章，魁星踢斗
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-blue-700 hover:underline text-sm"
            >
              📜 学霸渊源（了解奎宿典故）
            </button>
          </div>

          {/* ====== 欢迎消息卡片（与其他 guan 页面一致） ====== */}
          <div className="bg-white bg-opacity-80 rounded-lg p-6 mb-6 text-center">
            <p className="text-lg text-gray-700" style={{ fontFamily: FONT_KAI }}>
              每一个孩子，都有自己的时区。
            </p>
          </div>

          {/* ====== 典故模态框 ====== */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">📜 奎宿 · 魁星典故</h2>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>
                    <strong>奎宿</strong>：掌管文化艺术的星宿，二十八宿中西方白虎七宿第一宿。
                  </p>
                  <p>
                    <strong>奎通魁</strong>：魁星踢斗，独占鳌头。奎星屈曲相钩，似文字之画，遂将奎星改为魁星。
                  </p>
                  <p>
                    <strong>典故</strong>：汉代《孝经援神契》记载&ldquo;奎主文章&rdquo;。宋均作注：
                    &ldquo;奎星的纹路曲折相勾，如同文字笔画，于是后人把奎星改称&lsquo;魁星&rsquo;。&rdquo;
                  </p>
                  <p>
                    清代顾炎武《日知录》中：&ldquo;如今世人供奉魁星，不知始于何时。原本奎星主文，所以建庙祭祀，可匠人画不出奎星的样貌，就把&lsquo;奎&rsquo;改成&lsquo;魁&rsquo;；又不好表现&lsquo;魁&rsquo;字，就拆解字形，画成鬼举足踢斗的样子。&rdquo;
                  </p>
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

          {/* ====== 信息输入区卡片（与 ChatUI 表单卡片样式一致） ====== */}
          <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
            <h2
              className="text-lg font-bold text-gray-800 mb-4"
              style={{ fontFamily: FONT_KAI }}
            >
              📝 请输入孩子的信息
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{ fontFamily: FONT_KAI }}
                >
                  孩子姓名
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                  style={{ fontFamily: FONT_KAI }}
                  placeholder="请输入孩子姓名"
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{ fontFamily: FONT_KAI }}
                >
                  当前年级
                </label>
                <input
                  type="text"
                  value={formData.grade}
                  onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                  style={{ fontFamily: FONT_KAI }}
                  placeholder="如：小学三年级"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{ fontFamily: FONT_KAI }}
                >
                  出生日期
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800"
                  style={{ fontFamily: FONT_KAI }}
                  required
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 mb-2"
                  style={{ fontFamily: FONT_KAI }}
                >
                  历法选择
                </label>
                <div className="flex gap-6 mt-1">
                  <label className="flex items-center gap-2" style={{ fontFamily: FONT_KAI }}>
                    <input
                      type="radio"
                      value="solar"
                      checked={formData.calendarType === 'solar'}
                      onChange={e => setFormData({ ...formData, calendarType: e.target.value as 'solar' | 'lunar' })}
                      className="w-4 h-4"
                    />
                    <span>阳历</span>
                  </label>
                  <label className="flex items-center gap-2" style={{ fontFamily: FONT_KAI }}>
                    <input
                      type="radio"
                      value="lunar"
                      checked={formData.calendarType === 'lunar'}
                      onChange={e => setFormData({ ...formData, calendarType: e.target.value as 'solar' | 'lunar' })}
                      className="w-4 h-4"
                    />
                    <span>农历</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ fontFamily: FONT_KAI }}
              >
                {loading ? '⏳ 排盘中…' : '✨ 生成学业报告'}
              </button>

              {errorMsg && (
                <p className="text-sm text-red-600 text-center" style={{ fontFamily: FONT_KAI }}>
                  {errorMsg}
                </p>
              )}
            </form>
          </div>

          {/* ====== 报告展示区 ====== */}
          {report && (
            <div id="education-report" className="bg-white bg-opacity-80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-6 mb-6">
              <h2
                className="text-xl font-bold text-gray-800 mb-2"
                style={{ fontFamily: FONT_KAI }}
              >
                🎓 {report.input.name} 的学业报告
              </h2>
              <p className="text-xs text-gray-500 mb-4" style={{ fontFamily: FONT_KAI }}>
                生肖 {report.bazi.yearZodiac} · 日主 {report.bazi.dayGanzhi}（{report.bazi.dayStem}）· {report.season.label}
                {report.input.grade ? ` · ${report.input.grade}` : ''}
              </p>

              {/* 免费报告 5 项 */}
              <div className="space-y-4">
                {/* 1. 学霸渊源 */}
                <div className="p-4 border rounded-lg bg-amber-50">
                  <h3 className="font-bold text-lg" style={{ fontFamily: FONT_KAI }}>
                    📜 {report.free.origin.title}
                  </h3>
                  <p className="text-sm text-gray-700 mt-2" style={{ fontFamily: FONT_KAI }}>
                    {report.free.origin.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">—— {report.free.origin.source}</p>
                </div>

                {/* 2. 学霸特质 */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-bold text-lg" style={{ fontFamily: FONT_KAI }}>
                    🧠 {report.free.talent.title}
                  </h3>
                  <p className="text-sm text-gray-700 mt-2" style={{ fontFamily: FONT_KAI }}>
                    {report.free.talent.trait}。
                  </p>
                  <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: FONT_KAI }}>
                    💡 {report.free.talent.style}。
                  </p>
                </div>

                {/* 3. 学霸密码（通俗解释版） */}
                <div className="p-4 border rounded-lg bg-white mt-4">
                  <h3 className="font-bold text-lg" style={{ fontFamily: FONT_KAI }}>
                    🔐 {report.free.code.title}
                  </h3>
                  <div className="mt-2 text-sm text-gray-700 leading-relaxed space-y-2" style={{ fontFamily: FONT_KAI }}>
                    {/* 文昌解释 */}
                    <p>
                      你的孩子文昌星在 <strong>{report.free.code.wenchang}</strong> 位，
                      {WENCHANG_EXPLAIN[report.free.code.wenchang as keyof typeof WENCHANG_EXPLAIN] || '此处文昌位对孩子学习有正向加持。'}
                    </p>
                    {/* 学堂解释 */}
                    <p>
                      学堂星落在 <strong>{report.free.code.xuetang}</strong> 位，
                      {XUETANG_EXPLAIN[report.free.code.xuetang as keyof typeof XUETANG_EXPLAIN] || '此处学堂位有利于孩子的学习方式。'}
                    </p>
                    {/* 词馆/华盖/孤辰寡宿 一并解释 */}
                    <p className="mt-2 border-t pt-2 border-gray-100">
                      词馆星在 <strong>{report.free.code.ciguan}</strong> 位，华盖星在 <strong>{report.free.code.huagai}</strong> 位，
                      暗示孩子有独特的创造力；
                      孤辰在 <strong>{report.free.code.guceng}</strong> 位，寡宿在 <strong>{report.free.code.guagu}</strong> 位，
                      这些小星宿代表着孩子有时喜欢独立思考，家长不必过于担心，顺其自然即可。
                    </p>
                  </div>
                </div>

                {/* 4. 学霸饮食 */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-bold text-lg" style={{ fontFamily: FONT_KAI }}>
                    🥗 {report.free.food.title}
                  </h3>
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-line" style={{ fontFamily: FONT_KAI }}>
                    {report.free.food.content}
                  </p>
                </div>

                {/* 5. 学霸书房 */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-bold text-lg" style={{ fontFamily: FONT_KAI }}>
                    📚 {report.free.studyRoom.title}
                  </h3>
                  <ul className="text-sm text-gray-700 mt-2 space-y-1" style={{ fontFamily: FONT_KAI }}>
                    <li>🧭 书桌方位（{report.season.label}）：{report.free.studyRoom.deskDirection}</li>
                    <li>🧸 吉祥物（{report.season.label}）：{report.free.studyRoom.mascot}</li>
                    <li>👟 脚垫颜色：{report.free.studyRoom.footpadColor}</li>
                  </ul>
                  <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: FONT_KAI }}>
                    🏠 {report.free.studyRoom.house}
                  </p>
                </div>
              </div>

              {/* 付费墙 / Dify 润色入口 */}
              <div className="mt-6 p-4 border-2 border-green-200 rounded-lg bg-green-50 text-center">
                <h3 className="text-lg font-bold text-gray-800" style={{ fontFamily: FONT_KAI }}>
                  🔓 解锁完整报告
                </h3>
                <p className="text-sm text-gray-600 mt-1" style={{ fontFamily: FONT_KAI }}>
                  获取全部 {5 + Object.keys(report.paid).length} 项深度分析（含穿搭 / 起居 / 游学 / 助旺 / 心法）
                </p>
                <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                    style={{ fontFamily: FONT_KAI }}
                  >
                    单次解锁 9.9元
                  </button>
                  <button
                    className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
                    style={{ fontFamily: FONT_KAI }}
                  >
                    开通会员 29.9元/月
                  </button>
                </div>
              </div>

              {/* 润色结果展示区 */}
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
                    <div
                      className="prose prose-stone max-w-none text-sm"
                      style={{ fontFamily: FONT_KAI }}
                    >
                      <MiniMarkdown text={polished} />
                    </div>
                  )}
                </div>
              )}

              {/* 导出 PDF + 朗读 */}
              <div className="mt-6 text-center flex flex-col sm:flex-row gap-2 sm:justify-center">
                <ReportTTSButton
                  targetId="education-report"
                  title="学业报告"
                  tone="violet"
                  prefix="以下是您的学业报告。"
                />
                <ExportPDFButton
                  targetId="education-report"
                  filename={`学业报告-${report.input.name || '匿名'}`}
                  tone="gray"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
