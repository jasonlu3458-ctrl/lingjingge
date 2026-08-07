import ToolModeRunner from '../_shared/ToolModeRunner';

export const metadata = {
  title: 'AI 星座师 · 灵境阁',
  description: '仰望星空，十二宫位为你读心。',
};

export default function AstrologyPage() {
  return (
    <ToolModeRunner
      mode="click-to-reveal"
      difyType="astrology"
      title="AI 星座师"
      subtitle="仰望星空，十二宫位为你读心"
      icon="⭐"
      themeColor="#1e3a5f"
      blindBoxType="flip"
      buttonLabel="🃏 翻你的星卡"
      hint="（12 星座 · 今日启示）"
      blindDuration={1800}
    />
  );
}
