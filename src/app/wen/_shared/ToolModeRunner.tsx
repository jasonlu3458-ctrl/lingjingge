'use client';

/**
 * ToolModeRunner —— 灵境阁 9 大 AI 工具的统一渲染入口
 *
 * 按 mode 分发到 3 种交互模式：
 *   - 'chat-only'       纯陪伴 → 走 SimpleChatClient（水墨背景 + 配额 + 付费墙 + 流式输出）
 *   - 'click-to-reveal' 盲盒触达 → 走 XuanBlindBoxRunner（shake/flip/spin 动画）
 *   - 'form-first'      深度咨询 → 走 XuanToolRunner（form → AI → 报告卡）
 *
 * 设计：page.tsx 只需传 mode + 标题 + 字段，其他细节在内部处理。
 *       这样 page.tsx 不必关心 3 个 runner 的差异，一份接口搞定 9 个工具。
 */

import { getUserRole, type UserRole } from '@/lib/auth';
import SimpleChatClient from './SimpleChatClient';
import type { SimpleChatConfig } from './SimpleChatClient';
import XuanToolRunner from '@/components/xuan/XuanToolRunner';
import { type FormFieldDef } from '@/components/xuan/XuanFormCard';
import XuanBlindBoxRunner from '@/components/xuan/XuanBlindBoxRunner';
import type { BlindBoxType } from '@/components/xuan/XuanBlindBoxButton';

export type ToolMode = 'chat-only' | 'click-to-reveal' | 'form-first';

export interface ToolModeRunnerProps {
  /** 交互模式（核心） */
  mode: ToolMode;
  /** 后端 difyType */
  difyType: string;
  /** 页面标题 */
  title: string;
  /** 副标题 */
  subtitle: string;
  /** 头部 emoji */
  icon: string;
  /** 主题色 */
  themeColor: string;

  // —— chat-only 模式用 ——
  /** 初始 AI 欢迎气泡 */
  initialBubble?: string;
  /** 3 个快捷倾诉按钮 */
  quickPrompts?: [string, string, string];
  /** 4 次后 AI 挽留话术 */
  retentionNudge?: string;
  /** 顶部禅意格言 */
  zenQuotes?: string[];
  /** 报告分段（免费 / 会员） */
  reportStructure?: { free: string[]; premium: string[] };
  /** 触发报告的对话轮数 */
  totalRounds?: number;

  // —— form-first 模式用 ——
  /** 表单字段定义 */
  fields?: FormFieldDef[];
  /** 提交按钮文案 */
  submitLabel?: string;
  /** 加载中文案 */
  loadingText?: string;
  /** 自定义 query 模板（含 {key} 占位符） */
  queryTemplate?: string;
  /** select 值映射 */
  valueLabels?: Record<string, Record<string, string>>;

  // —— click-to-reveal 模式用 ——
  /** 盲盒动画类型 */
  blindBoxType?: BlindBoxType;
  /** 大按钮文案 */
  buttonLabel?: string;
  /** 按钮下提示 */
  hint?: string;
  /** 动画时长（ms） */
  blindDuration?: number;
}

/**
 * ToolModeRunner —— 内部根据 mode 派发到对应 runner
 */
export default function ToolModeRunner(props: ToolModeRunnerProps) {
  const { mode, ...rest } = props;

  if (mode === 'chat-only') {
    const config: SimpleChatConfig = {
      difyType: rest.difyType,
      title: rest.title,
      subtitle: rest.subtitle,
      icon: rest.icon,
      themeColor: rest.themeColor,
      initialBubble: rest.initialBubble || rest.subtitle,
      quickPrompts: rest.quickPrompts || ['我在思考中…', '我遇到一个问题', '我想聊聊感受'],
      retentionNudge:
        rest.retentionNudge ||
        '\n\n—— 阿阇梨看你很有慧根。若想聊得更深，可开通会员，解锁完整报告。',
      zenQuotes: rest.zenQuotes || [
        '心安即是归处。',
        '当下即是道场。',
        '一切福田，不离方寸。',
        '念念不离本心。',
      ],
      reportStructure: rest.reportStructure || {
        free: ['核心要点', '可尝试的一步', '心法提示'],
        premium: ['深度分析', '长期建议', '成长路径'],
      },
      totalRounds: rest.totalRounds,
    };

    // chat-only 走 SimpleChatClient（client）—— 但需要 userRole
    // 简化：直接传 CONFIG，让 SimpleChatClient 用默认 userRole='free'
    return <SimpleChatClient config={config} />;
  }

  if (mode === 'click-to-reveal') {
    return (
      <XuanBlindBoxRunner
        difyType={rest.difyType}
        title={rest.title}
        subtitle={rest.subtitle}
        icon={rest.icon}
        themeColor={rest.themeColor}
        blindBoxType={rest.blindBoxType || 'shake'}
        buttonLabel={rest.buttonLabel || '✨ 抽取今日启示'}
        hint={rest.hint}
        queryTemplate={rest.queryTemplate}
        duration={rest.blindDuration}
      />
    );
  }

  // form-first（默认）
  return (
    <XuanToolRunner
      difyType={rest.difyType}
      title={rest.title}
      subtitle={rest.subtitle}
      icon={rest.icon}
      themeColor={rest.themeColor}
      fields={rest.fields || []}
      submitLabel={rest.submitLabel}
      loadingText={rest.loadingText}
      queryTemplate={rest.queryTemplate}
      valueLabels={rest.valueLabels}
    />
  );
}
