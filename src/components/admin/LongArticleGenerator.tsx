'use client';

import { useState } from 'react';

export default function LongArticleGenerator() {
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [article, setArticle] = useState<{
    id: string;
    title: string;
    content: string;
    created_at: string;
  } | null>(null);
  const [wordCount, setWordCount] = useState(0);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    setWordCount(e.target.value.length);
  };

  const handleGenerate = async () => {
    if (wordCount < 50) {
      alert('笔记内容至少需要50字');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes,
          title: title.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setArticle(data.article);
      } else {
        alert(data.error || '生成文章失败');
      }
    } catch (error) {
      console.error('[article] generate error:', error);
      alert('生成文章失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setNotes('');
    setTitle('');
    setWordCount(0);
    setArticle(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          📚 长文生成器
        </h1>
        <p className="text-[#808080] mt-2">将碎片化笔记自动生成长篇文章或电子书</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
            <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">📝 输入笔记内容</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-[#808080] mb-2">文章标题（可选）</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="如：阿阇梨年度开示录"
                className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-[#808080]">笔记内容</label>
                <span className="text-xs text-[#666]">{wordCount} 字</span>
              </div>
              <textarea
                value={notes}
                onChange={handleNotesChange}
                placeholder="请粘贴您的碎片化笔记、感悟、问答等内容...&#10;&#10;示例：&#10;- 关于静心的心得&#10;- 风水布局的要点&#10;- 八字命理的思考&#10;- 禅修冥想的体会"
                rows={12}
                className="w-full bg-[#0a0a0a] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-[#555] focus:outline-none focus:border-[#D4AF37] resize-none"
              />
              <p className="text-xs text-[#666] mt-2">提示：输入越多越详细，生成的文章越丰富（至少50字）</p>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleGenerate}
                disabled={loading || wordCount < 50}
                className="flex-1 bg-[#8B4513] text-[#D4AF37] px-6 py-3 rounded-lg hover:bg-[#A0522D] transition-colors text-lg disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin mr-2" />
                    生成中...
                  </>
                ) : (
                  '✨ 生成长文'
                )}
              </button>
              <button
                onClick={handleClear}
                className="bg-[#242424] text-[#808080] px-6 py-3 rounded-lg hover:bg-[#333] transition-colors"
              >
                重置
              </button>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
            <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">💡 生成规则</h3>
            <ul className="space-y-2 text-sm text-[#808080]">
              <li className="flex items-start gap-2">
                <span className="text-[#D4AF37]">•</span>
                <span>AI 将自动分析笔记内容，提取关键主题</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4AF37]">•</span>
                <span>根据主题生成文章大纲，逐一扩展成完整章节</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4AF37]">•</span>
                <span>语言风格保持传统文化韵味，使用恰当的比喻和典故</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#D4AF37]">•</span>
                <span>生成的文章会自动保存到数据库，可在前台&quot;会员专属&quot;区域查看</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#333333]">
          <h3 className="text-lg font-semibold text-[#D4AF37] mb-4">📄 生成结果</h3>
          
          {article ? (
            <div className="space-y-4">
              <div className="border-b border-[#333333] pb-4">
                <h2 className="text-xl font-bold text-[#D4AF37]">{article.title}</h2>
                <p className="text-xs text-[#666] mt-1">生成时间：{new Date(article.created_at).toLocaleString()}</p>
              </div>
              
              <div className="prose prose-invert max-w-none max-h-[600px] overflow-y-auto pr-2">
                {article.content.split('\n').map((line, index) => {
                  if (line.startsWith('# ')) {
                    return <h3 key={index} className="text-[#D4AF37] font-bold mt-4 mb-2">{line.slice(2)}</h3>;
                  }
                  if (line.startsWith('## ')) {
                    return <h4 key={index} className="text-[#C0C0C0] font-semibold mt-3 mb-1">{line.slice(3)}</h4>;
                  }
                  if (line.startsWith('### ')) {
                    return <h5 key={index} className="text-[#C0C0C0] font-medium mt-2 mb-1">{line.slice(4)}</h5>;
                  }
                  if (line.startsWith('- ')) {
                    return <p key={index} className="text-sm text-[#C0C0C0] pl-4 mb-1">{line}</p>;
                  }
                  if (line.startsWith('* ') || line.startsWith('**')) {
                    return <p key={index} className="text-sm text-[#C0C0C0] mb-1">{line}</p>;
                  }
                  if (line.trim()) {
                    return <p key={index} className="text-sm text-[#C0C0C0] mb-2 leading-relaxed">{line}</p>;
                  }
                  return <br key={index} />;
                })}
              </div>
              
              <div className="border-t border-[#333333] pt-4 flex gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(article.content)}
                  className="flex-1 bg-[#242424] text-[#C0C0C0] px-4 py-2 rounded-lg hover:bg-[#333] transition-colors text-sm"
                >
                  📋 复制全文
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([article.content], { type: 'text/markdown' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${article.title}.md`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 bg-[#8B4513] text-[#D4AF37] px-4 py-2 rounded-lg hover:bg-[#A0522D] transition-colors text-sm"
                >
                  📥 导出 Markdown
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-[#808080]">输入笔记内容，点击&quot;生成长文&quot;按钮</p>
              <p className="text-xs text-[#666] mt-2">生成的文章将显示在这里</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
