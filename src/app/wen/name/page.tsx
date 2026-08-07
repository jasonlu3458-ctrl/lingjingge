import ToolModeRunner from '../_shared/ToolModeRunner';

export const metadata = {
  title: 'AI 取名师 · 灵境阁',
  description: '名以载德，字以寄情。一个好名字，是父母给孩子一生的礼物。',
};

export default function NamePage() {
  return (
    <ToolModeRunner
      mode="form-first"
      difyType="name"
      title="AI 取名师"
      subtitle="名以载德，字以寄情"
      icon="✍️"
      themeColor="#d4a574"
      submitLabel="让阿阇梨为你斟酌"
      loadingText="阿阇梨正在翻阅字海…"
      fields={[
        {
          key: 'surname',
          label: '姓氏',
          placeholder: '如：李、王、张',
          type: 'text',
          required: true,
        },
        {
          key: 'gender',
          label: '性别',
          type: 'select',
          required: true,
          options: [
            { label: '男孩', value: 'male' },
            { label: '女孩', value: 'female' },
            { label: '不限', value: 'neutral' },
          ],
        },
        {
          key: 'birth',
          label: '出生年月日时',
          placeholder: '如：2024-05-12 09:30',
          type: 'text',
          required: true,
          hint: '用于八字五行喜忌推算',
        },
        {
          key: 'expectation',
          label: '你的期待',
          placeholder: '如：希望文雅、富贵、健康；避免俗字；字数 2-3 字',
          type: 'textarea',
          rows: 3,
          required: true,
        },
      ]}
      valueLabels={{
        gender: { male: '男', female: '女', neutral: '不限' },
      }}
    />
  );
}
