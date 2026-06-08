'use client';

import { useState } from 'react';
import { callCommunityAssistant } from '@/lib/community-api';

/**
 * 社区助手测试页面
 */
export default function CommunityApiTest() {
  const [testType, setTestType] = useState<'classify' | 'knowledge' | 'essence' | 'topic'>('classify');
  const [input, setInput] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { result } = await callCommunityAssistant(testType, input);
      setResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败');
    } finally {
      setLoading(false);
    }
  };

  const testExamples = {
    classify: '我最近运势不好，想问问大师...',
    knowledge: '什么是禅宗？',
    essence: '通过这段时间的禅修练习，我有了以下感悟：首先，心态变得更加平和，面对生活中的挫折不再像以前那样焦虑。其次，我学会了观察自己的念头，而不是被它们牵着走。正如《金刚经》所说："凡所有相，皆是虚妄"，只有保持觉察，才能不被外境所转。',
    topic: '2026-06-07'
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🧘 社区助手 API 测试</h1>
      
      {/* 功能选择 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">选择功能</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(['classify', 'knowledge', 'essence', 'topic'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setTestType(type);
                setResult(null);
                setError(null);
                setInput(testExamples[type]);
              }}
              className={`px-4 py-2 rounded transition-colors ${
                testType === type
                  ? 'bg-zen-terracotta text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {type === 'classify' && '📝 分类'}
              {type === 'knowledge' && '📚 知识库'}
              {type === 'essence' && '💎 精华识别'}
              {type === 'topic' && '🪷 话题生成'}
            </button>
          ))}
        </div>
      </div>

      {/* 功能说明 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">
          {testType === 'classify' && '📝 帖子分类'}
          {testType === 'knowledge' && '📚 知识库问答'}
          {testType === 'essence' && '💎 精华识别'}
          {testType === 'topic' && '🪷 话题生成'}
        </h3>
        <p className="text-sm text-gray-600">
          {testType === 'classify' && '根据帖子内容自动识别并分类到相应主题'}
          {testType === 'knowledge' && '从知识库中检索相关内容并回答问题'}
          {testType === 'essence' && '识别帖子是否为精华内容，并给出理由'}
          {testType === 'topic' && '根据日期生成今日参究话题'}
        </p>
      </div>

      {/* 输入表单 */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            {testType === 'topic' ? '日期' : '输入内容'}
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-zen-terracotta focus:border-transparent"
            rows={testType === 'topic' ? 1 : 4}
            placeholder={
              testType === 'topic' 
                ? '输入日期，例如：2026-06-07'
                : '输入测试内容...'
            }
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-zen-terracotta text-white rounded-lg hover:bg-zen-terracotta/90 transition-colors disabled:opacity-50"
        >
          {loading ? '⏳ 处理中...' : '🚀 测试'}
        </button>
      </form>

      {/* 错误信息 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600">❌ 错误：{error}</p>
        </div>
      )}

      {/* 结果展示 */}
      {result && (
        <div className="p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="font-semibold mb-4">📤 返回结果</h3>
          <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
            {result}
          </div>
        </div>
      )}

      {/* 使用示例 */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-4">💡 代码使用示例</h3>
        <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-auto text-sm">
{`// 直接调用 API
const response = await fetch('/api/dify/community', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type, content, user })
});
const { result } = await response.json();

// 帖子分类
const tag = await callCommunityAssistant('classify', '我最近运势不好...');
// result: "问卦"

// 知识库问答
const answer = await callCommunityAssistant('knowledge', '什么是禅宗？');
// result: "禅宗是佛教的一个重要流派..."

// 精华识别
const essence = await callCommunityAssistant('essence', '深度帖子内容...');
// result: "是精华：内容深入，有独到见解..."

// 话题生成
const topic = await callCommunityAssistant('topic', '2026-06-07');
// result: "今日参究：什么是真正的放下？"`}
        </pre>
      </div>
    </div>
  );
}
