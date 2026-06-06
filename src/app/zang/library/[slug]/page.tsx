'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  author: string;
  published_at: string;
}

interface ReadingLevel {
  level: number;
  title: string;
  content: string;
}

export default function ArticleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 分层阅读状态
  const [readingLevel, setReadingLevel] = useState(1); // 1: 摘要, 2: 详细内容, 3: 背景和评论
  const [expandedContent, setExpandedContent] = useState<ReadingLevel[]>([]);
  const [expanding, setExpanding] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('articles')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .single();

        if (fetchError) {
          setError(`加载失败: ${fetchError.message}`);
        } else {
          const articleData = data as unknown as Article;
          setArticle(articleData);
          // 初始化第一层：摘要和核心观点
          setExpandedContent([
            {
              level: 1,
              title: '摘要与核心观点',
              content: articleData.summary || '暂无摘要'
            }
          ]);
        }
      } catch (err) {
        setError(`获取文章异常: ${err instanceof Error ? err.message : '未知错误'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  // 深入阅读
  const handleDeepRead = async (targetLevel: number) => {
    if (!article) return;
    setExpanding(true);

    try {
      const apiKey = process.env.NEXT_PUBLIC_SILICON_API_KEY;

      if (!apiKey) {
        throw new Error('API Key 未配置');
      }

      let prompt = '';
      let levelTitle = '';

      if (targetLevel === 2) {
        levelTitle = '详细内容';
        prompt = `请将以下文章内容进行详细展开，保持原文风格，补充细节和解释，使内容更加丰富完整（约300-500字）：

标题：${article.title}
摘要：${article.summary}
原文：${article.content.slice(0, 500)}

请直接输出展开后的内容，不要添加标题。`;
      } else if (targetLevel === 3) {
        levelTitle = '背景与评论';
        prompt = `请为以下文章提供背景介绍和深度评论：

标题：${article.title}
内容：${article.content.slice(0, 500)}

请包含：
1. 文章背景（历史背景、文化背景等）
2. 深度评论（核心思想、现实意义、启示等）
3. 相关延伸（可以参考的经典、书籍等）

请直接输出内容，不要添加标题。`;
      }

      const response = await fetch('https://api.siliconflow.cn/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'Pro/deepseek-ai/DeepSeek-V3',
          messages: [
            {
              role: 'system',
              content: '你是一位精通传统文化和哲学的学者，擅长深入解读文章内涵，提供背景分析和评论。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`请求失败: ${response.status}`);
      }

      const data = await response.json();
      const expandedText = data?.choices?.[0]?.message?.content || '内容生成失败';

      setExpandedContent(prev => [
        ...prev,
        {
          level: targetLevel,
          title: levelTitle,
          content: expandedText
        }
      ]);
      setReadingLevel(targetLevel);
    } catch (err) {
      console.error('深入阅读失败:', err);
      setError(`深入阅读失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setExpanding(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f0eb', padding: '40px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#5a5a5a' }}>加载中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f0eb', padding: '40px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <Link href="/zang/library" style={{ display: 'inline-block', marginBottom: '24px', color: '#5a5a5a', textDecoration: 'none' }}>
            ← 返回文章列表
          </Link>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e8e4e0' }}>
            <h3 style={{ color: '#dc2626', marginBottom: '12px' }}>加载失败</h3>
            <p style={{ color: '#5a5a5a', fontSize: '14px' }}>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f0eb', padding: '40px 20px' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '18px', color: '#5a5a5a' }}>文章不存在</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0eb', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Link href="/zang/library" style={{ display: 'inline-block', marginBottom: '24px', color: '#5a5a5a', textDecoration: 'none', fontSize: '14px' }}>
          ← 返回文章列表
        </Link>

        {/* 文章标题 */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid #e8e4e0', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', color: '#2c2c2c', marginBottom: '16px', fontFamily: '"Ma Shan Zheng", serif' }}>{article.title}</h1>
          <div style={{ fontSize: '12px', color: '#888888', display: 'flex', gap: '16px' }}>
            <span>作者：{article.author}</span>
            <span>发布时间：{new Date(article.published_at).toLocaleDateString('zh-CN')}</span>
          </div>
        </div>

        {/* 分层阅读进度 */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e8e4e0', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginBottom: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: readingLevel >= 1 ? '#2c2c2c' : '#e8e4e0',
                color: readingLevel >= 1 ? '#f5f0eb' : '#888888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px'
              }}>1</div>
              <div style={{ fontSize: '12px', color: readingLevel >= 1 ? '#2c2c2c' : '#888888' }}>摘要</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: readingLevel >= 2 ? '#2c2c2c' : '#e8e4e0',
                color: readingLevel >= 2 ? '#f5f0eb' : '#888888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px'
              }}>2</div>
              <div style={{ fontSize: '12px', color: readingLevel >= 2 ? '#2c2c2c' : '#888888' }}>详细内容</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: readingLevel >= 3 ? '#2c2c2c' : '#e8e4e0',
                color: readingLevel >= 3 ? '#f5f0eb' : '#888888',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 8px'
              }}>3</div>
              <div style={{ fontSize: '12px', color: readingLevel >= 3 ? '#2c2c2c' : '#888888' }}>背景评论</div>
            </div>
          </div>
          <div style={{ fontSize: '14px', color: '#5a5a5a', textAlign: 'center' }}>
            当前阅读深度：第 {readingLevel} 层
          </div>
        </div>

        {/* 分层内容展示 */}
        {expandedContent.map((level) => (
          <div key={level.level} style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid #e8e4e0', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', color: '#2c2c2c', marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <span style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#2c2c2c',
                color: '#f5f0eb',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: '12px',
                fontSize: '12px'
              }}>{level.level}</span>
              {level.title}
            </h3>
            <div style={{
              fontSize: '15px',
              color: '#2c2c2c',
              lineHeight: '1.8',
              whiteSpace: 'pre-wrap'
            }}>
              {level.content}
            </div>
          </div>
        ))}

        {/* 深入阅读按钮 */}
        {readingLevel < 3 && (
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <button
              onClick={() => handleDeepRead(readingLevel + 1)}
              disabled={expanding}
              style={{
                padding: '14px 32px',
                background: '#2c2c2c',
                color: '#f5f0eb',
                borderRadius: '30px',
                border: 'none',
                fontSize: '16px',
                cursor: 'pointer',
                opacity: expanding ? 0.6 : 1
              }}
            >
              {expanding ? 'AI 正在展开...' : readingLevel === 1 ? '深入阅读 →' : '再深入 →'}
            </button>
            <div style={{ fontSize: '12px', color: '#888888', marginTop: '8px' }}>
              {readingLevel === 1 && '点击查看文章详细内容'}
              {readingLevel === 2 && '点击查看背景介绍和深度评论'}
            </div>
          </div>
        )}

        {/* 完成提示 */}
        {readingLevel === 3 && (
          <div style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', border: '1px solid #e8e4e0', marginBottom: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', color: '#2c2c2c', marginBottom: '8px' }}>🌿 阅读完成</div>
            <div style={{ fontSize: '14px', color: '#5a5a5a' }}>您已完成三层深度阅读</div>
          </div>
        )}

        {/* 快速阅读原文 */}
        <div style={{ background: '#ffffff', borderRadius: '16px', padding: '32px', border: '1px solid #e8e4e0' }}>
          <h3 style={{ fontSize: '18px', color: '#2c2c2c', marginBottom: '16px' }}>原文阅读</h3>
          <div style={{
            fontSize: '15px',
            color: '#2c2c2c',
            lineHeight: '1.8',
            whiteSpace: 'pre-wrap'
          }}>
            {article.content}
          </div>
        </div>

        <Link href="/zang/library" style={{ display: 'inline-block', marginTop: '24px', color: '#5a5a5a', textDecoration: 'none', fontSize: '14px' }}>
          ← 返回文章列表
        </Link>
      </div>
    </div>
  );
}