'use client';

import { useState } from 'react';

/**
 * Dify API 综合测试页面
 */
export default function DifyApiTest() {
  const [testResults, setTestResults] = useState<Record<string, {
    status: 'pending' | 'success' | 'error' | 'loading';
    message: string;
    time?: number;
  }>>({});

  const [testingAll, setTestingAll] = useState(false);

  // 所有需要测试的 API
  const apiList = [
    // 问道系列
    { key: 'ai-zen-master', name: 'AI禅师', path: '/wen/chan/ai-zen-master', type: '纯对话' },
    { key: 'gongan', name: '公案参究', path: '/wen/chan/gongan', type: '纯对话' },
    { key: 'awakening', name: '觉醒日记', path: '/wen/chan/awakening', type: '纯对话' },
    { key: 'mind', name: 'AI疗愈师', path: '/wen/liao/mind', type: '对话+报告' },
    { key: 'healing', name: '身心疗愈', path: '/wen/liao/healing', type: '纯对话' },
    { key: 'parenting', name: 'AI亲子导师', path: '/wen/liao/parenting', type: '表单+报告' },
    { key: 'yili', name: 'AI易理师', path: '/wen/yi/yili', type: '表单+报告' },
    { key: 'meditation', name: '正念冥想', path: '/wen/meditation', type: '冥想选择' },
    
    // 观我系列
    { key: 'health', name: 'AI体质观察', path: '/guan/health', type: '表单+报告' },
    { key: 'tili', name: 'AI炼体师', path: '/guan/tili', type: '表单+报告' },
    { key: 'name', name: 'AI取名轩', path: '/guan/name', type: '表单+报告' },
    { key: 'mingli', name: 'AI生命密码', path: '/guan/mingli', type: '表单+报告' },
    
    // 藏经系列
    { key: 'library_classics', name: '经典', path: '/zang/library/classics', type: '纯对话' },
    { key: 'library_treasure', name: '秘藏', path: '/zang/library/treasure', type: '纯对话' },
    
    // 同修系列
    { key: 'community_essence', name: '精华区', path: '/tong/community/essence', type: '纯对话' },
    { key: 'community_topics', name: '话题聚合', path: '/tong/community/topics', type: '纯对话' },
  ];

  // 测试单个 API
  const testApi = async (apiKey: string, apiName: string) => {
    const startTime = Date.now();
    
    setTestResults(prev => ({
      ...prev,
      [apiKey]: { status: 'loading', message: '⏳ 测试中...' }
    }));

    try {
      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: apiKey,
          query: '你好，请简单介绍一下自己',
          user: 'test-user'
        })
      });

      const time = Date.now() - startTime;

      if (response.ok) {
        setTestResults(prev => ({
          ...prev,
          [apiKey]: { 
            status: 'success', 
            message: `✅ 连接成功 (${time}ms)`,
            time
          }}));
      } else {
        const error = await response.text();
        setTestResults(prev => ({
          ...prev,
          [apiKey]: { 
            status: 'error', 
            message: `❌ HTTP ${response.status}: ${error.slice(0, 100)}`,
            time
          }}));
      }
    } catch (error) {
      const time = Date.now() - startTime;
      setTestResults(prev => ({
        ...prev,
        [apiKey]: { 
          status: 'error', 
          message: `❌ ${error instanceof Error ? error.message : '网络错误'}`,
          time
        }}));
    }
  };

  // 测试所有 API
  const testAllApis = async () => {
    setTestingAll(true);
    setTestResults({});
    
    for (const api of apiList) {
      await testApi(api.key, api.name);
      // 等待一下避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setTestingAll(false);
  };

  // 获取状态统计
  const stats = {
    total: apiList.length,
    success: Object.values(testResults).filter(r => r.status === 'success').length,
    error: Object.values(testResults).filter(r => r.status === 'error').length,
    pending: Object.values(testResults).filter(r => r.status === 'pending' || r.status === 'loading').length,
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🧪 Dify API 综合测试</h1>
      
      {/* 统计信息 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-600">总计</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{stats.success}</div>
          <div className="text-sm text-gray-600">成功</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{stats.error}</div>
          <div className="text-sm text-gray-600">失败</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-sm text-gray-600">待测试</div>
        </div>
      </div>

      {/* 测试按钮 */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={testAllApis}
          disabled={testingAll}
          className="px-6 py-3 bg-zen-terracotta text-white rounded-lg hover:bg-zen-terracotta/90 transition-colors disabled:opacity-50"
        >
          {testingAll ? '⏳ 测试中...' : '🚀 测试所有 API'}
        </button>
        <button
          onClick={() => setTestResults({})}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          🔄 重置结果
        </button>
      </div>

      {/* API 列表 */}
      <div className="space-y-4">
        {apiList.map(api => (
          <div 
            key={api.key} 
            className="bg-white border rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{api.name}</span>
                <span className="text-sm text-gray-500">({api.type})</span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded">{api.key}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${
                  testResults[api.key]?.status === 'success' ? 'text-green-600' :
                  testResults[api.key]?.status === 'error' ? 'text-red-600' :
                  'text-gray-400'
                }`}>
                  {testResults[api.key]?.time && `⏱️ ${testResults[api.key].time}ms`}
                </span>
                <button
                  onClick={() => testApi(api.key, api.name)}
                  disabled={testResults[api.key]?.status === 'loading'}
                  className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                >
                  {testResults[api.key]?.status === 'loading' ? '⏳' : '测试'}
                </button>
                <a
                  href={api.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-sm bg-zen-terracotta text-white rounded hover:bg-zen-terracotta/90 transition-colors"
                >
                  访问页面
                </a>
              </div>
            </div>
            
            {/* 测试结果 */}
            <div className={`text-sm p-3 rounded ${
              testResults[api.key]?.status === 'success' ? 'bg-green-50 text-green-700' :
              testResults[api.key]?.status === 'error' ? 'bg-red-50 text-red-700' :
              testResults[api.key]?.status === 'loading' ? 'bg-yellow-50 text-yellow-700' :
              'bg-gray-50 text-gray-500'
            }`}>
              {testResults[api.key]?.message || '⏳ 等待测试...'}
            </div>
          </div>
        ))}
      </div>

      {/* 环境变量检查 */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-4">📋 环境变量配置状态</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {apiList.map(api => (
            <div key={api.key} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                testResults[api.key]?.status === 'success' ? 'bg-green-500' :
                testResults[api.key]?.status === 'error' ? 'bg-red-500' :
                'bg-gray-400'
              }`}></span>
              <span className="text-gray-600">{api.name}:</span>
              <span className={`font-mono ${
                testResults[api.key]?.status === 'success' ? 'text-green-600' :
                testResults[api.key]?.status === 'error' ? 'text-red-600' :
                'text-gray-400'
              }`}>
                {testResults[api.key]?.status === 'success' ? '✅ 已配置' :
                 testResults[api.key]?.status === 'error' ? '❌ 失败' :
                 '⏳ 未测试'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 测试说明 */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-4">💡 测试说明</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>点击「测试」按钮可单独测试某个 API</li>
          <li>点击「测试所有 API」会依次测试所有接口</li>
          <li>点击「访问页面」可直接打开对应的功能页面</li>
          <li>测试成功表示 Dify API Key 配置正确且服务正常</li>
          <li>测试失败可能原因：API Key 错误、Dify 服务不可用、网络问题</li>
        </ul>
      </div>
    </div>
  );
}
