'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  testSubscriptionFlow, 
  testAlreadySubscribedCheck, 
  TEST_CASES,
  MOCK_USER,
  MOCK_PROFILE,
  MOCK_PRICE_IDS 
} from '@/lib/mock-subscription';

export default function SubscriptionTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [running, setRunning] = useState(false);

  const addResult = (title: string, result: any) => {
    setTestResults(prev => [...prev, {
      id: Date.now(),
      title,
      result,
      timestamp: new Date().toLocaleTimeString(),
    }]);
  };

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setRunning(true);
    console.log(`\n🚀 开始测试: ${testName}`);
    
    try {
      const result = await testFn();
      addResult(testName, result);
      console.log(`✅ 测试完成: ${testName}`, result);
    } catch (error) {
      addResult(testName, { error: error.message });
      console.error(`❌ 测试失败: ${testName}`, error);
    } finally {
      setRunning(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* 头部 */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            🧪 订阅流程测试工具
          </h1>
          <p style={{ color: '#666' }}>
            本地测试订阅流程的完整功能
          </p>
        </div>

        {/* Mock 数据展示 */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
            📊 Mock 数据配置
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {/* Mock 用户 */}
            <div style={{ 
              background: '#f9fafb', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#4b5563' }}>
                👤 Mock 用户
              </h3>
              <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(MOCK_USER, null, 2)}
              </pre>
            </div>

            {/* Mock Profile */}
            <div style={{ 
              background: '#f9fafb', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#4b5563' }}>
                📋 Mock Profile
              </h3>
              <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(MOCK_PROFILE, null, 2)}
              </pre>
            </div>

            {/* Mock Price IDs */}
            <div style={{ 
              background: '#f9fafb', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#4b5563' }}>
                💰 Stripe Price IDs
              </h3>
              <pre style={{ fontSize: '12px', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(MOCK_PRICE_IDS, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* 测试用例 */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
            🧪 测试用例
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            <button
              onClick={() => runTest('月度订阅流程', TEST_CASES.monthlySubscription)}
              disabled={running}
              style={{
                padding: '12px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: running ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: running ? 0.5 : 1,
              }}
            >
              📅 测试月度订阅
            </button>

            <button
              onClick={() => runTest('年度订阅流程', TEST_CASES.yearlySubscription)}
              disabled={running}
              style={{
                padding: '12px 20px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: running ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: running ? 0.5 : 1,
              }}
            >
              📆 测试年度订阅
            </button>

            <button
              onClick={() => runTest('重复订阅检查', TEST_CASES.alreadySubscribed)}
              disabled={running}
              style={{
                padding: '12px 20px',
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: running ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: running ? 0.5 : 1,
              }}
            >
              ⚠️ 测试重复订阅
            </button>

            <button
              onClick={() => runTest('未登录订阅', TEST_CASES.notLoggedIn)}
              disabled={running}
              style={{
                padding: '12px 20px',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: running ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                opacity: running ? 0.5 : 1,
              }}
            >
              🔒 测试未登录
            </button>
          </div>
        </div>

        {/* 测试结果 */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px', 
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold' }}>
              📝 测试结果 ({testResults.length})
            </h2>
            {testResults.length > 0 && (
              <button
                onClick={clearResults}
                style={{
                  padding: '8px 16px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                清空结果
              </button>
            )}
          </div>

          {testResults.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              color: '#9ca3af',
              fontSize: '16px'
            }}>
              点击上方测试按钮开始测试
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {testResults.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: item.result.error ? '#fef2f2' : '#f0fdf4',
                    border: `1px solid ${item.result.error ? '#fecaca' : '#bbf7d0'}`,
                    borderRadius: '8px',
                    padding: '16px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>
                        {item.result.error ? '❌' : '✅'}
                      </span>
                      <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                        {item.title}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {item.timestamp}
                    </span>
                  </div>
                  <pre style={{ 
                    fontSize: '12px', 
                    margin: 0, 
                    whiteSpace: 'pre-wrap', 
                    wordBreak: 'break-all',
                    color: item.result.error ? '#dc2626' : '#059669'
                  }}>
                    {JSON.stringify(item.result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 操作指南 */}
        <div style={{ 
          background: 'white', 
          borderRadius: '12px', 
          padding: '24px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
            📖 使用说明
          </h2>
          
          <div style={{ color: '#4b5563', fontSize: '14px', lineHeight: '1.8' }}>
            <p style={{ marginBottom: '12px' }}>
              <strong>1. Mock 数据:</strong> 所有测试都使用模拟数据，不需要真实的 Stripe 账户。
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>2. 测试用例:</strong> 点击不同的测试按钮来验证订阅流程的各种场景。
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>3. 查看结果:</strong> 每个测试的结果都会显示在下方，包括成功和失败的情况。
            </p>
            <p style={{ marginBottom: '12px' }}>
              <strong>4. 控制台日志:</strong> 打开浏览器开发者工具（F12）可以查看详细的控制台日志。
            </p>
            <p>
              <strong>5. 后续操作:</strong> 测试通过后，可以移除此测试页面，使用真实的 Stripe API 进行集成。
            </p>
          </div>
        </div>

        {/* 返回链接 */}
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link 
            href="/tong/pricing"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              background: '#2c2c2c',
              color: 'white',
              borderRadius: '30px',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            ← 返回定价页面
          </Link>
        </div>
      </div>
    </div>
  );
}
