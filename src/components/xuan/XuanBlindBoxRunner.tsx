'use client';

/**
 * XuanBlindBoxRunner —— 灵境阁盲盒触达工具的统一执行器
 *
 * 流程：
 *   1) 盲盒：XuanBlindBoxButton（点击 → 1.5-2s 动画）
 *   2) 报告：XuanReportCard（Dify 返回后展示）
 *   3) 对话：报告底部"咨询阿阇梨"
 *
 * 适用：click-to-reveal 类工具（推背师 / 星座师 / 生肖师）
 *
 * 设计：difyType 决定 query 模板和动画类型，避免 page 传函数。
 */

import { useState } from 'react';
import XuanBlindBoxButton, { type BlindBoxType } from './XuanBlindBoxButton';
import XuanReportCard, { type ReportSection } from './XuanReportCard';

export interface XuanBlindBoxRunnerProps {
  /** difyType 标识 */
  difyType: string;
  /** 页面标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 工具 icon */
  icon: string;
  /** 主题色 */
  themeColor: string;
  /** 盲盒类型（决定动画） */
  blindBoxType: BlindBoxType;
  /** 按钮文案 */
  buttonLabel: string;
  /** 按钮下提示 */
  hint?: string;
  /** Dify query 模板（可选） */
  queryTemplate?: string;
  /** 动画时长（ms），默认 1800 */
  duration?: number;
}

function parseReportContent(content: string): ReportSection[] {
  const lines = content.split('\n');
  const sections: ReportSection[] = [];
  let current: ReportSection | null = null;

  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    if (h2 || h3) {
      if (current) sections.push(current);
      current = {
        title: (h2?.[1] || h3?.[1] || '').trim(),
        content: '',
        variant: 'plain',
      };
    } else if (current && line.trim()) {
      current.content += (current.content ? '\n' : '') + line;
    }
  }
  if (current) sections.push(current);

  if (sections.length === 0) {
    sections.push({
      title: '阿阇梨解读',
      content: content.trim(),
      variant: 'highlight',
    });
  }
  if (sections[0]) sections[0].variant = 'highlight';

  return sections;
}

function buildQuery(difyType: string, template?: string): string {
  if (template) return template;
  // 内置默认 query
  const map: Record<string, string> = {
    tuibei: '请为我摇一签，看看今日的推背图谶言。',
    astrology: '请为我翻一张星卡，给出今日的星象启示。',
    zodiac: '请为我转动生肖轮，给出今年的生肖运势。',
  };
  return map[difyType] || '请为我抽取今日启示。';
}

