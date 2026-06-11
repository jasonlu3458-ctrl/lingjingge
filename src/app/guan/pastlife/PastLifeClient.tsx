'use client';

import { useState } from 'react';
import { ButtonLoading } from '@/components/Loading';
import { FadeIn, ScaleIn, HoverScale } from '@/components/Animations';
import Disclaimer from '@/components/Disclaimer';
import ReportPaywall from '@/components/ReportPaywall';
import type { UserRole } from '@/lib/auth';

interface PastLifeClientProps {
  userRole: UserRole;
}

export default function PastLifeClient({ userRole }: PastLifeClientProps) {
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [gender, setGender] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult('');

    try {
      // 构建查询内容
      const query = `请根据以下信息为我照见前世：
出生日期：${birthDate}
出生时辰：${birthTime || '未知'}
性别：${gender === 'male' ? '男' : '女'}`;

      const response = await fetch('/api/dify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pastlife',
          query,
          inputs: {
            birthDate,
            birthTime: birthTime || '',
            gender
          }
        })
      });

      if (!response.ok) {
        throw new Error('请求失败');
      }

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法读取响应');
      }

      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.answer) {
                fullText += parsed.answer;
                setResult(fullText);
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

    } catch (error) {
      console.error('获取前世报告失败:', error);
      setResult('获取前世报告失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  // 按 PREMIUM: 切分报告
  const parts = result.split('PREMIUM:');
  const freePart = parts[0];
  const premiumPart = parts.length > 1 ? parts[1] : '';

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <main className="max-w-2xl mx-auto px-4 py-8">
        <FadeIn>
          <h1 className="text-3xl font-serif text-center mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            照见前尘
          </h1>
          <p className="text-center text-gray-600 mb-8">以宿世之因，照见今生之果</p>
        </FadeIn>

        <ScaleIn>
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                出生日期
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-[#2c2c2c] transition-colors"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                出生时辰（可选）
              </label>
              <select
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-[#2c2c2c] transition-colors"
              >
                <option value="">未知</option>
                <option value="zi">子时（23:00-01:00）</option>
                <option value="chou">丑时（01:00-03:00）</option>
                <option value="yin">寅时（03:00-05:00）</option>
                <option value="mao">卯时（05:00-07:00）</option>
                <option value="chen">辰时（07:00-09:00）</option>
                <option value="si">巳时（09:00-11:00）</option>
                <option value="wu">午时（11:00-13:00）</option>
                <option value="wei">未时（13:00-15:00）</option>
                <option value="shen">申时（15:00-17:00）</option>
                <option value="you">酉时（17:00-19:00）</option>
                <option value="xu">戌时（19:00-21:00）</option>
                <option value="hai">亥时（21:00-23:00）</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                性别
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2 border border-gray-200 rounded focus:outline-none focus:border-[#2c2c2c] transition-colors"
                required
              >
                <option value="">选择性别</option>
                <option value="male">男</option>
                <option value="female">女</option>
              </select>
            </div>
            <HoverScale>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#2c2c2c] text-white rounded hover:bg-[#4a4a4a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {loading ? <ButtonLoading text="正在照见..." disabled /> : '照见前尘'}
              </button>
            </HoverScale>
          </form>
        </ScaleIn>

        {result && (
          <div
            className="report-fade-in mt-8 bg-white rounded-xl p-6 shadow-sm"
          >
            <h2 className="text-xl font-serif mb-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              前世报告
            </h2>

            {/* 简本报告 + 付费墙（未登录访客主推「免费注册」，已登录免费用户主推「升级会员」） */}
            <div className="prose max-w-none whitespace-pre-wrap text-gray-700" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              <ReportPaywall
                userRole={userRole}
                freePart={freePart}
                premiumPart={premiumPart}
                premiumSections={['宿世因缘', '业力流转', '此生启示']}
                reportKey="pastlife"
              />
            </div>
          </div>
        )}

        {/* 页脚免责声明 */}
        <Disclaimer />
      </main>
    </div>
  );
}
