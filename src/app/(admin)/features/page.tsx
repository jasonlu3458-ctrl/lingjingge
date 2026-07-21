'use client';

import { useState, useEffect } from 'react';

interface FeatureConfig {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const availableFeatures: FeatureConfig[] = [
  { key: 'ai_wallpaper', label: 'AI 智能壁纸', description: '每日自动生成禅意壁纸，支持AI绘图', icon: '🖼️' },
  { key: 'pet_zone', label: '宠物专区', description: '开放宠物命名、饮食、配饰等功能', icon: '🐾' },
  { key: 'ebook_download', label: '会员电子书下载', description: '允许会员下载生成的电子书PDF', icon: '📥' },
  { key: 'consultation_form', label: '咨询表单定制', description: '启用自定义咨询表单功能', icon: '📝' },
  { key: 'ai_poster', label: 'AI 海报生成', description: '每日自动生成传播海报', icon: '🎨' },
  { key: 'daily_digest', label: '每日禅机', description: '每日推送禅机内容', icon: '✨' },
];

export default function FeaturesPage() {
  const [config, setConfig] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFeatures();
  }, []);

  async function fetchFeatures() {
    try {
      const res = await fetch('/api/admin/features');
      const data = await res.json();
      setConfig(data.extra_config || {});
    } catch (error) {
      console.error('Failed to fetch features:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeature(key: string) {
    setSaving(true);
    const newConfig = { ...config, [key]: !config[key] };
    
    try {
      const res = await fetch('/api/admin/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extra_config: newConfig }),
      });
      
      if (res.ok) {
        setConfig(newConfig);
      }
    } catch (error) {
      console.error('Failed to save feature:', error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-[#D4AF37]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            🧩 功能市场
          </h1>
          <p className="text-[#808080] mt-2">开启或关闭各项功能，配置即时生效</p>
        </div>
        <div className="text-sm text-[#808080]">
          当前启用 {Object.values(config).filter(Boolean).length} / {availableFeatures.length} 项
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableFeatures.map((feature) => (
          <div
            key={feature.key}
            className={`relative p-6 rounded-xl border transition-all duration-300 ${
              config[feature.key]
                ? 'bg-[#8B4513]/10 border-[#D4AF37]/50'
                : 'bg-[#1a1a1a] border-[#333333] hover:border-[#444444]'
            }`}
          >
            {config[feature.key] && (
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 bg-[#D4AF37] text-[#1a1a1a] text-xs font-bold rounded-full">
                  已启用
                </span>
              </div>
            )}

            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${
                config[feature.key] ? 'bg-[#D4AF37]/20' : 'bg-[#2a2a2a]'
              }`}>
                {feature.icon}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold mb-1 ${
                  config[feature.key] ? 'text-[#D4AF37]' : 'text-[#C0C0C0]'
                }`}>
                  {feature.label}
                </h3>
                <p className="text-sm text-[#808080]">{feature.description}</p>
              </div>
            </div>

            <button
              onClick={() => toggleFeature(feature.key)}
              disabled={saving}
              className={`mt-4 w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                config[feature.key]
                  ? 'bg-[#D4AF37] text-[#1a1a1a] hover:bg-[#E5C142]'
                  : 'bg-[#2a2a2a] text-[#C0C0C0] hover:bg-[#3a3a3a] border border-[#444444]'
              } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {saving ? (
                <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                config[feature.key] ? '关闭功能' : '开启功能'
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-[#1a1a1a] rounded-xl border border-[#333333]">
        <h3 className="font-semibold text-[#D4AF37] mb-3">📖 使用说明</h3>
        <ul className="space-y-2 text-sm text-[#808080]">
          <li>• 开启功能后，前台页面会自动显示对应入口</li>
          <li>• 关闭功能后，对应入口会立即隐藏</li>
          <li>• 所有配置保存在租户的 extra_config 字段中</li>
          <li>• 配置变更无需重新部署，即时生效</li>
        </ul>
      </div>
    </div>
  );
}
