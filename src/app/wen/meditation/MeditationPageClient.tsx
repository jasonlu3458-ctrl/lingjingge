'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTTS } from '@/hooks/useTTS';
import StillnessGuide from '@/components/StillnessGuide';
import { trackActivity } from '@/lib/activity-tracker';
import type { BodyType } from '@/lib/body-rules';

/**
 * 冥想引导页面（自包含 client 组件）
 *
 * 设计：
 *  - 4 种静功方案（站桩 5min / 坐禅 5min / 呼吸观 3min / 入眠引导 8min）
 *  - 选定后：用硅基流动 TTS 实时合成引导词（缓存到 localStorage），同步进入 StillnessGuide
 *  - 完成后埋点 user_activities
 */

interface Preset {
  id: string;
  type: BodyType | 'breath' | 'sleep';
  title: string;
  emoji: string;
  duration: number; // 秒
  preview: string;
  /** 引导词全文 */
  script: string;
  tone: { ring: string; glow: string; text: string };
}

const PRESETS: Preset[] = [
  {
    id: 'zhanzhuang-5',
    type: 'zhanzhuang',
    title: '混元桩 · 站桩',
    emoji: '🧍',
    duration: 300,
    preview: '两脚平肩宽，屈膝下蹲；双手如抱球，意守丹田。',
    script:
      '两脚平肩宽，屈膝下蹲。双手如抱球，意守丹田。吸气时，气自百会下沉；呼气时，意随息行。放松双肩，沉肩坠肘。舌抵上腭，目似垂帘。心无杂念，听呼吸之声。',
    tone: { ring: 'border-emerald-300', glow: 'shadow-[0_0_60px_rgba(134,239,172,0.25)]', text: 'text-emerald-200' },
  },
  {
    id: 'zhengqi-5',
    type: 'zhengqi',
    title: '真气运行法 · 坐禅',
    emoji: '🧘',
    duration: 300,
    preview: '盘膝而坐，调息绵长；引气下沉，意随息行。',
    script:
      '盘膝而坐，腰背自然挺直。双手结印，置于丹田之下。调息绵长，吸气深而长，呼气缓而细。心息相依，意随息行。一切杂念如浮云过眼，了了分明而不攀缘。',
    tone: { ring: 'border-sky-300', glow: 'shadow-[0_0_60px_rgba(125,211,252,0.25)]', text: 'text-sky-200' },
  },
  {
    id: 'breath-3',
    type: 'breath',
    title: '呼吸观 · 三分钟',
    emoji: '🌬️',
    duration: 180,
    preview: '专注呼吸的起落，让心回到当下。',
    script:
      '请闭上眼。感受空气从鼻端进入，温润而清新。吸气四秒，停留两秒，呼气六秒。专注于气息的起落，不评判，不追逐。心如止水，意如明镜。三分钟，让心回家。',
    tone: { ring: 'border-purple-300', glow: 'shadow-[0_0_60px_rgba(216,180,254,0.25)]', text: 'text-purple-200' },
  },
  {
    id: 'sleep-8',
    type: 'sleep',
    title: '入眠引导 · 八分钟',
    emoji: '🌙',
    duration: 480,
    preview: '让身体一节节放松，缓缓沉入梦乡。',
    script:
      '请找一个舒服的姿势躺下。感受身体与床的接触。从头顶开始，依次放松额头、眉心、双肩、手臂、胸口、腹部、腿部、脚趾。一节一节，把一天的疲惫交给大地。呼吸越来越缓，越来越深。睡意升起，不要抗拒。晚安，道友。',
    tone: { ring: 'border-indigo-300', glow: 'shadow-[0_0_60px_rgba(165,180,252,0.25)]', text: 'text-indigo-200' },
  },
];

export default function MeditationPageClient() {
  const [phase, setPhase] = useState<'select' | 'guide'>('select');
  const [preset, setPreset] = useState<Preset | null>(null);
  const [speakErr, setSpeakErr] = useState<string | null>(null);

  const { speak, stop, isSpeaking, isLoading: isTTSLoading } = useTTS();

  const start = useCallback(
    async (p: Preset) => {
      setPreset(p);
      setPhase('guide');
      setSpeakErr(null);
      // 进入后 200ms 再触发 TTS，让倒计时先走起来
      setTimeout(() => {
        speak(p.script).catch((e: Error) => {
          setSpeakErr(e?.message || '引导词播放失败');
        });
      }, 250);
    },
    [speak],
  );

  const handleComplete = useCallback(
    (elapsed: number) => {
      // 埋点
      if (preset) {
        trackActivity('meditation', Math.round(elapsed / 60), {
          preset_id: preset.id,
          duration: elapsed,
        }).catch(() => undefined);
      }
    },
    [preset],
  );

  const handleExit = useCallback(() => {
    stop();
    setPhase('select');
    setPreset(null);
  }, [stop]);

  if (phase === 'guide' && preset) {
    // 站桩/坐禅 复用 StillnessGuide；breath/sleep 复用 zhanzhuang 视觉（仅 type 字段用字符串）
    const stillnessType: BodyType =
      preset.type === 'zhanzhuang' || preset.type === 'zhengqi'
        ? preset.type
        : 'zhanzhuang';

    return (
      <div className="relative">
        <StillnessGuide
          type={stillnessType}
          duration={preset.duration}
          onComplete={handleComplete}
          onExit={handleExit}
        />
        {/* 引导词播放状态条 */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full bg-black/60 backdrop-blur-md text-white text-xs">
          {isTTSLoading ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
              <span>正在唤醒引导声…</span>
            </>
          ) : isSpeaking ? (
            <>
              <span>🔊</span>
              <span>引导中</span>
              <button
                onClick={() => stop()}
                className="ml-1 px-2 py-0.5 rounded bg-white/15 hover:bg-white/25"
              >
                静音
              </button>
            </>
          ) : speakErr ? (
            <>
              <span className="text-amber-300">⚠ {speakErr}</span>
            </>
          ) : (
            <>
              <span className="text-gray-400">🔇 引导词已结束</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] via-[#111] to-[#1a1a1a] text-white px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-5xl mb-3">🧘</div>
          <h1
            className="text-3xl md:text-4xl font-bold mb-3 tracking-widest"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            正念冥想
          </h1>
          <p className="text-sm text-gray-400 leading-relaxed">
            道友，选一项静功，<span className="text-gray-300">让心安住当下</span>。
            <br />
            进入后将播放真人引导词，并同步倒计时。
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => start(p)}
              className={`group relative text-left p-5 rounded-2xl border ${p.tone.ring} bg-white/[0.03] hover:bg-white/[0.06] ${p.tone.glow} transition-all duration-300 active:scale-[0.98]`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="text-3xl">{p.emoji}</div>
                <div>
                  <h3 className={`text-lg font-bold ${p.tone.text}`} style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                    {p.title}
                  </h3>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {Math.round(p.duration / 60)} 分钟 · 含 AI 引导词
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                {p.preview}
              </p>
              <div className="absolute top-3 right-3 text-[10px] text-gray-500 group-hover:text-gray-300">
                开始 →
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 text-center text-[11px] text-gray-500 leading-relaxed">
          <p>📿 静功有助调和心肾、涵养正气。</p>
          <p className="mt-1">如有严重身体不适，请暂停并咨询专业医师。</p>
        </div>
      </div>
    </div>
  );
}
