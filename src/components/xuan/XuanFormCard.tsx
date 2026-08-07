'use client';

/**
 * XuanFormCard —— 灵境阁 form-first 工具的通用表单卡
 *
 * 适用：先填表 → 提交 → 调 Dify → 报告卡 三段式交互
 * 用于：取名 / 解梦 / 易理 / 起名 / 择日 / 风水 等深度咨询工具
 *
 * 设计语言：玄铁黑底 + 金线（与牧心堂品牌一致）
 * 提交时按钮变 loading，状态可见。
 */

import { useState, type FormEvent } from 'react';

export interface FormFieldDef {
  /** 字段唯一 key */
  key: string;
  /** 标签文案（中文） */
  label: string;
  /** 占位提示 */
  placeholder?: string;
  /** 类型 */
  type: 'text' | 'textarea' | 'select' | 'number' | 'date';
  /** select 选项 */
  options?: Array<{ label: string; value: string }>;
  /** 是否必填 */
  required?: boolean;
  /** textarea 行数（仅 textarea） */
  rows?: number;
  /** 字段下小字提示 */
  hint?: string;
}

export interface XuanFormCardProps {
  /** 工具标题（如"AI 取名师"） */
  title: string;
  /** 工具副标题 */
  subtitle: string;
  /** 头部 emoji */
  icon: string;
  /** 主题色（accent） */
  themeColor: string;
  /** 提交按钮文案 */
  submitLabel?: string;
  /** 表单字段定义 */
  fields: FormFieldDef[];
  /** 提交时回调（返回 Promise） */
  onSubmit: (values: Record<string, string>) => Promise<void>;
  /** 加载中文案 */
  loadingText?: string;
}

export default function XuanFormCard({
  title,
  subtitle,
  icon,
  themeColor,
  submitLabel = '让阿阇梨为你测算',
  fields,
  onSubmit,
  loadingText = '阿阇梨正在冥想推演…',
}: XuanFormCardProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    fields.forEach((f) => {
      if (f.type === 'select' && f.options && f.options.length > 0) {
        init[f.key] = f.options[0].value;
      } else {
        init[f.key] = '';
      }
    });
    return init;
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // 前端必填校验
    for (const f of fields) {
      if (f.required && !values[f.key]?.trim()) {
        setError(`请填写「${f.label}」`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '提交失败';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="rounded-2xl border border-amber-200/30 p-6 md:p-8 shadow-2xl"
      style={{
        background: 'linear-gradient(180deg, #1a1a1a 0%, #0f0f0f 100%)',
      }}
    >
      {/* 头部 */}
      <div className="flex items-start gap-4 mb-6">
        <div
          className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
          style={{
            background: `linear-gradient(135deg, ${themeColor}30 0%, ${themeColor}10 100%)`,
            border: `1px solid ${themeColor}60`,
            boxShadow: `0 0 16px ${themeColor}25`,
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2
            className="text-xl md:text-2xl font-semibold text-amber-50 mb-1"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            {title}
          </h2>
          <p className="text-sm text-amber-200/60">{subtitle}</p>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map((f) => (
          <div key={f.key}>
            <label
              htmlFor={`xfc-${f.key}`}
              className="block text-sm font-medium text-amber-100/90 mb-1.5"
            >
              {f.label}
              {f.required && <span className="text-amber-400 ml-1">*</span>}
            </label>

            {f.type === 'textarea' ? (
              <textarea
                id={`xfc-${f.key}`}
                rows={f.rows || 4}
                value={values[f.key] || ''}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full px-4 py-3 bg-black/40 border border-amber-900/40 rounded-lg text-amber-50 placeholder:text-amber-100/30 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors resize-none"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              />
            ) : f.type === 'select' ? (
              <select
                id={`xfc-${f.key}`}
                value={values[f.key] || ''}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-amber-900/40 rounded-lg text-amber-50 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {f.options?.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-zinc-900">
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : f.type === 'date' ? (
              <input
                id={`xfc-${f.key}`}
                type="date"
                value={values[f.key] || ''}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="w-full px-4 py-3 bg-black/40 border border-amber-900/40 rounded-lg text-amber-50 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                style={{ colorScheme: 'dark' }}
              />
            ) : (
              <input
                id={`xfc-${f.key}`}
                type={f.type}
                value={values[f.key] || ''}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full px-4 py-3 bg-black/40 border border-amber-900/40 rounded-lg text-amber-50 placeholder:text-amber-100/30 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-colors"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              />
            )}

            {f.hint && (
              <p className="mt-1.5 text-xs text-amber-200/50">{f.hint}</p>
            )}
          </div>
        ))}

        {error && (
          <div className="px-4 py-2.5 rounded-lg bg-red-950/50 border border-red-500/30 text-red-200 text-sm">
            ⚠️ {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 px-6 rounded-lg font-semibold text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: submitting
              ? `${themeColor}40`
              : `linear-gradient(135deg, ${themeColor} 0%, ${themeColor}dd 100%)`,
            color: '#0a0a0a',
            boxShadow: submitting
              ? 'none'
              : `0 4px 16px ${themeColor}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
            fontFamily: "'Ma Shan Zheng', cursive, serif",
          }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
              {loadingText}
            </span>
          ) : (
            submitLabel
          )}
        </button>
      </form>
    </div>
  );
}
