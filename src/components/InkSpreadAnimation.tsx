'use client';

/**
 * 墨韵扩散动画组件
 * 用于 AI 生成时的加载占位，提升用户体验
 */

export default function InkSpreadAnimation() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-100 px-6 py-4 rounded-lg relative overflow-hidden">
        {/* 墨韵扩散动画 */}
        <div className="relative w-32 h-8 flex items-center justify-center">
          {/* 中心墨点 */}
          <div className="absolute w-3 h-3 bg-gray-800 rounded-full animate-pulse"></div>
          
          {/* 扩散墨韵 - 第一层 */}
          <div 
            className="absolute w-6 h-6 bg-gray-700 rounded-full opacity-60 animate-ink-spread-1"
            style={{ animation: 'inkSpread1 2s ease-out infinite' }}
          ></div>
          
          {/* 扩散墨韵 - 第二层 */}
          <div 
            className="absolute w-10 h-10 bg-gray-600 rounded-full opacity-40 animate-ink-spread-2"
            style={{ animation: 'inkSpread2 2s ease-out infinite 0.5s' }}
          ></div>
          
          {/* 扩散墨韵 - 第三层 */}
          <div 
            className="absolute w-14 h-14 bg-gray-500 rounded-full opacity-20 animate-ink-spread-3"
            style={{ animation: 'inkSpread3 2s ease-out infinite 1s' }}
          ></div>
          
          {/* 文字提示 */}
          <div className="absolute bottom-0 text-xs text-gray-600 whitespace-nowrap animate-pulse" 
               style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
            墨韵生成中...
          </div>
        </div>
        
        {/* 内嵌 CSS 动画 */}
        <style jsx>{`
          @keyframes inkSpread1 {
            0% {
              transform: scale(0.5);
              opacity: 0.8;
            }
            50% {
              transform: scale(1);
              opacity: 0.6;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
          
          @keyframes inkSpread2 {
            0% {
              transform: scale(0.5);
              opacity: 0.6;
            }
            50% {
              transform: scale(1);
              opacity: 0.4;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
          
          @keyframes inkSpread3 {
            0% {
              transform: scale(0.5);
              opacity: 0.4;
            }
            50% {
              transform: scale(1);
              opacity: 0.2;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    </div>
  );
}