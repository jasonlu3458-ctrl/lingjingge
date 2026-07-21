'use client';

import { useState, useEffect } from 'react';

export default function ThreeSecretsPage() {
  const [activeTab, setActiveTab] = useState<'shenmi' | 'yimi' | 'koumi'>('shenmi');
  
  const [shenmiConfig, setShenmiConfig] = useState({
    knowledge_base_ids: '',
  });
  const [shenmiSaving, setShenmiSaving] = useState(false);

  const [yimiGenerating, setYimiGenerating] = useState(false);
  const [yimiResult, setYimiResult] = useState<{
    title: string;
    content: string;
    created_at: string;
  } | null>(null);

  const [koumiAudio, setKoumiAudio] = useState<string | null>(null);
  const [koumiGenerating, setKoumiGenerating] = useState(false);
  const [koumiVoiceId, setKoumiVoiceId] = useState<string | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const tenantId = 'muxintang';
      
      const res = await fetch(`/api/koumi/voice-clone?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.ok && data.config) {
        setKoumiVoiceId(data.config.voice_id || null);
      }
    } catch {
    }
  };

  const handleShenmiSave = async () => {
    setShenmiSaving(true);
    try {
      const ids = shenmiConfig.knowledge_base_ids
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/update-tenant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'muxintang',
          updates: {
            shenmi_config: {
              knowledge_base_ids: ids,
              updated_at: new Date().toISOString(),
            },
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('身密配置保存成功');
      } else {
        alert(data.error || '保存失败');
      }
    } catch {
      alert('保存失败');
    } finally {
      setShenmiSaving(false);
    }
  };

  const handleShenmiSync = async () => {
    setShenmiSaving(true);
    try {
      alert('正在同步文章到知识库...\n\n此功能需要手动在 Dify 后台上传文章文件。\n\n1. 导出牧心堂所有文章为 Markdown\n2. 登录 Dify 控制台\n3. 在知识库中上传文件\n4. 复制知识库 ID 粘贴到上方输入框');
    } catch {
    } finally {
      setShenmiSaving(false);
    }
  };

  const handleYimiGenerate = async () => {
    setYimiGenerating(true);
    setYimiResult(null);
    try {
      const res = await fetch('/api/yimi/generate-chronicle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: 'muxintang' }),
      });

      const data = await res.json();
      if (data.success) {
        setYimiResult({
          title: data.article.title,
          content: data.article.content,
          created_at: data.article.created_at,
        });
        alert(`思想编年史生成成功！共分析 ${data.articleCount} 篇文章`);
      } else {
        alert(data.error || '生成失败');
      }
    } catch {
      alert('生成失败');
    } finally {
      setYimiGenerating(false);
    }
  };

  const handleKoumiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setKoumiAudio(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleKoumiGenerate = async () => {
    if (!koumiAudio) {
      alert('请先上传录音样本');
      return;
    }

    setKoumiGenerating(true);
    try {
      const res = await fetch('/api/koumi/voice-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'muxintang',
          audioBase64: koumiAudio.split(',')[1],
        }),
      });

      const data = await res.json();
      if (data.success) {
        setKoumiVoiceId(data.voiceId);
        alert('专属声音克隆成功！');
      } else {
        alert(data.error || '克隆失败');
      }
    } catch {
      alert('克隆失败');
    } finally {
      setKoumiGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          🧘 三密法门配置
        </h1>
        <p className="text-[#808080] mt-2">身密 · 意密 · 口密 — 打造专属 AI 数字道场</p>
      </div>

      <div className="flex gap-4 border-b border-[#333333]">
        {[
          { key: 'shenmi', label: '身密', icon: '👤', desc: '数字分身' },
          { key: 'yimi', label: '意密', icon: '🧠', desc: '追忆录' },
          { key: 'koumi', label: '口密', icon: '🔊', desc: '法脉声音' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === tab.key
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-[#808080] hover:text-[#C0C0C0]'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            <span className="text-xs opacity-60">({tab.desc})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {activeTab === 'shenmi' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                <span>👤</span> 身密配置 — 数字分身
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[#808080] mb-2">
                    Dify 知识库 ID
                    <span className="text-[#D4AF37] ml-2">（可填写多个，用逗号分隔）</span>
                  </label>
                  <textarea
                    value={shenmiConfig.knowledge_base_ids}
                    onChange={(e) => setShenmiConfig({ ...shenmiConfig, knowledge_base_ids: e.target.value })}
                    placeholder="粘贴 Dify 知识库 ID，如：xxxx-xxxx-xxxx-xxxx"
                    rows={3}
                    className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#D4AF37] resize-none"
                  />
                  <p className="text-xs text-[#666] mt-2">
                    配置后，AI 数字分身将使用该知识库回答用户问题
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleShenmiSync}
                    disabled={shenmiSaving}
                    className="flex-1 bg-[#242424] text-[#C0C0C0] px-6 py-3 rounded-lg hover:bg-[#333] transition-colors disabled:opacity-50"
                  >
                    {shenmiSaving ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-[#C0C0C0] border-t-transparent rounded-full animate-spin mr-2" />
                        同步中...
                      </>
                    ) : (
                      '📥 一键同步文章到知识库'
                    )}
                  </button>
                  <button
                    onClick={handleShenmiSave}
                    disabled={shenmiSaving}
                    className="flex-1 bg-[#8B4513] text-[#D4AF37] px-6 py-3 rounded-lg hover:bg-[#A0522D] transition-colors disabled:opacity-50"
                  >
                    {shenmiSaving ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mr-2" />
                        保存中...
                      </>
                    ) : (
                      '💾 保存配置'
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">💡 配置说明</h3>
              <ul className="space-y-3 text-sm text-[#808080]">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>在 Dify 中创建独立知识库，上传师姐的文章、讲义、笔记</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>复制知识库 ID 粘贴到上方输入框（支持多个知识库）</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>保存后，AI 数字分身将自动使用该知识库回答问题</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>结合对话历史记忆，AI 能感知用户的当下状态</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'yimi' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                <span>🧠</span> 意密配置 — 思想编年史
              </h3>
              
              <div className="space-y-6">
                <button
                  onClick={handleYimiGenerate}
                  disabled={yimiGenerating}
                  className="w-full bg-gradient-to-r from-[#8B4513] to-[#D4AF37] text-black px-6 py-4 rounded-lg hover:opacity-90 transition-opacity text-lg font-semibold disabled:opacity-50"
                >
                  {yimiGenerating ? (
                    <>
                      <span className="inline-block w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                      AI 正在梳理思想脉络...
                    </>
                  ) : (
                    '✨ 一键生成我的思想编年史'
                  )}
                </button>

                <div className="text-sm text-[#808080] bg-[#0a0a0a] rounded-lg p-4">
                  <p className="mb-2">📋 生成流程：</p>
                  <ol className="list-decimal list-inside space-y-1 text-xs">
                    <li>扫描道场所有已发布文章</li>
                    <li>分析文章发布时间与核心观点演变</li>
                    <li>AI 自动生成《XXX · 思想编年史》</li>
                    <li>保存为专属会员电子书</li>
                  </ol>
                </div>
              </div>
            </div>

            {yimiResult && (
              <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
                <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">📄 生成结果</h3>
                <div className="space-y-4">
                  <div className="border-b border-[#333333] pb-4">
                    <h2 className="text-xl font-bold text-[#D4AF37]">{yimiResult.title}</h2>
                    <p className="text-xs text-[#666] mt-1">生成时间：{new Date(yimiResult.created_at).toLocaleString()}</p>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto prose prose-invert max-w-none">
                    {yimiResult.content.split('\n').map((line, index) => {
                      if (line.startsWith('# ')) {
                        return <h3 key={index} className="text-[#D4AF37] font-bold mt-4 mb-2">{line.slice(2)}</h3>;
                      }
                      if (line.startsWith('## ')) {
                        return <h4 key={index} className="text-[#C0C0C0] font-semibold mt-3 mb-1">{line.slice(3)}</h4>;
                      }
                      if (line.trim()) {
                        return <p key={index} className="text-sm text-[#C0C0C0] mb-2 leading-relaxed">{line}</p>;
                      }
                      return <br key={index} />;
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">💡 配置说明</h3>
              <ul className="space-y-3 text-sm text-[#808080]">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>系统自动扫描 content_articles 表中所有内容</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>以&quot;时间节点 + 灵光乍现的想法&quot;为叙事脉络</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>生成的编年史自动保存为付费会员专属内容</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>可作为付费会员的高价值赠品</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'koumi' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-4 flex items-center gap-2">
                <span>🔊</span> 口密配置 — 法脉声音
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[#808080] mb-2">
                    上传录音样本
                    <span className="text-[#D4AF37] ml-2">（3-5分钟，念诵经咒或文章）</span>
                  </label>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={handleKoumiUpload}
                    className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                  {koumiAudio && (
                    <p className="text-xs text-[#666] mt-2">✓ 录音文件已加载</p>
                  )}
                </div>

                <button
                  onClick={handleKoumiGenerate}
                  disabled={koumiGenerating || !koumiAudio}
                  className="w-full bg-[#8B4513] text-[#D4AF37] px-6 py-3 rounded-lg hover:bg-[#A0522D] transition-colors disabled:opacity-50"
                >
                  {koumiGenerating ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mr-2" />
                      AI 正在克隆声音...
                    </>
                  ) : (
                    '🎙️ 生成我的专属声音'
                  )}
                </button>

                {koumiVoiceId && (
                  <div className="bg-[#0a0a0a] rounded-lg p-4 border border-[#D4AF37]/30">
                    <p className="text-sm text-[#808080] mb-2">已生成的声音模型 ID：</p>
                    <code className="text-[#D4AF37] font-mono text-xs break-all">{koumiVoiceId}</code>
                    <p className="text-xs text-[#666] mt-2">
                      ✓ 配置已保存，用户在文章页面点击&quot;听阿阇梨诵读&quot;时将使用此声音
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
              <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">💡 配置说明</h3>
              <ul className="space-y-3 text-sm text-[#808080]">
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>上传一段 3-5 分钟的本人念诵录音</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>声音质量越高，克隆效果越好</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>生成的 Voice ID 将保存在 koumi_config 中</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D4AF37]">•</span>
                  <span>用户在 ContentReader 中点击播放时自动使用专属声音</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
