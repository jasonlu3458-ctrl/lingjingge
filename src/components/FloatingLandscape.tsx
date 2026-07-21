'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function FloatingLandscape() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: '福生无量。施主是来寻名、问道，还是只想找个清静处坐坐？' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 1500);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = { role: 'user' as const, content: inputValue.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsSpeaking(true);
    setLoading(true);

    try {
      const responses = [
        '施主不必过于焦虑，万事皆有因果。且听我一言：心若浮沉，浅笑安然。',
        '放下执念，方能看见更美的风景。一念放下，万般自在。',
        '这个问题问得好。让我想想…… 其实答案就在你心中，只是需要时间去发现。',
        '我理解你的困惑。很多事情，换个角度看，就会有不一样的感悟。',
        '这个问题我也经常思考。或许，我们不需要答案，需要的只是陪伴。'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      await new Promise(resolve => setTimeout(resolve, 1500));

      setMessages(prev => [...prev, { role: 'assistant', content: randomResponse }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，我今日有些心神不宁，改日再聊吧。' }]);
    } finally {
      setIsSpeaking(false);
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* 聊天窗口 */}
      {isOpen && (
        <div className="absolute bottom-40 right-0 w-72 h-[420px]">
          <div className="absolute inset-0 bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* 如意云纹装饰 */}
            <svg className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 opacity-80" viewBox="0 0 112 28">
              <path d="M15 14 Q18 6 28 10 T45 14 Q48 6 58 10 T75 14 Q78 6 88 10 T105 14" fill="none" stroke="#2c2c2c" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="15" cy="14" r="3.5" fill="#2c2c2c" opacity="0.3" />
              <circle cx="45" cy="14" r="3.5" fill="#2c2c2c" opacity="0.3" />
              <circle cx="75" cy="14" r="3.5" fill="#2c2c2c" opacity="0.3" />
              <circle cx="105" cy="14" r="3.5" fill="#2c2c2c" opacity="0.3" />
            </svg>

            <div className="flex flex-col h-full pt-6">
              {/* 头部 */}
              <div className="bg-[#2c2c2c] text-white px-5 py-3 flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/20 bg-[#f5f0eb]">
                  <svg viewBox="0 0 60 60" className="w-full h-full">
                    {/* 简化道童头像 */}
                    <circle cx="30" cy="32" r="20" fill="#f5e6d3" />
                    <ellipse cx="30" cy="18" rx="12" ry="7" fill="#3a3a3a" />
                    <rect x="26" y="13" width="8" height="8" rx="1" fill="#3a3a3a" />
                    <circle cx="24" cy="30" r="2.5" fill="#2c2c2c" />
                    <circle cx="36" cy="30" r="2.5" fill="#2c2c2c" />
                    <circle cx="24" cy="30" r="1" fill="white" />
                    <circle cx="36" cy="30" r="1" fill="white" />
                    <ellipse cx="30" cy="36" rx="4" ry="2.5" fill="#2c2c2c" />
                    <ellipse cx="23" cy="33" rx="3" ry="2" fill="rgba(255,180,180,0.3)" />
                    <ellipse cx="37" cy="33" rx="3" ry="2" fill="rgba(255,180,180,0.3)" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-base">小尘</h3>
                  <p className="text-[#f5f0eb]/60 text-xs">AI 引路人</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 消息区域 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fafaf9]">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-[#2c2c2c] text-white rounded-br-sm'
                          : 'bg-white text-[#2c2c2c] border border-[#e8e4e0] rounded-bl-sm shadow-sm'
                      }`}
                    >
                      <p className="text-xs leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-sm border border-[#e8e4e0] shadow-sm">
                      <div className="flex gap-0.5">
                        <div className="w-2 h-2 bg-[#2c2c2c]/30 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-[#2c2c2c]/30 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-[#2c2c2c]/30 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* 输入区域 */}
              <div className="p-4 bg-white border-t border-[#e8e4e0]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="说点什么..."
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-[#f5f0eb] rounded-full border border-[#e8e4e0] focus:outline-none focus:border-[#2c2c2c]/30 text-sm"
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !inputValue.trim()}
                    className="w-9 h-9 bg-[#2c2c2c] text-white rounded-full flex items-center justify-center hover:bg-[#2c2c2c]/90 transition-colors disabled:bg-[#e8e4e0] disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 小道童头像 - 更大尺寸 */}
      <button
        onClick={handleToggle}
        className="relative w-[120px] h-[150px] cursor-pointer transition-transform hover:scale-105"
        style={{
          filter: 'drop-shadow(0 6px 16px rgba(44, 44, 44, 0.18))',
        }}
      >
        {/* 外发光效果 */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/50 to-white/80 rounded-full blur-xl opacity-60 animate-pulse" />
        
        {/* 道童 SVG */}
        <div className="relative w-full h-full">
          <svg viewBox="0 0 100 120" className="w-full h-full">
            {/* 道袍（上半身） */}
            <ellipse cx="50" cy="90" rx="32" ry="22" fill="#d4c5b0" />
            <rect x="25" y="65" width="50" height="32" rx="8" fill="#d4c5b0" />
            <path d="M33 65 L50 78 L67 65" fill="#b8a99a" />
            
            {/* 袖子 */}
            <ellipse cx="18" cy="72" rx="12" ry="8" fill="#d4c5b0" />
            <ellipse cx="82" cy="72" rx="12" ry="8" fill="#d4c5b0" />
            
            {/* 双手合十 */}
            <ellipse cx="50" cy="70" rx="10" ry="18" fill="#f5e6d3" />
            <path d="M42 65 L50 80 L58 65" stroke="#d4c5b0" strokeWidth="1" fill="none" />
            
            {/* 头 */}
            <circle cx="50" cy="40" r="25" fill="#f5e6d3" />
            
            {/* 道冠 */}
            <ellipse cx="50" cy="20" rx="16" ry="9" fill="#3a3a3a" />
            <rect x="44" y="14" width="12" height="10" rx="2" fill="#3a3a3a" />
            <ellipse cx="50" cy="16" rx="5" ry="5" fill="#5a5a5a" />
            <ellipse cx="50" cy="16" rx="2" ry="3" fill="#87ceeb" />
            
            {/* 眼睛 */}
            <g transform="translate(40, 38)">
              <ellipse cx="0" cy="0" rx="4" ry="4" fill="#2c2c2c" />
              <circle cx="0" cy="0" r="1.5" fill="white" />
            </g>
            <g transform="translate(60, 38)">
              <ellipse cx="0" cy="0" rx="4" ry="4" fill="#2c2c2c" />
              <circle cx="0" cy="0" r="1.5" fill="white" />
            </g>
            
            {/* 眉毛 */}
            <path d="M34 30 Q40 28 46 30" stroke="#3a3a3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            <path d="M54 30 Q60 28 66 30" stroke="#3a3a3a" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            
            {/* 嘴巴 - 可动 */}
            <ellipse
              cx="50"
              cy="48"
              rx="6"
              ry={isSpeaking ? 2 : 3.5}
              fill="#2c2c2c"
              className={isSpeaking ? 'animate-speak' : ''}
              style={{ transformOrigin: 'center' }}
            />
            
            {/* 腮红 */}
            <ellipse cx="36" cy="44" rx="5" ry="3" fill="rgba(255, 180, 180, 0.35)" />
            <ellipse cx="64" cy="44" rx="5" ry="3" fill="rgba(255, 180, 180, 0.35)" />
            
            {/* 耳朵 */}
            <ellipse cx="24" cy="42" rx="4" ry="5" fill="#f5e6d3" />
            <ellipse cx="76" cy="42" rx="4" ry="5" fill="#f5e6d3" />
          </svg>
        </div>
      </button>

      {/* 自定义动画 */}
      <style>{`
        @keyframes speak {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.3); }
        }
        .animate-speak {
          animation: speak 0.35s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}