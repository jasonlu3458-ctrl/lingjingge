'use client';

import { useState } from 'react';

// —— 三张知识卡片：饮食 / 作息 / 护理 ——
const CARE_GUIDES = [
  {
    id: 'diet',
    icon: '🥣',
    title: '饮食',
    subtitle: '科学喂养，五行调和',
    points: [
      '定时定量：每日两餐，辰时与申时为佳，避免戌时后喂食',
      '因宠而异：犬宜杂食、猫需高蛋白、鸟类少油脂、鱼类忌浊水',
      '忌食清单：巧克力、洋葱、葡萄、过量盐分与生蛋',
      '饮水要勤：每日换水两次，水温与室温相近为宜',
    ],
  },
  {
    id: 'routine',
    icon: '🌙',
    title: '作息',
    subtitle: '顺应天时，安神养性',
    points: [
      '日间活动：保证每日 30–60 分钟陪伴互动，消耗过剩精力',
      '夜眠环境：窝垫避开通风直吹与镜面反射，宜静宜暗',
      '生物钟规律：固定起床、喂食、散步时间，减少焦虑',
      '季节调整：春夏早起活动、秋冬晚起保暖，顺应四时',
    ],
  },
  {
    id: 'care',
    icon: '🪮',
    title: '护理',
    subtitle: '洁净身心，气血通畅',
    points: [
      '梳毛通络：每日梳理 5 分钟，既能去浮毛，又能通气血',
      '洗浴有度：犬猫每月 1–2 次，水温 38℃ 左右，避开耳朵眼睛',
      '爪牙检查：每周修剪指甲一次，定期清洁牙齿与耳道',
      '情志关怀：观察眼神与食欲，及时发现情绪波动并安抚',
    ],
  },
];

// —— 测一测养宠习惯：5 道单选题 ——
const QUIZ_QUESTIONS = [
  {
    q: '你通常在什么时间为爱宠喂食早餐？',
    options: [
      { text: '辰时（7–9 点）', score: 2 },
      { text: '中午前后', score: 1 },
      { text: '想什么时候就什么时候', score: 0 },
    ],
  },
  {
    q: '爱宠的饮水习惯是？',
    options: [
      { text: '每日换水 1–2 次，干净新鲜', score: 2 },
      { text: '看到水少了再添', score: 1 },
      { text: '很久才换一次', score: 0 },
    ],
  },
  {
    q: '你多久为爱宠梳一次毛？',
    options: [
      { text: '每日一次', score: 2 },
      { text: '每周一次', score: 1 },
      { text: '几乎不梳', score: 0 },
    ],
  },
  {
    q: '爱宠的睡眠窝垫位置如何？',
    options: [
      { text: '安静避风，远离镜子与门口', score: 2 },
      { text: '随意放置，方便就好', score: 1 },
      { text: '靠门口或镜子旁', score: 0 },
    ],
  },
  {
    q: '当你发现爱宠情绪低落时，你会？',
    options: [
      { text: '陪伴安抚，观察食欲与精神状态', score: 2 },
      { text: '给点零食逗一逗', score: 1 },
      { text: '等它自己好起来', score: 0 },
    ],
  },
];

// —— 根据总分返回评估结果 ——
function getQuizResult(score: number) {
  if (score >= 8) {
    return {
      level: '🪷 上善之主',
      desc: '你与爱宠心意相通，起居有度，福泽相依。继续保持这份温柔与细致，家宅气场亦因你而安。',
    };
  }
  if (score >= 4) {
    return {
      level: '🌿 渐入佳境',
      desc: '你已具备良好的养宠基础，再稍加用心于细节，便能让爱宠的身心更加舒展自在。',
    };
  }
  return {
    level: '🌱 初心可期',
    desc: '养宠之路在于点滴积累。建议从定时喂食、每日梳毛开始，慢慢培养与爱宠的默契。',
  };
}

