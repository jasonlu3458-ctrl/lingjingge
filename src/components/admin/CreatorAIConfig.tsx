'use client';

import { useState, useEffect } from 'react';

interface AcharyaAIConfig {
  id: string;
  acharya_id: string;
  acharya_name: string;
  dify_api_key: string;
  system_prompt: string;
  knowledge_base_ids: string[];
  created_at: string;
}

export default function CreatorAIConfig() {
  const [configs, setConfigs] = useState<AcharyaAIConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AcharyaAIConfig | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/acharya-ai-configs');
    const data = await res.json();
    setConfigs(data.configs || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除这个配置吗？')) {
      const res = await fetch(`/api/admin/acharya-ai-configs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchConfigs();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const configData = {
      acharya_id: formData.get('acharya_id') as string,
      acharya_name: formData.get('acharya_name') as string,
      dify_api_key: formData.get('dify_api_key') as string,
      system_prompt: formData.get('system_prompt') as string,
      knowledge_base_ids: (formData.get('knowledge_base_ids') as string)
        .split(',')
        .map(id => id.trim())
        .filter(id => id),
    };

    if (editing) {
      await fetch(`/api/admin/acharya-ai-configs/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });
    } else {
      await fetch('/api/admin/acharya-ai-configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configData),
      });
    }

    setShowForm(false);
    setEditing(null);
    fetchConfigs();
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          👤 创作者 AI 配置
        </h2>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="muxintang-btn px-4 py-2 text-sm"
        >
          + 新增配置
        </button>
      </div>

      {showForm && (
        <div className="bg-[#242424] rounded-lg p-4 mb-6">
          <h3 className="text-sm text-[#C0C0C0] mb-4">{editing ? '编辑配置' : '新增配置'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                name="acharya_id"
                defaultValue={editing?.acharya_id}
                placeholder="阿阇梨 ID"
                className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
                required
              />
              <input
                type="text"
                name="acharya_name"
                defaultValue={editing?.acharya_name}
                placeholder="阿阇梨名称"
                className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
                required
              />
            </div>
            <input
              type="text"
              name="dify_api_key"
              defaultValue={editing?.dify_api_key}
              placeholder="Dify API Key"
              className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none w-full font-mono text-sm"
              required
            />
            <textarea
              name="system_prompt"
              defaultValue={editing?.system_prompt}
              placeholder="系统提示词"
              rows={4}
              className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none w-full resize-none"
              required
            />
            <input
              type="text"
              name="knowledge_base_ids"
              defaultValue={editing?.knowledge_base_ids?.join(', ') || ''}
              placeholder="知识库 ID（多个用逗号分隔）"
              className="bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none w-full"
            />
            <div className="flex gap-2">
              <button type="submit" className="muxintang-btn px-4 py-2 text-sm">
                保存
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="px-4 py-2 text-sm text-[#808080] hover:text-[#C0C0C0] border border-[#333333] rounded-lg"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-[#808080]">加载中...</div>
      ) : (
        <div className="space-y-4">
          {configs.map((config) => (
            <div key={config.id} className="bg-[#242424] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[#C0C0C0] font-medium">{config.acharya_name}</p>
                  <p className="text-xs text-[#808080]">ID: {config.acharya_id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(config);
                      setShowForm(true);
                    }}
                    className="text-sm text-[#D4AF37] hover:text-[#F0D77E]"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="text-sm text-red-400 hover:text-red-300"
                  >
                    删除
                  </button>
                </div>
              </div>
              <div className="border-t border-[#333333] pt-3 space-y-2">
                <div>
                  <p className="text-xs text-[#808080]">API Key</p>
                  <p className="text-sm text-[#C0C0C0] font-mono truncate">{config.dify_api_key}</p>
                </div>
                <div>
                  <p className="text-xs text-[#808080]">系统提示词</p>
                  <p className="text-sm text-[#C0C0C0] line-clamp-2">{config.system_prompt}</p>
                </div>
                {config.knowledge_base_ids.length > 0 && (
                  <div>
                    <p className="text-xs text-[#808080]">知识库 ID</p>
                    <p className="text-sm text-[#C0C0C0]">{config.knowledge_base_ids.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}