'use client';

import { useState, type FormEvent } from 'react';
import type { UserRole } from '@/lib/auth';
import { handleDifyPolishResponse } from '@/lib/sse-client';
import ReportActionBar from '@/components/ReportActionBar';
import MiniMarkdown from '@/components/MiniMarkdown';

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

              {/* 付费墙（统一：价格卡片 + CTA + 信任徽标） */}
              <div className="mt-6 p-5 border border-dashed border-gray-400 rounded-lg bg-gray-50">
                <div className="text-sm font-medium mb-3 text-amber-700">🔒 完整报告仅对会员开放</div>
                <p className="text-sm text-gray-600 mb-3" style={{ fontFamily: FONT_KAI }}>
                  会员可查看 {5 + Object.keys(report.paid).length} 项深度分析（含穿搭 / 起居 / 游学 / 助旺 / 心法）
                </p>

                {/* 价格卡片：单次解锁 / 月度会员 并排 */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg border border-gray-200 bg-white p-3 text-center">
                    <div className="text-xs text-gray-500">单次解锁</div>
                    <div className="text-2xl font-bold text-gray-800 mt-1">¥9.9</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">仅限本报告</div>
                  </div>
                  <div className="rounded-lg border-2 border-amber-300 bg-amber-50 p-3 text-center relative">
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      推荐
                    </div>
                    <div className="text-xs text-amber-700">月度会员</div>
                    <div className="text-2xl font-bold text-amber-700 mt-1">¥29.9<span className="text-xs">/月</span></div>
                    <div className="text-[10px] text-amber-600 mt-0.5">全站 6 大模块全解锁</div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    className="flex-1 py-2 bg-white border border-[#2c2c2c] text-[#2c2c2c] rounded hover:bg-gray-50 transition-colors text-sm"
                    style={{ fontFamily: FONT_KAI }}
                  >
                    单次解锁 · ¥9.9
                  </button>
                  <button
                    className="flex-1 py-2 bg-[#b85a4a] text-white rounded hover:bg-[#9a4a3a] transition-colors text-sm"
                    style={{ fontFamily: FONT_KAI }}
                  >
                    升级会员 · 全站解锁
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center mt-2" style={{ fontFamily: FONT_KAI }}>
                  注册免费 · 7 天无理由退款
                </p>

                {/* 信任徽标：支付安全 / 本地计算 / 退款保障 */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[10px] text-gray-500">
                  <div>
                    <div className="text-base">🛡️</div>
                    <div>支付由 Polar.sh 保障</div>
                  </div>
                  <div>
                    <div className="text-base">🔒</div>
                    <div>先天格局本地计算</div>
                  </div>
                  <div>
                    <div className="text-base">↩️</div>
                    <div>7 天无理由退款</div>
                  </div>
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
                      来源：{polishSource === 'dify' ? '✨ 灵境尊者 · 子女教育指引' : '本地模板'}
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

              {/* 导出 PDF + 朗读（全站统一操作栏） */}
              <ReportActionBar
                targetId="education-report"
                ttsTitle="学业报告"
                ttsTone="violet"
                ttsPrefix="以下是您的学业报告。"
                pdfFilename={`学业报告-${report.input.name || '匿名'}`}
                pdfTone="violet"
                className="mt-6"
              />
            </div>
          )}
        </main>
      </div>
    </>
  );
}
