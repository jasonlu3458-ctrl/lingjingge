'use client';
 
 interface TalkingLottieProps { 
   isSpeaking: boolean; 
 } 
 
 export default function TalkingLottie({ isSpeaking }: TalkingLottieProps) { 
   return ( 
     <div 
       style={{ 
         width: '100%', 
         height: '100%', 
         display: 'flex', 
         alignItems: 'center', 
         justifyContent: 'center', 
         animation: 'float 3s ease-in-out infinite', 
         position: 'relative' 
       }} 
     > 
       <style>{` 
         @keyframes float { 
           0%, 100% { transform: translateY(0px); } 
           50% { transform: translateY(-8px); } 
         } 
         @keyframes breathe { 
           0%, 100% { transform: scale(1); } 
           50% { transform: scale(0.95); } 
         } 
         @keyframes speak { 
           0%, 100% { transform: scaleY(1); } 
           50% { transform: scaleY(0.3); } 
         } 
       `}</style> 
 
       {/* 小尘的 SVG 形象 */} 
       <svg 
         viewBox="0 0 120 120" 
         width="100%" 
         height="100%" 
         style={{ maxWidth: '80px', maxHeight: '80px' }} 
       > 
         {/* 身体 - 灰布道袍 */} 
         <ellipse cx="60" cy="85" rx="35" ry="25" fill="#d4c5b0" /> 
         <rect x="40" y="60" width="40" height="30" rx="5" fill="#d4c5b0" /> 
         
         {/* 领口 */} 
         <path d="M50 60 L60 75 L70 60" fill="#b8a99a" /> 
         
         {/* 头 */} 
         <circle cx="60" cy="40" r="25" fill="#f5e6d3" /> 
         
         {/* 头发（小髻） */} 
         <ellipse cx="60" cy="18" rx="15" ry="8" fill="#3a3a3a" /> 
         <ellipse cx="60" cy="14" rx="8" ry="12" fill="#3a3a3a" transform="rotate(15, 60, 14)" /> 
         
         {/* 眼睛（闭合/张开的动画由 isSpeaking 控制） */} 
         <g transform="translate(48, 35)"> 
           <ellipse cx="0" cy="0" rx="4" ry="4" fill="#2c2c2c" /> 
           <circle cx="0" cy="0" r="2" fill="white" /> 
         </g> 
         <g transform="translate(72, 35)"> 
           <ellipse cx="0" cy="0" rx="4" ry="4" fill="#2c2c2c" /> 
           <circle cx="0" cy="0" r="2" fill="white" /> 
         </g> 
         
         {/* 嘴巴 - 说话时变化 */} 
         <g transform="translate(60, 48)"> 
           <ellipse 
             cx="0" 
             cy="0" 
             rx="6" 
             ry={isSpeaking ? 2 : 4} 
             fill="#2c2c2c" 
             style={{ 
               animation: isSpeaking ? 'speak 0.4s ease-in-out infinite' : 'none', 
               transformOrigin: 'center' 
             }} 
           /> 
           <ellipse 
             cx="0" 
             cy="0" 
             rx="5" 
             ry={isSpeaking ? 1 : 3} 
             fill="#f5e6d3" 
           /> 
         </g> 
         
         {/* 腮红 */} 
         <ellipse cx="40" cy="42" rx="6" ry="4" fill="rgba(255, 180, 180, 0.3)" /> 
         <ellipse cx="80" cy="42" rx="6" ry="4" fill="rgba(255, 180, 180, 0.3)" /> 
         
         {/* 手（拢在袖子里） */} 
         <ellipse cx="30" cy="70" rx="12" ry="8" fill="#d4c5b0" /> 
         <ellipse cx="90" cy="70" rx="12" ry="8" fill="#d4c5b0" /> 
       </svg> 
     </div> 
   ); 
 }