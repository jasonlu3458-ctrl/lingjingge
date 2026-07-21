// ============================================================
// BodyPageClient —— 身心合一 · 动静兼修 主页面容器
// 状态机：select → exercising → summary
// ============================================================

'use client';

import { useCallback, useState, type ReactNode, type MouseEvent } from 'react';
import ExerciseCard from '@/components/ExerciseCard';
import StillnessGuide from '@/components/StillnessGuide';
import YijinjingGuide from '@/components/YijinjingGuide';
import { consumeDifySSE } from '@/lib/sse-client';
import ReportActionBar from '@/components/ReportActionBar';
import MiniMarkdown from '@/components/MiniMarkdown';
import {
  EXERCISE_LIST,
  formatDuration,
  type BodyType,
  type SessionState,
  type BodyRecord,
} from '@/lib/body-rules';

export interface BodyPageClientProps {
  userRole?: string | null;
}

export default function BodyPageClient({ userRole: _userRole }: BodyPageClientProps): ReactNode {
  const [state, setState] = useState<SessionState>('select');
  const [selectedType, setSelectedType] = useState<BodyType | null>(null);
  const [record, setRecord] = useState<BodyRecord | null>(null);

  // —— 生成报告状态 ——
  const [polished, setPolished] = useState<string>('');
  const [polishSource, setPolishSource] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isPolishing, setIsPolishing] = useState<boolean>(false);

  // 选中某练习 → 进入 exercising
  const handleSelect = useCallback((type: BodyType) => {
    setSelectedType(type);
    setRecord(null);
    setPolished('');
    setPolishSource('');
    setErrorMsg('');
    setState('exercising');
  }, []);

  // 静功完成
  const handleStillnessComplete = useCallback((elapsedSec: number) => {
    if (!selectedType) return;
    const now = Date.now();
    setRecord({
      type: selectedType,
      category: 'stillness',
      totalDuration: elapsedSec,
      completedParts: 0,
      startedAt: now - elapsedSec * 1000,
      endedAt: now,
    });
    setState('summary');
  }, [selectedType]);

  // 动功完成
  const handleMovementComplete = useCallback((elapsedSec: number, completedParts: number) => {
    if (!selectedType) return;
    const now = Date.now();
    setRecord({
      type: selectedType,
      category: 'movement',
      totalDuration: elapsedSec,
      completedParts,
      startedAt: now - elapsedSec * 1000,
      endedAt: now,
    });
    setState('summary');
  }, [selectedType]);

  // 主动退出（不记录总结）
  const handleExit = useCallback((_e?: MouseEvent<HTMLButtonElement>) => {
    setSelectedType(null);
    setRecord(null);
    setPolished('');
    setPolishSource('');
    setErrorMsg('');
    setState('select');
  }, []);

  // 调 Dify 生成报告
  const handleGenerateReport = useCallback(async () => {
    if (!record) return;
    setIsPolishing(true);
    setPolished('');
    setPolishSource('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/body/polish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: record.type,
          category: record.category,
          totalDuration: record.totalDuration,
          completedParts: record.completedParts,
        }),
      });

      if (!res.ok) {
        setErrorMsg(`请求失败 ${res.status}`);
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/event-stream') && res.body) {
        await consumeDifySSE(res, {
          onDelta: setPolished,
          onEnd: ({ source, error }) => {
            setPolishSource(source);
            if (error) setErrorMsg(error);
          },
          onError: setErrorMsg,
        });
      } else {
        // 降级 JSON
        const json = await res.json();
        if (json.success) {
          setPolished(json.polished || '');
          setPolishSource(json.source || 'local-template');
        } else {
          setErrorMsg(json.error || '生成失败');
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '网络错误');
    } finally {
      setIsPolishing(false);
    }
  }, [record]);

  // ================== 渲染 ==================

  // —— select 状态：练习选择页 ——
  if (state === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] text-white">
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          {/* 页头 */}
          <header className="text-center mb-12">
            <h1
              className="text-4xl font-bold tracking-widest"
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
            >
              身心合一 · 动静兼修
            </h1>
            <p className="mt-3 text-sm text-gray-400 tracking-widest">
              静以养气 · 动以炼形 · 内外兼修
            </p>
            <div className="mt-6 mx-auto w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          </header>

          {/* 4 个练习卡：2×2 网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {EXERCISE_LIST.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                onClick={() => handleSelect(ex.id)}
              />
            ))}
          </div>

          <footer className="mt-12 text-center text-xs text-gray-500">
            <p>建议空腹或饭后 1 小时练习；练习中如有不适请立即停止。</p>
          </footer>
        </div>
      </div>
    );
  }

  // —— exercising 状态：渲染对应引导 ——
  if (state === 'exercising' && selectedType) {
    const ex = EXERCISE_LIST.find((e) => e.id === selectedType);
    if (!ex) return null;

    if (ex.category === 'stillness') {
      return (
        <StillnessGuide
          type={selectedType}
          duration={ex.duration}
          onComplete={handleStillnessComplete}
          onExit={handleExit}
        />
      );
    }
    return (
      <YijinjingGuide
        type={selectedType}
        onComplete={handleMovementComplete}
        onExit={handleExit}
      />
    );
  }

  // —— summary 状态：今日练习总结 ——
  if (state === 'summary' && record) {
    const ex = EXERCISE_LIST.find((e) => e.id === record.type);
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a] text-white">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <header className="text-center mb-10">
            <h1
              className="text-3xl font-bold tracking-widest"
              style={{ fontFamily: "'Ma Shan Zheng', 'STKaiti', 'KaiTi', serif" }}
            >
              今日练习总结
            </h1>
            <p className="mt-2 text-sm text-gray-400">身心同调 · 一念清明</p>
          </header>

          <div id="body-report" className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-white/10">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${ex?.tone ?? '#888'}22`, border: `1px solid ${ex?.tone ?? '#888'}44` }}
              >
                {ex?.icon}
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: ex?.tone ?? '#fff' }}>
                  {ex?.name}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  {record.category === 'stillness' ? '静功' : '动功'} ·{' '}
                  {formatDuration(record.totalDuration)} · 完成部位 {record.completedParts} 个
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-black/30 p-4">
                <p className="text-xs text-gray-500">本次时长</p>
                <p className="mt-1 text-2xl font-light tabular-nums">{formatDuration(record.totalDuration)}</p>
              </div>
              <div className="rounded-lg bg-black/30 p-4">
                <p className="text-xs text-gray-500">完成部位</p>
                <p className="mt-1 text-2xl font-light tabular-nums">
                  {record.completedParts} <span className="text-sm text-gray-500">/ {record.category === 'movement' ? '6' : '—'}</span>
                </p>
              </div>
            </div>

            {/* 报告区域 */}
            <div className="pt-2">
              {!polished && !isPolishing && (
                <button
                  type="button"
                  onClick={handleGenerateReport}
                  className="w-full rounded-xl px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#7c3aed] to-[#38bdf8] hover:opacity-90 active:scale-95 transition"
                >
                  生成我的身心报告
                </button>
              )}

              {isPolishing && !polished && (
                <div className="rounded-xl bg-black/30 p-4 text-center text-xs text-gray-400">
                  AI 调养师正在为你书写结语…
                </div>
              )}

              {polished && (
                <div className="rounded-xl bg-black/30 p-5 text-sm leading-relaxed text-gray-200">
                  <MiniMarkdown text={polished} className="text-gray-200 [&_strong]:text-white [&_h3]:text-white [&_h4]:text-white [&_h5]:text-white" />
                </div>
              )}

              {polishSource && (
                <p className="mt-2 text-[10px] text-gray-500 text-right">
                  来源：{polishSource === 'dify' ? '✨ 灵境尊者 · 身心调养指引' : '本地模板'}
                </p>
              )}

              {errorMsg && (
                <p className="mt-2 text-xs text-amber-400">⚠️ {errorMsg}</p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleExit}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm text-gray-300 border border-white/10 hover:border-white/30 hover:text-white transition"
              >
                返回练习列表
              </button>
              {polished && (
                <ReportActionBar
                  targetId="body-report"
                  ttsTitle="身心练习报告"
                  ttsTone="emerald"
                  ttsPrefix="以下是您的身心练习报告。"
                  pdfFilename={`身心练习报告-${ex?.name || '修行'}`}
                  pdfTone="violet"
                  pdfLabel="📄 导出本次报告"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
