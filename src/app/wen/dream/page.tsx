import ToolModeRunner from '../_shared/ToolModeRunner';

export const metadata = {
  title: 'AI 解梦师 · 灵境阁',
  description: '夜有所梦，日有所思。东方周公 + 西方心理学双维解读。',
};

export default function DreamPage() {
  return (
    <ToolModeRunner
      mode="form-first"
      difyType="dream"
      title="AI 解梦师"
      subtitle="夜有所梦，日有所思"
      icon="🌙"
      themeColor="#5d4e8c"
      submitLabel="让阿阇梨解这一梦"
      loadingText="阿阇梨正在翻阅梦境之书…"
      fields={[
        {
          key: 'dream',
          label: '梦境描述',
          placeholder: '尽量详细描述梦境中的人物、场景、关键意象…',
          type: 'textarea',
          rows: 5,
          required: true,
          hint: '越详细解读越精准',
        },
        {
          key: 'mood',
          label: '醒来时的感受',
          type: 'select',
          required: true,
          options: [
            { label: '恐惧不安', value: 'fear' },
            { label: '悲伤沉重', value: 'sad' },
            { label: '平静无波', value: 'calm' },
            { label: '欢喜期待', value: 'joy' },
            { label: '困惑不解', value: 'confused' },
          ],
        },
        {
          key: 'recurring',
          label: '是否重复出现？',
          type: 'select',
          required: false,
          options: [
            { label: '是，多次', value: 'recurring' },
            { label: '否，第一次', value: 'first' },
            { label: '不确定', value: 'unknown' },
          ],
        },
      ]}
      valueLabels={{
        mood: {
          fear: '恐惧不安', sad: '悲伤沉重', calm: '平静无波', joy: '欢喜期待', confused: '困惑不解',
        },
        recurring: {
          recurring: '是，重复出现', first: '否，第一次', unknown: '不确定',
        },
      }}
    />
  );
}
