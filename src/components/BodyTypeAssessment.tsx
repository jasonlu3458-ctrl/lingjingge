'use client';

import { useState, useEffect } from 'react';

// 9 道中医体质测评问题（标准版）
// 每题 5 个选项对应 5 种体质，得分最高者即为用户体质
const QUESTIONS = [
  {
    id: 1,
    question: '您平时感觉精力如何？',
    options: [
      { label: '精力充沛，不易疲劳', value: 'balanced', score: 5 },
      { label: '容易疲劳，说话有气无力', value: 'qi_deficiency', score: 5 },
      { label: '非常怕冷，手脚冰凉', value: 'yang_deficiency', score: 5 },
      { label: '口干咽燥，手心脚心发热', value: 'yin_deficiency', score: 5 },
      { label: '身体沉重，容易困倦', value: 'phlegm_dampness', score: 5 },
    ],
  },
  {
    id: 2,
    question: '您的睡眠质量如何？',
    options: [
      { label: '睡眠良好，一觉到天亮', value: 'balanced', score: 5 },
      { label: '容易惊醒，多梦', value: 'qi_deficiency', score: 5 },
      { label: '喜欢温暖被窝，手脚不温', value: 'yang_deficiency', score: 5 },
      { label: '入睡困难，易失眠', value: 'yin_deficiency', score: 5 },
      { label: '嗜睡，睡不够', value: 'phlegm_dampness', score: 5 },
    ],
  },
  {
    id: 3,
    question: '您的饮食偏好？',
    options: [
      { label: '饮食规律，不挑食', value: 'balanced', score: 5 },
      { label: '食欲不佳，吃一点就饱', value: 'qi_deficiency', score: 5 },
      { label: '喜热食热饮', value: 'yang_deficiency', score: 5 },
      { label: '喜冷饮凉食', value: 'yin_deficiency', score: 5 },
      { label: '喜油腻厚味', value: 'phlegm_dampness', score: 5 },
    ],
  },
  {
    id: 4,
    question: '您的舌苔状况（参考）？',
    options: [
      { label: '舌淡红，苔薄白', value: 'balanced', score: 5 },
      { label: '舌淡胖有齿痕', value: 'qi_deficiency', score: 5 },
      { label: '舌淡胖嫩，苔白滑', value: 'yang_deficiency', score: 5 },
      { label: '舌红少苔', value: 'yin_deficiency', score: 5 },
      { label: '舌苔厚腻', value: 'phlegm_dampness', score: 5 },
    ],
  },
  {
    id: 5,
    question: '您对天气变化的反应？',
    options: [
      { label: '适应良好', value: 'balanced', score: 5 },
      { label: '容易感冒', value: 'qi_deficiency', score: 5 },
      { label: '冬季怕冷，夏季舒服', value: 'yang_deficiency', score: 5 },
      { label: '夏季怕热', value: 'yin_deficiency', score: 5 },
      { label: '梅雨季节特别难受', value: 'phlegm_dampness', score: 5 },
    ],
  },
  {
    id: 6,
    question: '您的大便情况？',
    options: [
      { label: '每日一次，成形顺畅', value: 'balanced', score: 5 },
      { label: '便溏（稀软）', value: 'qi_deficiency', score: 5 },
      { label: '大便溏烂，喜温喜暖', value: 'yang_deficiency', score: 5 },
      { label: '大便干燥', value: 'yin_deficiency', score: 5 },
      { label: '粘滞不爽，粘马桶', value: 'phlegm_dampness', score: 5 },
    ],
  },
  {
    id: 7,
    question: '您出汗的情况？',
    options: [
      { label: '正常出汗', value: 'balanced', score: 5 },
      { label: '稍动就出汗', value: 'qi_deficiency', score: 5 },
      { label: '自汗（不活动也出汗）', value: 'yang_deficiency', score: 5 },
      { label: '盗汗（夜间出汗）', value: 'yin_deficiency', score: 5 },
      { label: '汗液粘腻', value: 'phlegm_dampness', score: 5 },
    ],
  },
  {
    id: 8,
    question: '您的体型特征？',
    options: [
      { label: '体型匀称', value: 'balanced', score: 5 },
      { label: '肌肉松软', value: 'qi_deficiency', score: 5 },
      { label: '偏胖，肌肉松软', value: 'yang_deficiency', score: 5 },
      { label: '偏瘦', value: 'yin_deficiency', score: 5 },
      { label: '体型偏胖', value: 'phlegm_dampness', score: 5 },
    ],
  },
  {
    id: 9,
    question: '您的情绪状态？',
    options: [
      { label: '平和开朗', value: 'balanced', score: 5 },
      { label: '容易低落', value: 'qi_deficiency', score: 5 },
      { label: '内向安静', value: 'yang_deficiency', score: 5 },
      { label: '容易烦躁', value: 'yin_deficiency', score: 5 },
      { label: '容易郁怒', value: 'phlegm_dampness', score: 5 },
    ],
  },
];

// 体质类型描述
const BODY_TYPE_INFO: Record<string, { name: string; desc: string; color: string; icon: string }> = {
  balanced: { name: '平和质', desc: '精力充沛，睡眠良好，不易生病', color: 'emerald', icon: '🌿' },
  qi_deficiency: { name: '气虚质', desc: '容易疲劳，说话有气无力，稍动就出汗', color: 'amber', icon: '💨' },
  yang_deficiency: { name: '阳虚质', desc: '非常怕冷，手脚冰凉，喜热食热饮', color: 'orange', icon: '🔥' },
  yin_deficiency: { name: '阴虚质', desc: '口干咽燥，手心脚心发热，容易失眠', color: 'red', icon: '💧' },
  phlegm_dampness: { name: '痰湿质', desc: '体型偏胖，身体沉重，容易困倦，舌苔厚腻', color: 'yellow', icon: '☁️' },
};

