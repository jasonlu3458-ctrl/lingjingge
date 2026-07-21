'use client';

import { useState } from 'react';

type Tool = {
  id: 'breath' | 'visualize' | 'movement';
  title: string;
  icon: string;
  description: string;
  steps: string[];
  accent: string;
};

const TOOLS: Tool[] = [
  {
    id: 'breath',
    title: '呼吸法引导',
    icon: '🌬️',
    description: '4-7-8 安神呼吸法，缓解焦虑、帮助入眠。',
    accent: 'from-sky-100 to-sky-50 border-sky-200 text-sky-700',
    steps: [
      '找一个安静的角落，坐直或躺平。',
      '用鼻轻吸气，心里数 4 秒。',
      '屏住呼吸，心里数 7 秒。',
      '用嘴缓缓呼气，心里数 8 秒。',
      '重复 4 轮。感受身体在每一轮中更放松。',
    ],
  },
  {
    id: 'visualize',
    title: '观想冥想',
    icon: '🌅',
    description: '在心中升起一片晨光，温柔地照进情绪。',
    accent: 'from-amber-100 to-amber-50 border-amber-200 text-amber-700',
    steps: [
      '闭眼，想象自己站在一片无边的草原。',
      '清晨的雾气慢慢散开，金色阳光洒下来。',
      '让光一点点进入你的头顶、眉心、心口。',
      '想象每照亮一处，那里僵硬的部位开始松动。',
      '停留 1-2 分钟，再缓缓睁开眼。',
    ],
  },
  {
    id: 'movement',
    title: '动作疗愈',
    icon: '🧘',
    description: '5 个简单动作，把身体里的郁结振开。',
    accent: 'from-emerald-100 to-emerald-50 border-emerald-200 text-emerald-700',
    steps: [
      '肩部环绕：双肩向前 5 圈、向后 5 圈。',
      '颈侧拉伸：右耳贴右肩停 15 秒，换边。',
      '扩胸开肩：双手在背后交握，挺胸抬头 20 秒。',
      '猫牛式：四点跪姿，吸气塌腰、呼气拱背，重复 6 次。',
      '站立前屈：双脚分开，缓慢前屈垂吊 30 秒。',
    ],
  },
];

export default function SelfHelpTools() {
  const [openId, setOpenId] = useState<Tool['id'] | null>(null);
  const open = TOOLS.find((t) => t.id === openId) || null;

  return (
    <section className="mb-8">
      <div className="flex items-baseline justify-between mb-4">
        <h2
          className="text-2xl text-[#2c2c2c]"
          style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
        >
          🧰 自助工具箱
        </h2>
        <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
          纯免费 · 随时可用
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        难过、焦虑、低落时，先用这 3 个工具抚慰自己。
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setOpenId(tool.id)}
            className={`text-left p-5 rounded-2xl border bg-gradient-to-br ${tool.accent} hover:shadow-md transition-shadow`}
          >
            <div className="text-3xl mb-2">{tool.icon}</div>
            <div
              className="text-lg mb-1"
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
            >
              {tool.title}
            </div>
            <div className="text-xs text-gray-600 leading-relaxed">{tool.description}</div>
          </button>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setOpenId(null)}
        >
          <div
            className={`max-w-md w-full bg-gradient-to-br ${open.accent} rounded-2xl p-6 shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{open.icon}</span>
                <h3
                  className="text-xl"
                  style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
                >
                  {open.title}
                </h3>
              </div>
              <button
                onClick={() => setOpenId(null)}
                className="text-gray-500 hover:text-gray-800 text-xl leading-none"
                aria-label="关闭"
              >
                ×
              </button>
            </div>
            <p className="text-sm text-gray-700 mb-4">{open.description}</p>
            <ol className="space-y-2 text-sm text-gray-800 list-decimal pl-5 leading-relaxed">
              {open.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            <button
              onClick={() => setOpenId(null)}
              className="mt-5 w-full py-2 rounded-full bg-white/80 hover:bg-white text-gray-700 text-sm border border-gray-300 transition-colors"
            >
              回到聊天
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
