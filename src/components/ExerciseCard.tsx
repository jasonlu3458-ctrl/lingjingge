// ============================================================
// ExerciseCard —— 练习选择卡片
// 视觉复刻 FreeCard，但支持整卡点击 + hover 缩放
// 主题色随 exercise.tone 切换
// ============================================================

'use client';

import type { ReactNode, MouseEvent } from 'react';
import type { BodyExercise } from '@/lib/body-rules';

export interface ExerciseCardProps {
  exercise: BodyExercise;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}

export default function ExerciseCard({ exercise, onClick }: ExerciseCardProps): ReactNode {
  const tone = exercise.tone;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 transition-all duration-300 hover:scale-[1.02] hover:border-white/30 hover:bg-white/10 active:scale-95"
      style={{
        boxShadow: `0 0 0 0 ${tone}00`,
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${tone}22`,
            color: tone,
            border: `1px solid ${tone}44`,
          }}
          aria-hidden
        >
          {exercise.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-lg font-bold tracking-wide"
            style={{ color: tone, fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
          >
            {exercise.name}
          </h3>
          <p className="mt-1 text-[11px] text-gray-400 uppercase tracking-widest">
            {exercise.category === 'stillness' ? '静功' : '动功'} ·{' '}
            {Math.floor(exercise.duration / 60)} 分{exercise.duration % 60 ? ` ${exercise.duration % 60} 秒` : ''}
          </p>
          <p className="mt-2 text-sm text-gray-300 leading-relaxed">
            {exercise.description}
          </p>
        </div>
      </div>
      <div
        className="mt-4 flex items-center justify-end text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: tone }}
      >
        开始练习 →
      </div>
    </button>
  );
}
