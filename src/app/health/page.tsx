'use client';

import { useState } from 'react';

export default function Health() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    energy: '',
    cold: '',
    digestion: '',
    sleep: '',
    tongueColor: '',
    fatigue: '',
    tongueImage: null as File | null,
  });
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<{
    constitution: string;
    characteristics: string[];
    suggestions: string[];
  } | null>(null);

  const questions = [
    {
      id: 'energy',
      question: '您平时的精神状态如何？',
      options: ['精力充沛', '容易疲劳', '精神不振', '时而亢奋时而低落'],
    },
    {
      id: 'cold',
      question: '您是否怕冷或怕热？',
      options: ['怕冷', '怕热', '既怕冷又怕热', '无明显感觉'],
    },
    {
      id: 'digestion',
      question: '您的消化情况如何？',
      options: ['良好', '容易腹胀', '容易腹泻', '容易便秘'],
    },
    {
      id: 'sleep',
      question: '您的睡眠质量如何？',
      options: ['好', '一般', '差'],
    },
    {
      id: 'tongueColor',
      question: '您的舌苔颜色接近哪种？',
      options: ['红色', '白色', '黄色'],
    },
    {
      id: 'fatigue',
      question: '您是否经常感到乏力？',
      options: ['是', '否'],
    },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({ ...prev, tongueImage: e.target.files![0] }));
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_DIFY_HEALTH_API_KEY;
      const workflowId = process.env.NEXT_PUBLIC_DIFY_HEALTH_WORKFLOW_ID;

      if (!apiKey || !workflowId) {
        throw new Error('API Key 或工作流 ID 未配置，请检查环境变量');
      }

      console.log('========== 开始调用 Dify API ==========');
      
      const requestBody = {
        inputs: {
          sleep_quality: formData.sleep,
          tongue_color: formData.tongueColor,
          fatigue: formData.fatigue,
        },
        response_mode: 'blocking',
        user: 'lingjingge-user',
      };
      
      console.log('发送的请求体数据:', JSON.stringify(requestBody, null, 2));

      const response = await fetch('https://api.dify.ai/v1/workflows/run', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API 调用失败:', errorData.message || `HTTP ${response.status}`);
        throw new Error(errorData.message || `请求失败: ${response.status}`);
      }

      const data = await response.json();
      console.log('API 完整响应数据:', JSON.stringify(data, null, 2));

      let reportData = null;
      
      if (data.data && data.data.outputs && data.data.outputs.report) {
        reportData = data.data.outputs.report;
      } else if (data.answer) {
        reportData = data.answer;
      } else if (data.outputs && data.outputs.report) {
        reportData = data.outputs.report;
      } else if (data.result) {
        reportData = data.result;
      }

      console.log('提取的 report 字段值:', reportData);
      console.log('reportData 类型:', typeof reportData);

      if (reportData) {
        let parsedReport = null;
        
        if (typeof reportData === 'string') {
          try {
            parsedReport = JSON.parse(reportData);
            console.log('字符串解析为对象:', parsedReport);
          } catch (e) {
            console.log('reportData 是字符串，但不是有效的 JSON');
            
            const reportText = reportData;
            let constitution = '平和体质';
            
            if (reportText.includes('阳虚') || reportText.includes('怕冷')) {
              constitution = '阳虚体质';
            } else if (reportText.includes('阴虚') || reportText.includes('怕热')) {
              constitution = '阴虚体质';
            } else if (reportText.includes('痰湿') || reportText.includes('肥胖')) {
              constitution = '痰湿体质';
            } else if (reportText.includes('湿热')) {
              constitution = '湿热体质';
            } else if (reportText.includes('气虚') || reportText.includes('乏力')) {
              constitution = '气虚体质';
            } else if (reportText.includes('血虚')) {
              constitution = '血虚体质';
            } else if (reportText.includes('血瘀')) {
              constitution = '血瘀体质';
            } else if (reportText.includes('气郁')) {
              constitution = '气郁体质';
            } else if (reportText.includes('特禀')) {
              constitution = '特禀体质';
            }
            
            const lines = reportText.split(/[\n\r]+/).filter(line => line.trim());
            
            parsedReport = {
              constitution: constitution,
              characteristics: lines.slice(0, Math.min(3, lines.length)),
              suggestions: lines.slice(3)
            };
          }
        } else if (typeof reportData === 'object') {
          parsedReport = reportData;
        }

        if (parsedReport && parsedReport.constitution && parsedReport.characteristics && parsedReport.suggestions) {
          setReport(parsedReport);
        } else if (typeof reportData === 'string') {
          const lines = reportData.split(/[\n\r]+/).filter(line => line.trim());
          setReport({
            constitution: '分析完成',
            characteristics: lines.slice(0, Math.min(3, lines.length)),
            suggestions: lines.slice(3)
          });
        } else {
          throw new Error('报告格式不正确，请查看控制台');
        }
        
        setSubmitted(true);
      } else {
        throw new Error('无法解析分析结果，请查看控制台');
      }
    } catch (err) {
      console.error('错误信息:', err);
      setError(err instanceof Error ? err.message : '分析失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setStep(1);
    setFormData({
      energy: '',
      cold: '',
      digestion: '',
      sleep: '',
      tongueColor: '',
      fatigue: '',
      tongueImage: null,
    });
    setReport(null);
    setError(null);
  };

  const currentQuestion = questions[step - 1];

  return (
    <div className="min-h-screen bg-zen-beige">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-zen-ink mb-2">体质观察</h1>
          <p className="text-gray-600">中医体质辨识，了解自己的身体状态</p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!submitted ? (
          <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8">
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">问题 {step} / {questions.length}</span>
                <span className="text-sm text-gray-600">{Math.round((step / questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-zen-gray rounded-full h-2">
                <div
                  className="bg-zen-ink h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {step <= questions.length ? (
              <div>
                <h2 className="text-xl font-semibold text-zen-ink mb-6">
                  {currentQuestion.question}
                </h2>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, index) => (
                    <label
                      key={index}
                      className="flex items-center p-4 border border-zen-gray rounded-lg cursor-pointer hover:bg-zen-gray transition-colors"
                    >
                      <input
                        type="radio"
                        name={currentQuestion.id}
                        value={option}
                        checked={formData[currentQuestion.id as keyof typeof formData] === option}
                        onChange={(e) => handleInputChange(currentQuestion.id, e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-zen-ink">{option}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-8 flex justify-between">
                  <button
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                    className="px-6 py-2 border border-zen-ink text-zen-ink rounded-lg hover:bg-zen-gray transition-colors disabled:opacity-50"
                  >
                    上一步
                  </button>
                  <button
                    onClick={() => {
                      if (step < questions.length) {
                        setStep(step + 1);
                      } else {
                        handleSubmit();
                      }
                    }}
                    disabled={!formData[currentQuestion.id as keyof typeof formData] || isLoading}
                    className="px-6 py-2 bg-zen-ink text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? '分析中...' : (step === questions.length ? '提交分析' : '下一步')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-lg shadow-lg border border-zen-gray p-8 text-center">
            <div className="text-6xl mb-4">🌿</div>
            <h2 className="text-2xl font-bold text-zen-ink mb-4">分析完成</h2>
            {report ? (
              <>
                <p className="text-gray-600 mb-6">
                  根据您的问卷回答，初步判断您的体质类型为：
                  <span className="font-semibold text-zen-ink text-xl ml-2">{report.constitution}</span>
                </p>
                {report.characteristics && report.characteristics.length > 0 && (
                  <div className="bg-zen-gray rounded-lg p-6 text-left mb-6">
                    <h3 className="font-semibold text-zen-ink mb-3">体质特点：</h3>
                    <ul className="space-y-2 text-gray-700">
                      {report.characteristics.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {report.suggestions && report.suggestions.length > 0 && (
                  <div className="bg-zen-gray rounded-lg p-6 text-left mb-6">
                    <h3 className="font-semibold text-zen-ink mb-3">养生建议：</h3>
                    <ul className="space-y-2 text-gray-700">
                      {report.suggestions.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-zen-gray rounded-lg p-6 text-left mb-6">
                <p className="text-gray-700">分析完成，未能解析详细报告</p>
              </div>
            )}
            <button
              onClick={resetForm}
              className="px-8 py-3 bg-zen-ink text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              重新测试
            </button>
          </div>
        )}
      </main>
    </div>
  );
}