export default function PetDietPage() {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ_QUESTIONS.length).fill(null));
  const [showResult, setShowResult] = useState(false);

  const totalScore = answers.reduce<number>((sum, s) => sum + (s ?? 0), 0);
  const result = getQuizResult(totalScore);
  const allAnswered = answers.every((a) => a !== null);

  const handleSelect = (qIdx: number, optIdx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[qIdx] = optIdx;
      return next;
    });
    setShowResult(false);
  };

  const handleSubmit = () => {
    if (allAnswered) setShowResult(true);
  };

  const handleReset = () => {
    setAnswers(Array(QUIZ_QUESTIONS.length).fill(null));
    setShowResult(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-5xl mx-auto px-4">
        {/* —— 页头 —— */}
        <div className="text-center mb-12">
          <h1
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            衣食住行
          </h1>
          <p className="text-[#808080]">起居有度，健康相随 · 一份给爱宠的日常照护指南</p>
        </div>

        {/* —— 三张知识卡片 —— */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {CARE_GUIDES.map((guide) => (
            <div
              key={guide.id}
              className="muxintang-card p-6 hover:border-[#D4AF37] transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">{guide.icon}</span>
                <div>
                  <h3
                    className="text-lg font-semibold"
                    style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
                  >
                    {guide.title}
                  </h3>
                  <p className="text-xs text-[#808080] mt-0.5">{guide.subtitle}</p>
                </div>
              </div>
              <ul className="space-y-2.5">
                {guide.points.map((point, i) => (
                  <li key={i} className="text-sm text-[#C0C0C0] leading-relaxed flex gap-2">
                    <span className="text-[#D4AF37] mt-0.5">✦</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* —— 测一测养宠习惯 —— */}
        <div className="muxintang-card p-8">
          <div className="text-center mb-8">
            <h2
              className="text-xl font-semibold mb-2"
              style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
            >
              🔮 测一测养宠习惯
            </h2>
            <p className="text-sm text-[#808080]">五道小题，看看你与爱宠的日常默契如何</p>
          </div>

          <div className="space-y-8">
            {QUIZ_QUESTIONS.map((item, qIdx) => (
              <div key={qIdx}>
                <p className="text-base font-medium text-[#C0C0C0] mb-3">
                  <span className="text-[#D4AF37] mr-2">{qIdx + 1}.</span>
                  {item.q}
                </p>
                <div className="grid md:grid-cols-3 gap-3">
                  {item.options.map((opt, oIdx) => {
                    const selected = answers[qIdx] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelect(qIdx, oIdx)}
                        className={`px-4 py-3 rounded-lg border text-sm text-left transition-all ${
                          selected
                            ? 'border-[#D4AF37] bg-[#8B4513]/30 text-[#D4AF37]'
                            : 'border-[#333333] bg-[#242424] text-[#C0C0C0] hover:border-[#8B4513]'
                        }`}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* —— 提交与结果 —— */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allAnswered}
                className={`px-8 py-3 rounded-full text-sm font-medium transition-all ${
                  allAnswered
                    ? 'muxintang-btn'
                    : 'bg-[#242424] text-[#606060] border border-[#333333] cursor-not-allowed'
                }`}
                style={allAnswered ? { fontFamily: "'Ma Shan Zheng', cursive, serif" } : undefined}
              >
                查看结果
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 rounded-full text-sm border border-[#333333] text-[#808080] hover:bg-[#242424] transition-all"
              >
                重置
              </button>
            </div>

            {!allAnswered && (
              <p className="text-xs text-[#808080]">请完成全部 5 道题后查看结果</p>
            )}

            {showResult && (
              <div className="w-full mt-4 p-6 rounded-xl bg-[#242424] border border-[#8B4513] text-center">
                <p
                  className="text-2xl font-semibold mb-2"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
                >
                  {result.level}
                </p>
                <p className="text-sm text-[#808080] mb-4">总分：{totalScore} / 10</p>
                <p className="text-sm text-[#C0C0C0] leading-relaxed max-w-xl mx-auto">
                  {result.desc}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