interface BodyTypeAssessmentProps {
  onResult: (bodyType: string) => void;
  onClose: () => void;
}

export default function BodyTypeAssessment({ onResult, onClose }: BodyTypeAssessmentProps) {
  const [currentStep, setCurrentStep] = useState(0); // 0 = 介绍页, 1-9 = 题目, 10 = 结果
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<string | null>(null);

  // 模态框打开时锁定 body 滚动，防止背景被卡住
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;
    // 计算滚动条宽度，避免内容抖动
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      document.body.style.overflow = originalStyle;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, []);

  // ESC 键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentStep <= 9) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, onClose]);

  // 计算结果
  const calculateResult = (allAnswers: Record<number, string>) => {
    const scores: Record<string, number> = {
      balanced: 0,
      qi_deficiency: 0,
      yang_deficiency: 0,
      yin_deficiency: 0,
      phlegm_dampness: 0,
    };
    Object.values(allAnswers).forEach((value) => {
      scores[value] = (scores[value] || 0) + 1;
    });
    const maxScore = Math.max(...Object.values(scores));
    const winner = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
    return winner || 'balanced';
  };

  const handleSelect = (value: string) => {
    const newAnswers = { ...answers, [QUESTIONS[currentStep - 1].id]: value };
    setAnswers(newAnswers);

    if (currentStep < 9) {
      setCurrentStep(currentStep + 1);
    } else {
      // 最后一题，计算结果
      const finalResult = calculateResult(newAnswers);
      setResult(finalResult);
      setCurrentStep(10);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 1) {
      setCurrentStep(0);
    }
  };

  const handleRestart = () => {
    setAnswers({});
    setResult(null);
    setCurrentStep(0);
  };

  // 介绍页
  if (currentStep === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-[#f5f0eb] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">⚡</div>
            <h2 className="text-3xl font-serif text-[#2c2c2c] mb-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              中医体质测评
            </h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              通过 <span className="font-bold text-[#b88a4a]">9 道专业问题</span>，
              帮您准确判断属于哪种中医体质，从而获得个性化的炼体方案。
            </p>

            <div className="bg-white/60 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-bold text-gray-800 mb-3">📋 测评说明</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 共 9 道选择题，每题 5 个选项</li>
                <li>• 根据您<strong className="text-[#b88a4a]">最近 3 个月</strong>的实际情况选择</li>
                <li>• 用时约 2-3 分钟</li>
                <li>• 测评结果将自动填入炼体表单</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
              💡 提示：本测评仅供养生参考，如有疾病请咨询专业医师
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                稍后再说
              </button>
              <button
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-3 bg-[#2c2c2c] text-white rounded-lg hover:bg-[#4a4a4a] transition-colors"
              >
                开始测评 →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 答题页（1-9）
  if (currentStep >= 1 && currentStep <= 9) {
    const question = QUESTIONS[currentStep - 1];
    const progress = (currentStep / 9) * 100;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-[#f5f0eb] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* 进度条 */}
          <div className="sticky top-0 bg-[#f5f0eb] border-b border-gray-200 p-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>第 {currentStep} / 9 题</span>
              <span>已完成 {Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#b88a4a] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="p-8">
            <h3 className="text-xl font-serif text-[#2c2c2c] mb-6" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              {question.question}
            </h3>

            <div className="space-y-3">
              {question.options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className="w-full text-left p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-[#b88a4a] hover:bg-amber-50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300 group-hover:border-[#b88a4a] flex-shrink-0"></div>
                    <span className="text-gray-700 group-hover:text-[#2c2c2c]">{option.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* 上一题按钮 */}
            <div className="mt-6 flex justify-between">
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-sm text-gray-600 hover:text-[#2c2c2c] transition-colors"
              >
                ← 上一题
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                退出测评
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 结果页
  if (currentStep === 10 && result) {
    const info = BODY_TYPE_INFO[result];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-[#f5f0eb] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">{info.icon}</div>
            <h2 className="text-3xl font-serif text-[#2c2c2c] mb-2" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              您的体质是
            </h2>
            <div className="text-4xl font-bold text-[#b88a4a] mb-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              {info.name}
            </div>
            <p className="text-gray-700 mb-6 leading-relaxed">
              {info.desc}
            </p>

            <div className="bg-white/60 rounded-xl p-6 mb-6 text-left">
              <h3 className="font-bold text-gray-800 mb-3">📊 各体质得分</h3>
              <div className="space-y-2">
                {Object.entries(BODY_TYPE_INFO).map(([key, value]) => {
                  const count = Object.values(answers).filter((a) => a === key).length;
                  const max = 9;
                  const pct = (count / max) * 100;
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{value.name}</span>
                        <span className="text-gray-500">{count} / 9</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            key === result ? 'bg-[#b88a4a]' : 'bg-gray-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6 text-sm text-emerald-800">
              ✨ 体质已自动填入炼体表单，点击&ldquo;开始炼体方案&rdquo;即可获得个性化指导
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                重新测评
              </button>
              <button
                onClick={() => onResult(result)}
                className="flex-1 py-3 bg-[#2c2c2c] text-white rounded-lg hover:bg-[#4a4a4a] transition-colors"
              >
                开始炼体方案 →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
