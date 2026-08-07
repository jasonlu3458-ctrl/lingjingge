'use client';

/**
 * XuanToolRunner —— 灵境阁 form-first 工具的统一执行器
 *
 * 三段式流程：
 *   1) 表单：XuanFormCard（输入条件）
 *   2) 提交：调用 /api/dify（difyType + 拼接用户输入）
 *   3) 报告：XuanReportCard（结构化展示）
 *   4) 对话：报告底部 "咨询阿阇梨" 展开对话
 *
 * 复用：取名 / 解梦 / 易理 / 八字 / 配对 / 择日 等所有 form-first 工具
 *
 * 设计：所有 difyType 的 query 拼装规则内置在 buildQueryByType()，
 *       上层 page.tsx 不用传函数 prop（避免 RSC → Client 边界错误）。
 */

import { useState } from 'react';
import XuanFormCard, { type FormFieldDef } from './XuanFormCard';
import XuanReportCard, { type ReportSection } from './XuanReportCard';

export interface XuanToolRunnerProps {
  /** 后端 difyType 标识（也是查询模板的 key） */
  difyType: string;
  /** 页面标题 */
  title: string;
  /** 页面副标题 */
  subtitle: string;
  /** 工具 icon */
  icon: string;
  /** 主题色 */
  themeColor: string;
  /** 表单字段 */
  fields: FormFieldDef[];
  /** 提交按钮文案 */
  submitLabel?: string;
  /** 加载中文案 */
  loadingText?: string;
  /** 自定义 query 模板（可选，含 {key} 占位符） */
  queryTemplate?: string;
  /** 自定义 select 值映射（如 dream.mood: 'fear' → '恐惧不安'） */
  valueLabels?: Record<string, Record<string, string>>;
}

/**
 * 根据 difyType 拼接 query 文本（避免 page 传函数）
 * 支持 {key} 占位符；select 值自动用 valueLabels 翻译
 */
function buildQueryByType(
  difyType: string,
  values: Record<string, string>,
  customTemplate?: string,
  valueLabels?: Record<string, Record<string, string>>,
): string {
  const translate = (key: string, v: string): string => {
    return valueLabels?.[key]?.[v] ?? v;
  };

  if (customTemplate) {
    return customTemplate.replace(/\{(\w+)\}/g, (_, k) => translate(k, values[k] || ''));
  }

  // 内置模板
  switch (difyType) {
    case 'name': {
      return [
        '请为我推荐名字。',
        `姓氏：${values.surname || ''}`,
        `性别：${translate('gender', values.gender || '')}`,
        `出生：${values.birth || ''}`,
        `期待：${values.expectation || ''}`,
      ].join('\n');
    }
    case 'dream': {
      return [
        '请为我解梦。',
        '',
        `梦境：${values.dream || ''}`,
        '',
        `醒来感受：${translate('mood', values.mood || '')}`,
        `是否重复：${translate('recurring', values.recurring || '') || '未说明'}`,
      ].join('\n');
    }
    case 'yili': {
      const lines = ['请为我演易。', '', `所问：${values.question || ''}`];
      if (values.birth) lines.push(`起卦人：${values.birth}`);
      if (values.divination_time) lines.push(`起卦时间：${values.divination_time}`);
      if (values.background) lines.push(`背景：${values.background}`);
      return lines.join('\n');
    }
    default: {
      // 默认：按 fields 顺序逐行输出
      return Object.entries(values)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n');
    }
  }
}

/** 把 Dify content 拆为 ReportSection[] */
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

export default function XuanToolRunner({
  difyType,
  title,
  subtitle,
  icon,
  themeColor,
  fields,
  submitLabel,
  loadingText,
  queryTemplate,
  valueLabels,
}: XuanToolRunnerProps) {
  const [step, setStep] = useState<'form' | 'loading' | 'report' | 'consult'>('form');
  const [reportSections, setReportSections] = useState<ReportSection[]>([]);
  const [reportTitle, setReportTitle] = useState(title);
  const [reportSubtitle, setReportSubtitle] = useState(subtitle);
  const [generatedAt, setGeneratedAt] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [consultMessages, setConsultMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [consultInput, setConsultInput] = useState('');
  const [consulting, setConsulting] = useState(false);

  const handleSubmit = async (values: Record<string, string>) => {
    setError(null);
    setStep('loading');
    const query = buildQueryByType(difyType, values, queryTemplate, valueLabels);

    try {
      const res = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: difyType,
          query,
          inputs: { page_path: `/wen/${difyType}` },
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
      setReportTitle(`${title} · 阿阇梨解读`);
      setReportSubtitle(
        `基于你的输入 · ${new Date().toLocaleString('zh-CN', { hour12: false })}`,
      );
      setGeneratedAt(new Date().toLocaleString('zh-CN', { hour12: false }));
      setStep('report');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '请求失败';
      setError(msg);
      setStep('form');
    }
  };

  const handleConsult = () => setStep('consult');

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

  // —— 步骤 1：表单 ——
  if (step === 'form') {
    return (
      <XuanFormCard
        title={title}
        subtitle={subtitle}
        icon={icon}
        themeColor={themeColor}
        fields={fields}
        submitLabel={submitLabel}
        loadingText={loadingText}
        onSubmit={handleSubmit}
      />
    );
  }

  // —— 步骤 2：加载中 ——
  if (step === 'loading') {
    return (
      <div
        className="rounded-2xl border border-amber-200/30 p-12 shadow-2xl flex flex-col items-center justify-center min-h-[400px]"
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
          {loadingText || '阿阇梨正在冥想推演…'}
        </p>
        <p className="text-amber-200/50 text-sm mt-2">报告生成约需 3-8 秒</p>
      </div>
    );
  }

  // —— 步骤 3：报告 ——
  if (step === 'report') {
    return (
      <XuanReportCard
        title={reportTitle}
        subtitle={reportSubtitle}
        icon={icon}
        themeColor={themeColor}
        generatedAt={generatedAt}
        sections={reportSections}
        onConsultAcharya={handleConsult}
        onBack={() => setStep('form')}
        onRetry={() => setStep('form')}
      />
    );
  }

  // —— 步骤 4：对话 ——
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
              基于上面的报告，你可以继续问阿阇梨任何细节
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
