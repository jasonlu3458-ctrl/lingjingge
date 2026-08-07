import ToolModeRunner from '../_shared/ToolModeRunner';

export const metadata = {
  title: 'AI 易理师 · 灵境阁',
  description: '易理演卦，一阴一阳之谓道。',
};

export default function YiliPage() {
  return (
    <ToolModeRunner
      mode="form-first"
      difyType="yili"
      title="AI 易理师"
      subtitle="一阴一阳之谓道"
      icon="☯️"
      themeColor="#3a5a40"
      submitLabel="起卦演易"
      loadingText="阿阇梨正在起卦…"
      fields={[
        {
          key: 'question',
          label: '所问何事',
          placeholder: '如：是否应接受这份工作机会？',
          type: 'textarea',
          rows: 3,
          required: true,
        },
        {
          key: 'birth',
          label: '起卦人出生年月日时',
          placeholder: '如：1990-05-12 09:30',
          type: 'text',
          required: false,
          hint: '用于结合命理推演',
        },
        {
          key: 'divination_time',
          label: '起卦时间',
          type: 'date',
          required: false,
          hint: '默认当前时刻',
        },
        {
          key: 'background',
          label: '背景补充',
          placeholder: '可补充客观条件、已掌握的信息',
          type: 'textarea',
          rows: 2,
          required: false,
        },
      ]}
    />
  );
}
