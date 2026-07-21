'use client';

import { useState, useEffect } from 'react';

export default function AIPersonaConfigurator() {
  const [persona, setPersona] = useState('');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/tenant-config').then(res => res.json()).then(data => {
      if (data.ai_persona_prefix) {
        setPersona(data.ai_persona_prefix);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaved(false);
    const res = await fetch('/api/admin/update-tenant', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_persona_prefix: persona }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
      <h2 className="text-xl font-semibold text-[#D4AF37] mb-6" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
        🤖 AI 人格配置
      </h2>

      {loading ? (
        <div className="text-center py-8 text-[#808080]">加载中...</div>
      ) : (
        <>
          <div className="mb-6">
            <label className="block text-sm text-[#C0C0C0] mb-2">
              AI 系统提示词前缀
            </label>
            <textarea
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white focus:border-[#D4AF37] focus:outline-none transition-colors resize-none"
              rows={6}
              placeholder="例如：你是牧心堂的禅茶导师，说话要像沏一壶老白茶，沉稳、温暖、有洞察力。"
            />
            <p className="text-xs text-[#808080] mt-2">
              此配置将作为 AI 回答的系统提示词前缀，影响 AI 的回答风格和人格设定
            </p>
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