import ToolModeRunner from '../_shared/ToolModeRunner';

export const metadata = {
  title: 'AI 生肖师 · 灵境阁',
  description: '十二生肖，十二种人生智慧。',
};

export default function ZodiacPage() {
  return (
    <ToolModeRunner
      mode="click-to-reveal"
      difyType="zodiac"
      title="AI 生肖师"
      subtitle="十二生肖，十二种人生智慧"
      icon="🐉"
      themeColor="#a83838"
      blindBoxType="spin"
      buttonLabel="🎡 转你的生肖轮"
      hint="（12 生肖 · 轮转启示）"
      blindDuration={1800}
    />
  );
}
