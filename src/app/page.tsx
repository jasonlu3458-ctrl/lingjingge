'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SplashPage() {
  const [mounted, setMounted] = useState(false);
  const [showText, setShowText] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    setMounted(true);
    const timer1 = setTimeout(() => setShowText(true), 1800);
    const timer2 = setTimeout(() => setShowButton(true), 3200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (!mounted) {
    return <div style={{ minHeight: '100vh', background: '#f5f0eb' }} />;
  }

  return (
    <div className="splash-container">
      {/* 宣纸纹理背景 */}
      <div className="paper-texture"></div>
      
      {/* 水墨滴落动画层 */}
      <div className="ink-scene">
        {/* 主墨滴 - 从中心滴落 */}
        <div className="ink-main-drop">
          <div className="ink-core"></div>
          <div className="ink-ripple ripple-1"></div>
          <div className="ink-ripple ripple-2"></div>
          <div className="ink-ripple ripple-3"></div>
          <div className="ink-ripple ripple-4"></div>
        </div>
        
        {/* 辅助墨滴 - 从不同位置滴落 */}
        <div className="ink-drop ink-drop-1"></div>
        <div className="ink-drop ink-drop-2"></div>
        <div className="ink-drop ink-drop-3"></div>
        <div className="ink-drop ink-drop-4"></div>
        <div className="ink-drop ink-drop-5"></div>
        
        {/* 墨点飞溅效果 */}
        <div className="ink-splash splash-1"></div>
        <div className="ink-splash splash-2"></div>
        <div className="ink-splash splash-3"></div>
      </div>

      {/* 内容层 */}
      <div className="content-layer">
        <div className="title-container">
          <h1 className={`main-title ${showText ? 'show' : ''}`}>灵境阁</h1>
          <div className={`title-line ${showText ? 'show' : ''}`}></div>
        </div>
        <p className={`subtitle ${showText ? 'show' : ''}`}>AI灵境，东方智慧</p>
        
        {showButton && (
          <Link href="/home" className="enter-btn">
            入阁
          </Link>
        )}
      </div>

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .splash-container {
          min-height: 100vh;
          width: 100%;
          background-color: #f5f0eb;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        
        /* 宣纸纹理 */
        .paper-texture {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          opacity: 0.04;
          pointer-events: none;
          z-index: 0;
        }
        
        /* 水墨场景 */
        .ink-scene {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }
        
        /* 主墨滴 */
        .ink-main-drop {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .ink-core {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: radial-gradient(circle, #2c2c2c 0%, #1a1a1a 60%, transparent 100%);
          animation: coreForm 1s ease-out forwards;
          opacity: 0;
        }
        
        .ink-ripple {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          border: 1px solid rgba(44, 44, 44, 0.3);
          background: radial-gradient(circle, rgba(44, 44, 44, 0.08) 0%, rgba(44, 44, 44, 0.03) 50%, transparent 70%);
        }
        
        .ripple-1 {
          animation: rippleExpand1 2.5s ease-out forwards;
        }
        
        .ripple-2 {
          animation: rippleExpand2 3s ease-out forwards;
          animation-delay: 0.3s;
        }
        
        .ripple-3 {
          animation: rippleExpand3 3.5s ease-out forwards;
          animation-delay: 0.6s;
        }
        
        .ripple-4 {
          animation: rippleExpand4 4s ease-out forwards;
          animation-delay: 0.9s;
        }
        
        /* 辅助墨滴 */
        .ink-drop {
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(44, 44, 44, 0.12) 0%, rgba(44, 44, 44, 0.05) 50%, transparent 80%);
        }
        
        .ink-drop-1 {
          top: 30%;
          left: 25%;
          animation: dropExpand1 3s ease-out forwards;
          animation-delay: 0.5s;
        }
        
        .ink-drop-2 {
          top: 60%;
          left: 70%;
          animation: dropExpand2 3.5s ease-out forwards;
          animation-delay: 0.8s;
        }
        
        .ink-drop-3 {
          top: 20%;
          left: 65%;
          animation: dropExpand3 4s ease-out forwards;
          animation-delay: 1.2s;
        }
        
        .ink-drop-4 {
          top: 75%;
          left: 20%;
          animation: dropExpand4 3.8s ease-out forwards;
          animation-delay: 1.5s;
        }
        
        .ink-drop-5 {
          top: 45%;
          left: 15%;
          animation: dropExpand5 3.2s ease-out forwards;
          animation-delay: 1s;
        }
        
        /* 墨点飞溅 */
        .ink-splash {
          position: absolute;
          border-radius: 50%;
          background: rgba(44, 44, 44, 0.15);
        }
        
        .splash-1 {
          top: 52%;
          left: 48%;
          animation: splash1 1.5s ease-out forwards;
          animation-delay: 0.2s;
        }
        
        .splash-2 {
          top: 48%;
          left: 52%;
          animation: splash2 1.5s ease-out forwards;
          animation-delay: 0.3s;
        }
        
        .splash-3 {
          top: 51%;
          left: 51%;
          animation: splash3 1.5s ease-out forwards;
          animation-delay: 0.25s;
        }
        
        /* 动画关键帧 */
        @keyframes coreForm {
          0% { width: 0; height: 0; opacity: 1; }
          50% { opacity: 1; }
          100% { width: 20px; height: 20px; opacity: 0.8; }
        }
        
        @keyframes rippleExpand1 {
          0% { width: 0; height: 0; opacity: 1; }
          100% { width: 300px; height: 300px; opacity: 0; }
        }
        
        @keyframes rippleExpand2 {
          0% { width: 0; height: 0; opacity: 0.8; }
          100% { width: 450px; height: 450px; opacity: 0; }
        }
        
        @keyframes rippleExpand3 {
          0% { width: 0; height: 0; opacity: 0.6; }
          100% { width: 600px; height: 600px; opacity: 0; }
        }
        
        @keyframes rippleExpand4 {
          0% { width: 0; height: 0; opacity: 0.4; }
          100% { width: 750px; height: 750px; opacity: 0; }
        }
        
        @keyframes dropExpand1 {
          0% { width: 0; height: 0; opacity: 0.8; }
          100% { width: 200px; height: 200px; opacity: 0; }
        }
        
        @keyframes dropExpand2 {
          0% { width: 0; height: 0; opacity: 0.7; }
          100% { width: 250px; height: 250px; opacity: 0; }
        }
        
        @keyframes dropExpand3 {
          0% { width: 0; height: 0; opacity: 0.6; }
          100% { width: 180px; height: 180px; opacity: 0; }
        }
        
        @keyframes dropExpand4 {
          0% { width: 0; height: 0; opacity: 0.5; }
          100% { width: 220px; height: 220px; opacity: 0; }
        }
        
        @keyframes dropExpand5 {
          0% { width: 0; height: 0; opacity: 0.65; }
          100% { width: 150px; height: 150px; opacity: 0; }
        }
        
        @keyframes splash1 {
          0% { width: 4px; height: 4px; opacity: 0.8; transform: translate(-50%, -50%); }
          100% { width: 8px; height: 8px; opacity: 0; transform: translate(-150%, -100%); }
        }
        
        @keyframes splash2 {
          0% { width: 3px; height: 3px; opacity: 0.7; transform: translate(-50%, -50%); }
          100% { width: 6px; height: 6px; opacity: 0; transform: translate(50%, -150%); }
        }
        
        @keyframes splash3 {
          0% { width: 5px; height: 5px; opacity: 0.9; transform: translate(-50%, -50%); }
          100% { width: 10px; height: 10px; opacity: 0; transform: translate(100%, 50%); }
        }
        
        /* 内容层 */
        .content-layer {
          position: relative;
          z-index: 10;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .title-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .main-title {
          font-size: 72px;
          font-weight: bold;
          color: #2c2c2c;
          font-family: "Ma Shan Zheng", "STKaiti", "KaiTi", serif;
          letter-spacing: 20px;
          opacity: 0;
          transition: opacity 1.5s ease-out;
          text-shadow: 2px 2px 4px rgba(44, 44, 44, 0.08);
        }
        
        .main-title.show {
          opacity: 1;
        }
        
        .title-line {
          width: 150px;
          height: 2px;
          background: linear-gradient(90deg, transparent, #2c2c2c, transparent);
          margin-top: 20px;
          opacity: 0;
          transform: scaleX(0);
          transition: all 1s ease-out 0.5s;
        }
        
        .title-line.show {
          opacity: 0.5;
          transform: scaleX(1);
        }
        
        .subtitle {
          font-size: 16px;
          color: #5a5a5a;
          letter-spacing: 10px;
          opacity: 0;
          transition: opacity 1.5s ease-out 0.8s;
          margin-top: 30px;
          margin-bottom: 56px;
        }
        
        .subtitle.show {
          opacity: 1;
        }
        
        .enter-btn {
          padding: 14px 60px;
          background-color: #2c2c2c;
          color: #f5f0eb;
          border-radius: 35px;
          font-size: 18px;
          letter-spacing: 10px;
          text-decoration: none;
          box-shadow: 0 6px 24px rgba(44, 44, 44, 0.18);
          opacity: 0;
          animation: btnFadeIn 0.8s ease-out forwards;
          transition: all 0.3s ease;
        }
        
        .enter-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 8px 32px rgba(44, 44, 44, 0.28);
        }
        
        @keyframes btnFadeIn {
          from { opacity: 0; transform: translateY(25px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
