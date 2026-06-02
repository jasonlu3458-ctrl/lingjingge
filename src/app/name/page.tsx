'use client';

import { useState, FormEvent } from 'react';
import Navbar from '@/components/Navbar';

const USE_MOCK_DATA = false;

export default function Name() {
  const [formData, setFormData] = useState({
    surname: '',
    givenName: '',
    gender: '',
    birthDate: '',
    birthTime: '',
  });
  const [results, setResults] = useState<Array<{ name: string; meaning: string }>>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mockData = [
    { "name": "云舒", "meaning": "取自'云卷云舒'，寓意生活从容、恬淡自在" },
    { "name": "清源", "meaning": "寓意心境清澈、源头活水，智慧通透" },
    { "name": "明心", "meaning": "寓意心明如镜，见性成佛" }
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setResults(mockData);
        setShowResults(true);
        return;
      }

      const apiKey = process.env.NEXT_PUBLIC_DIFY_NAME_API_KEY;
      const workflowId = process.env.NEXT_PUBLIC_DIFY_NAME_WORKFLOW_ID;

      if (!apiKey || !workflowId) {
        throw new Error('API Key 或工作流 ID 未配置，请检查环境变量');
      }

      const fullName = formData.surname + formData.givenName;
      const genderMap: { [key: string]: string } = {
        'male': '男',
        'female': '女'
      };

      const response = await fetch('https://api.dify.ai/v1/workflows/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: {
            name: fullName,
            gender: genderMap[formData.gender] || formData.gender,
            birthdate: formData.birthDate,
          },
          response_mode: 'blocking',
          user: 'user_123',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `请求失败: ${response.status}`);
      }

      const data = await response.json();
      console.log('Dify API 返回数据:', data);

      if (data.data && data.data.outputs && data.data.outputs.names) {
        const namesData = data.data.outputs.names;
        let parsedNames: Array<{ name: string; meaning: string }> = [];

        if (typeof namesData === 'string') {
          try {
            console.log('尝试解析 JSON 字符串:', namesData);
            parsedNames = JSON.parse(namesData);
            console.log('JSON 解析成功:', parsedNames);
          } catch (parseErr) {
            console.error('JSON 解析失败:', parseErr);
            throw new Error(`无法解析名字列表，原始数据: ${namesData}`);
          }
        } else if (Array.isArray(namesData)) {
          console.log('names 已是数组格式:', namesData);
          parsedNames = namesData;
        } else {
          throw new Error(`无法识别的数据格式，原始数据类型: ${typeof namesData}, 内容: ${JSON.stringify(namesData)}`);
        }

        if (!Array.isArray(parsedNames)) {
          throw new Error(`解析结果不是数组，原始数据: ${JSON.stringify(namesData)}`);
        }

        if (parsedNames.length === 0) {
          throw new Error('未收到有效的名字列表，解析结果为空数组');
        }

        const isValidFormat = parsedNames.every(item => 
          typeof item === 'object' && item !== null && 'name' in item && 'meaning' in item
        );

        if (!isValidFormat) {
          throw new Error(`名字列表格式不正确，期望格式: [{ name: '', meaning: '' }]，实际数据: ${JSON.stringify(parsedNames)}`);
        }

        setResults(parsedNames);
        setShowResults(true);
      } else {
        throw new Error('未收到有效的名字生成结果，缺少 data.outputs.names 字段，原始数据: ' + JSON.stringify(data));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成名字失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-zen-beige">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zen-ink mb-2">取名轩</h1>
          <p className="text-gray-600">融合传统文化与现代美学，为宝宝取一个好名字</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8">
            <h2 className="text-xl font-semibold text-zen-ink mb-6">基本信息</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-zen-ink mb-2">姓氏</label>
                <input
                  type="text"
                  value={formData.surname}
                  onChange={(e) => handleInputChange('surname', e.target.value)}
                  placeholder="请输入姓氏"
                  className="w-full px-4 py-2 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink bg-white bg-opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block text-zen-ink mb-2">名字（选填，用于参考）</label>
                <input
                  type="text"
                  value={formData.givenName}
                  onChange={(e) => handleInputChange('givenName', e.target.value)}
                  placeholder="请输入名字（非必填）"
                  className="w-full px-4 py-2 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink bg-white bg-opacity-60"
                />
              </div>

              <div>
                <label className="block text-zen-ink mb-2">性别</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={formData.gender === 'male'}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="mr-2"
                      required
                    />
                    <span className="text-zen-ink">男</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={formData.gender === 'female'}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="mr-2"
                      required
                    />
                    <span className="text-zen-ink">女</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-zen-ink mb-2">出生日期</label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => handleInputChange('birthDate', e.target.value)}
                  className="w-full px-4 py-2 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink bg-white bg-opacity-60"
                  required
                />
              </div>

              <div>
                <label className="block text-zen-ink mb-2">出生时辰（可选）</label>
                <select
                  value={formData.birthTime}
                  onChange={(e) => handleInputChange('birthTime', e.target.value)}
                  className="w-full px-4 py-2 border border-zen-gray rounded-lg focus:outline-none focus:ring-2 focus:ring-zen-ink bg-white bg-opacity-60"
                >
                  <option value="">请选择</option>
                  <option value="zi">子时 (23:00-01:00)</option>
                  <option value="chou">丑时 (01:00-03:00)</option>
                  <option value="yin">寅时 (03:00-05:00)</option>
                  <option value="mao">卯时 (05:00-07:00)</option>
                  <option value="chen">辰时 (07:00-09:00)</option>
                  <option value="si">巳时 (09:00-11:00)</option>
                  <option value="wu">午时 (11:00-13:00)</option>
                  <option value="wei">未时 (13:00-15:00)</option>
                  <option value="shen">申时 (15:00-17:00)</option>
                  <option value="you">酉时 (17:00-19:00)</option>
                  <option value="xu">戌时 (19:00-21:00)</option>
                  <option value="hai">亥时 (21:00-23:00)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading || !formData.surname || !formData.gender || !formData.birthDate}
                className="w-full px-6 py-3 bg-zen-ink text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? '生成中...' : '生成名字'}
              </button>
            </form>
          </div>

          <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8">
            <h2 className="text-xl font-semibold text-zen-ink mb-6">推荐名字</h2>
            {!showResults ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500">请填写左侧表单以生成名字</p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.map((item, index) => (
                  <div
                    key={index}
                    className="p-4 bg-zen-gray rounded-lg"
                  >
                    <p className="text-xl font-bold text-zen-ink">{item.name}</p>
                    <p className="text-sm text-gray-600 mt-1">{item.meaning}</p>
                  </div>
                ))}
                <button
                  onClick={() => setShowResults(false)}
                  className="w-full mt-4 px-6 py-2 border border-zen-ink text-zen-ink rounded-lg hover:bg-zen-gray transition-colors"
                >
                  重新生成
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}