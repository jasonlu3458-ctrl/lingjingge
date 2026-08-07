import ToolModeRunner from '../_shared/ToolModeRunner';

export const metadata = {
  title: 'AI 推背师 · 灵境阁',
  description: '推背图演绎，回望已逝，前瞻未至。一图一卷，问你心中所念。',
};

export default function TuibeiPage() {
  return (
    <ToolModeRunner
      mode="click-to-reveal"
      difyType="tuibei"
      title="AI 推背师"
      subtitle="推背图演绎，回望已逝，前瞻未至"
      icon="📜"
      themeColor="#8B4513"
      blindBoxType="shake"
      buttonLabel="🎲 今日摇签"
      hint="（六十签 · 一日一签）"
      blindDuration={1600}
    />
  );
}
