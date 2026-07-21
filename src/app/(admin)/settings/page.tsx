'use client';

import ThemeConfigurator from '@/components/admin/ThemeConfigurator';
import AIPersonaConfigurator from '@/components/admin/AIPersonaConfigurator';
import MenuConfigurator from '@/components/admin/MenuConfigurator';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          道场通用配置
        </h1>
      </div>
      
      <ThemeConfigurator />
      <AIPersonaConfigurator />
      <MenuConfigurator />
    </div>
  );
}