export default function XuanBlindBoxRunner({
  difyType,
  title,
  subtitle,
  icon,
  themeColor,
  blindBoxType,
  buttonLabel,
  hint,
  queryTemplate,
  duration = 1800,
}: XuanBlindBoxRunnerProps) {
  const [phase, setPhase] = useState<'box' | 'loading' | 'report' | 'consult'>('box');
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [reportTitle, setReportTitle] = useState(title);
  const [reportSubtitle, setReportSubtitle] = useState('');
  const [generatedAt, setGeneratedAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [consultMessages, setConsultMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [consultInput, setConsultInput] = useState('');
  const [consulting, setConsulting] = useState(false);

  const fetchDify = async (query: string) => {
    setError(null);
    setPhase('loading');
    try {
      const res = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: difyType,
          query,
          inputs: { page_path: `/wen/${difyType}`, blind_box_mode: 'true' },
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Dify 响应 ${res.status}${errText ? `：${errText.slice(0, 200)}` : ''}`);
      }
      const data = await res.json();
      const content: string = data.answer || data.message || '';
      if (data.conversation_id) setConversationId(data.conversation_id);
      setReportSections(parseReportContent(content));
      setReportTitle(`${title} · 今日启示`);
      setReportSubtitle(`基于你的抽取 · ${new Date().toLocaleString('zh-CN', { hour12: false })}`);
      setGeneratedAt(new Date().toLocaleString('zh-CN', { hour12: false }));
      setPhase('report');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '请求失败';
      setError(msg);
      setPhase('box');
    }
  };

  const handleDrawStart = () => {
    // 动画开始 → 立即调 Dify（不等动画结束）
    fetchDify(buildQuery(difyType, queryTemplate));
  };

  const handleConsult = () => setPhase('consult');

  const handleSendConsult = async () => {
    if (!consultInput.trim() || consulting) return;
    const userText = consultInput.trim();
    setConsultInput('');
    setConsultMessages((m) => [...m, { role: 'user', content: userText }]);
    setConsulting(true);
    try {
      const res = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: difyType,
          query: userText,
          conversation_id: conversationId,
          inputs: {
            page_path: `/wen/${difyType}`,
            consult_mode: 'true',
            report_context: reportSections
              .map((s) => `${s.title}\n${s.content}`)
              .join('\n\n'),
          },
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setConsultMessages((m) => [...m, { role: 'assistant', content: data.answer || '' }]);
      if (data.conversation_id) setConversationId(data.conversation_id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '发送失败';
      setConsultMessages((m) => [
        ...m,
        { role: 'assistant', content: `（连接中断：${msg}，请稍后再试）` },
      ]);
    } finally {
      setConsulting(false);
    }
  };

  // —— 阶段 1：盲盒 ——
  if (phase === 'box') {
    return (
      <div>
        <XuanBlindBoxButton
          type={blindBoxType}
          title={title}
          subtitle={subtitle}
          icon={icon}
          themeColor={themeColor}
          buttonLabel={buttonLabel}
          duration={duration}
          onDrawStart={handleDrawStart}
          onResult={() => {/* 动画结束，fetchDify 已经在跑，无需动作 */}}
        />
        {hint && (
          <p className="text-center text-amber-200/40 text-xs mt-4 tracking-wider">
            {hint}
          </p>
        )}
        {error && (
          <div className="mt-4 px-4 py-2.5 rounded-lg bg-red-950/50 border border-red-500/30 text-red-200 text-sm text-center">
            ⚠️ {error}
          </div>
        )}
      </div>
    );
  }

  // —— 阶段 2：加载中 ——
  if (phase === 'loading') {
    return (
      <div
        className="rounded-2xl border border-amber-200/30 p-12 shadow-2xl flex flex-col items-center justify-center min-h-[480px]"
        style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)' }}
      >
        <div
          className="w-16 h-16 rounded-full border-4 border-t-transparent animate-spin mb-6"
          style={{ borderColor: themeColor, borderTopColor: 'transparent' }}
        />
        <p
          className="text-amber-50 text-lg"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
        >
          阿阇梨正在揭晓今日启示…
        </p>
        <p className="text-amber-200/50 text-sm mt-2">报告生成约需 3-8 秒</p>
      </div>
    );
  }

  // —— 阶段 3：报告 ——
  if (phase === 'report') {
    return (
      <XuanReportCard
        title={reportTitle}
        subtitle={reportSubtitle}
        icon={icon}
        themeColor={themeColor}
        generatedAt={generatedAt}
        sections={reportSections}
        onConsultAcharya={handleConsult}
        onRetry={() => setPhase('box')}
      />
    );
  }

  // —— 阶段 4：对话 ——
  return (
    <div className="space-y-4">
      <details className="rounded-2xl border border-amber-200/30 overflow-hidden" open>
        <summary
          className="px-6 py-4 cursor-pointer flex items-center justify-between"
          style={{
            background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
            fontFamily: "'Ma Shan Zheng', cursive, serif",
          }}
        >
          <span className="text-amber-50 flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            {reportTitle}
          </span>
          <span className="text-amber-200/40 text-xs">点击折叠/展开</span>
        </summary>
        <div className="border-t border-amber-200/20">
          <XuanReportCard
            title={reportTitle}
            subtitle={reportSubtitle}
            icon={icon}
            themeColor={themeColor}
            sections={reportSections}
            generatedAt={generatedAt}
          />
        </div>
      </details>

      <div
        className="rounded-2xl border border-amber-200/30 p-5 md:p-6 shadow-2xl"
        style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)' }}
      >
        <h3
          className="text-amber-50 font-semibold text-base mb-4 flex items-center gap-2"
          style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
        >
          💬 深度对话 · 阿阇梨
        </h3>

        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto pr-2">
          {consultMessages.length === 0 && (
            <p className="text-amber-200/50 text-sm text-center py-6">
              基于上面的启示，你可以继续问阿阇梨任何细节
            </p>
          )}
          {consultMessages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-amber-500/20 text-amber-50'
                    : 'bg-black/40 text-amber-100/90 border border-amber-900/30'
                }`}
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {m.content}
              </div>
            </div>
          ))}
          {consulting && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl bg-black/40 border border-amber-900/30">
                <span className="text-amber-100/60 text-sm">阿阇梨正在推演</span>
                <span className="inline-block ml-1 animate-pulse">…</span>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={consultInput}
            onChange={(e) => setConsultInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendConsult()}
            placeholder="问阿阇梨…"
            disabled={consulting}
            className="flex-1 px-4 py-2.5 bg-black/40 border border-amber-900/40 rounded-lg text-amber-50 placeholder:text-amber-100/30 focus:outline-none focus:border-amber-500/60 transition-colors disabled:opacity-50"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          />
          <button
            onClick={handleSendConsult}
            disabled={consulting || !consultInput.trim()}
            className="px-5 py-2.5 rounded-lg font-semibold text-sm transition-all disabled:opacity-50"
            style={{ background: themeColor, color: '#0a0a0a', fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
