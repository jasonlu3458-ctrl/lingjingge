'use client';

import { useState, useEffect } from 'react';
import type { TenantThemeConfig } from '@/lib/tenant-config';
import { DEFAULT_THEME_CONFIG } from '@/lib/tenant-config';

export default function ThemeConfigurator() {
  const [theme, setTheme] = useState<TenantThemeConfig>(DEFAULT_THEME_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/tenant-config').then(res => res.json()).then(data => {
      if (data.theme_config) {
        setTheme({ ...DEFAULT_THEME_CONFIG, ...data.theme_config });
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaved(false);
    const res = await fetch('/api/admin/update-tenant', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme_config: theme }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const colorFields = [
    { key: 'primary', label: '主色调', description: '品牌主色' },
    { key: 'primary_light', label: '主色调（亮）', description: '悬停/高亮状态' },
    { key: 'primary_dark', label: '主色调（暗）', description: '按下状态' },
    { key: 'gold', label: '金色', description: '强调色/标题色' },
    { key: 'gold_light', label: '金色（亮）', description: '金色高亮' },
    { key: 'gold_dark', label: '金色（暗）', description: '金色阴影' },
    { key: 'bg_dark', label: '背景色', description: '页面背景' },
    { key: 'bg_card', label: '卡片背景', description: '内容卡片' },
    { key: 'text_primary', label: '主文字色', description: '标题/重要文字' },
    { key: 'text_secondary', label: '次要文字', description: '正文/描述' },
    { key: 'text_muted', label: '弱化文字', description: '提示/辅助文字' },
    { key: 'border_color', label: '边框色', description: '分隔线/边框' },
  ] as const;

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
      <h2 className="text-xl font-semibold text-[#D4AF37] mb-6" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
        🎨 主题配置
      </h2>

      {loading ? (
        <div className="text-center py-8 text-[#808080]">加载中...</div>
      ) : (
        <>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-4 mb-6">
            {colorFields.map((field) => (
              <div key={field.key} className="bg-[#242424] rounded-lg p-4">
                <label className="block text-sm text-[#C0C0C0] mb-2">{field.label}</label>
                <input
                  type="color"
                  value={theme[field.key]}
                  onChange={(e) => setTheme({ ...theme, [field.key]: e.target.value })}
                  className="w-full h-10 rounded cursor-pointer border-0"
                />
                <p className="text-xs text-[#808080] mt-2">{field.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#242424] rounded-lg p-6 mb-6">
            <h3 className="text-sm text-[#C0C0C0] mb-4">预览</h3>
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: theme.bg_card, borderColor: theme.border_color, borderWidth: 1, borderStyle: 'solid' }}
              >
                <span 
                  className="text-2xl"
                  style={{ color: theme.gold }}
                >
                  阁
                </span>
              </div>
              <div className="flex-1">
                <p style={{ color: theme.text_primary }} className="font-medium">灵境阁管理后台</p>
                <p style={{ color: theme.text_muted }} className="text-sm">预览当前主题效果</p>
              </div>
              <div className="flex gap-2">
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: theme.primary }}
                />
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: theme.gold }}
                />
                <div 
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: theme.text_primary }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="muxintang-btn px-8 py-3"
          >
            {saved ? '✓ 已保存' : '保存配置'}
          </button>
        </>
      )}
    </div>
  );
}