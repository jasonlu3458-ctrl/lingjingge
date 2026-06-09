'use client';

import { useState, useEffect } from 'react';
import BodyTypeAssessment from '@/components/BodyTypeAssessment';

interface TiliClientProps {
  userRole?: 'free' | 'member' | 'admin';
}

export default function TiliClient({ userRole = 'free' }: TiliClientProps) {
  const [isAssessmentOpen, setIsAssessmentOpen] = useState(false);
  const [formData, setFormData] = useState({
    age: '',
    body_type: '',
    symptoms: '',
  });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 页面加载时自动打开测评（仅首次）
  useEffect(() => {
    const hasAssessed = localStorage.getItem('tili_assessed');
    if (!hasAssessed) {
      setIsAssessmentOpen(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setReport(''); // 清空之前的结果
    try {
      // 构建 DIFY 输入：合并症状描述 + 体质类型
      const query = `【体质】${formData.body_type}\n【年龄】${formData.age}\n【症状】${formData.symptoms || '无'}`;

      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tili',
          query,
          inputs: {
            body_type: formData.body_type,
            age: formData.age,
            symptoms: formData.symptoms,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || `请求失败：${response.status}`);
        setLoading(false);
        return;
      }

      // DIFY 返回 SSE 流式响应（text/event-stream）
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          // 解析 SSE 格式：data: {...}\n\n
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') continue;
              try {
                const json = JSON.parse(data);
                if (json.event === 'message' && json.answer) {
                  fullText += json.answer;
                  setReport(fullText); // 实时更新
                } else if (json.event === 'error') {
                  setError(json.message || 'DIFY 返回错误');
                }
              } catch {
                // 忽略解析失败的行
              }
            }
          }
        }
      }

      if (!fullText) {
        setError('未收到有效回复');
      }
    } catch (err: any) {
      setError(err.message || '提交失败');
      console.error('提交失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentResult = (bodyType: string) => {
    setFormData({ ...formData, body_type: bodyType });
    setIsAssessmentOpen(false);
    // 记录已测评（避免每次进入页面都弹窗）
    localStorage.setItem('tili_assessed', 'true');
  };

  // 体质类型显示文本
  const bodyTypeText = formData.body_type
    ? {
        balanced: '平和 (精力充沛，睡眠良好，不易生病)',
        qi_deficiency: '气虚 (容易疲劳，说话有气无力，稍动就出汗)',
        yang_deficiency: '阳虚 (非常怕冷，手脚冰凉，喜热食热饮)',
        yin_deficiency: '阴虚 (口干咽燥，手心脚心发热，容易失眠)',
        phlegm_dampness: '痰湿 (体型偏胖，身体沉重，容易困倦，舌苔厚腻)',
      }[formData.body_type] || '尚未测评'
    : '尚未测评';

  return (
    <div className="min-h-screen bg-[#b88a4a] py-8">
      <main className="max-w-2xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">⚡</div>
          <h1 className="text-3xl font-serif text-[#f5f0eb] mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            AI炼体师
          </h1>
          <p className="text-[#d4c8b8]">炼形炼神，内外合一</p>
        </div>

        {/* 表单卡片 */}
        <div className="bg-[#e8dcc8] rounded-xl p-6 shadow-sm">
          {/* 提示框 - 只在测评未完成时显示 */}
          {!formData.body_type && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 text-center">
              📋 请先完成体质测评以获取个性化方案
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 年龄 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[#2c2c2c]">
                年龄 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-[#b88a4a] bg-white"
                placeholder="请输入年龄"
                min="1"
                max="120"
                required
              />
            </div>

            {/* 体质类型 - 自动填充 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[#2c2c2c]">
                体质类型 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={bodyTypeText}
                readOnly
                className="w-full p-2 border border-gray-200 rounded bg-gray-50 text-[#2c2c2c]"
              />
              <button
                type="button"
                onClick={() => setIsAssessmentOpen(true)}
                className="mt-2 text-sm text-[#9a7a3a] underline hover:text-[#b88a4a] transition-colors"
              >
                {formData.body_type ? '🔄 重新测评' : '⚡ 开始体质测评'}
              </button>
            </div>

            {/* 当前症状 */}
            <div>
              <label className="block text-sm font-medium mb-1 text-[#2c2c2c]">
                当前症状
              </label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-[#b88a4a] bg-white"
                placeholder="请描述身体不适（选填）"
                rows={3}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !formData.body_type || !formData.age}
              className="w-full py-3 bg-[#2c2c2c] text-white rounded hover:bg-[#4a4a4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳ 生成中...' : '⚡ 生成炼体方案'}
            </button>
          </form>
        </div>

        {/* 炼体方案报告 */}
        {report && (
          <div className="mt-6 bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-2xl font-serif text-[#2c2c2c] mb-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              📜 您的炼体方案
            </h2>
            {/* 分割 PREMIUM: 之前为免费部分，之后为付费部分 */}
            {(() => {
              const parts = report.split('PREMIUM:');
              const freePart = parts[0];
              const premiumPart = parts.length > 1 ? parts[1] : '';
              const isPaid = userRole !== 'free';
              return (
                <>
                  {/* 免费部分 */}
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {freePart}
                  </div>

                  {/* 付费部分 / 付费墙 */}
                  {premiumPart && (
                    <div className="mt-4">
                      {isPaid ? (
                        <div className="bg-white rounded border border-green-200 p-4">
                          <div className="text-green-600 text-sm font-medium mb-2">✅ 会员专属内容</div>
                          <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                            {premiumPart}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border border-dashed border-gray-400 rounded bg-gray-50">
                          <div className="text-sm text-gray-600 mb-2 font-medium">🔒 完整报告仅对会员开放</div>
                          <div className="text-sm text-gray-500 mb-3">
                            会员可查看：定制炼体计划、饮食建议、季节调整
                          </div>
                          <div className="flex flex-col sm:flex-row gap-3">
                            <button
                              onClick={() => {
                                window.location.href = '/api/create-checkout-session?type=single&report=tili';
                              }}
                              className="flex-1 py-2 bg-white border border-[#2c2c2c] text-[#2c2c2c] rounded hover:bg-gray-50 transition-colors"
                            >
                              单次解锁 · ¥9.9
                            </button>
                            <a
                              href="/tong/pricing"
                              className="flex-1 py-2 bg-[#b85a4a] text-white text-center rounded hover:bg-[#9a4a3a] transition-colors"
                            >
                              升级会员 · 全站解锁
                            </a>
                          </div>
                          <div className="text-xs text-gray-400 text-center mt-2">
                            单次解锁仅限当前报告，会员可查看所有深度内容
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}

            <button
              onClick={() => setReport(null)}
              className="mt-4 px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              关闭报告
            </button>
          </div>
        )}

        {/* 用户角色提示 */}
        {userRole === 'free' && (
          <div className="mt-4 text-center text-xs text-[#f5f0eb]/70">
            🔒 完整炼体方案（含呼吸法、功法详解）需会员订阅
          </div>
        )}
      </main>

      {/* 体质测评模态框 - 首次进入自动弹出 */}
      {isAssessmentOpen && (
        <BodyTypeAssessment
          onResult={handleAssessmentResult}
          onClose={() => setIsAssessmentOpen(false)}
        />
      )}
    </div>
  );
}
