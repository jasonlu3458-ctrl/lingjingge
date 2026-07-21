'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserRole } from '@/hooks/useUserRole';
import ContentReader from '@/components/ContentReader';

interface EbookDetail {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author?: string;
  categories?: string[];
  free_chapter_count?: number;
  price_per_chapter?: number;
  chapter_index?: number;
  is_paid?: boolean;
}

const mockEbook: EbookDetail = {
  id: '1',
  title: '阿阇梨年度开示录',
  author: '阿阇梨',
  content: `# 阿阇梨年度开示录

## 引言

岁月流转，时节更替。在这个快节奏的时代，我们常常忙碌于琐事，忘记了停下来聆听内心的声音。阿阇梨的开示，如同暗夜中的一盏明灯，照亮我们前行的道路。

## 一、静心之道

静心，是修行的第一步。《大学》云："知止而后有定，定而后能静，静而后能安，安而后能虑，虑而后能得。"在喧嚣的尘世中，保持一颗宁静的心，是何等珍贵。

### 静心的重要性

心若不静，万事皆乱。当我们的心被杂念所扰，便无法做出正确的判断。静心不是逃避现实，而是在纷扰中保持一份清醒。

### 如何静心

- **冥想打坐**：每天抽出一段时间，静坐冥想，专注于呼吸。
- **读经悟道**：阅读经典，从中汲取智慧，净化心灵。
- **观照内心**：时刻觉察自己的念头，不被情绪所左右。

## 二、处世智慧

人生在世，难免遇到种种境遇。无论是顺境还是逆境，都是修行的机会。正如古人所说："静坐常思己过，闲谈莫论人非。"

### 待人之道

待人以诚，处世以宽。在与人交往中，保持谦逊和包容，是一种智慧。

### 处事之道

遇事冷静，三思而后行。不要被一时的冲动所左右，做出后悔的决定。

## 三、生命感悟

生命是一场旅程，每个人都在寻找属于自己的答案。在这个过程中，我们经历欢笑与泪水，收获成长与感悟。

### 珍惜当下

活在当下，珍惜眼前的一切。不要总是期待未来，也不要总是怀念过去。

### 感恩之心

常怀感恩之心，感谢生命中遇到的每一个人和事。

## 结语

愿这些开示能够陪伴你走过人生的每一个阶段。在未来的日子里，愿你保持一颗善良的心，善待自己，善待他人。愿你在传统文化的滋养中，找到内心的宁静与力量。`,
  created_at: '2024-01-15',
  categories: ['开示录'],
  free_chapter_count: 1,
  price_per_chapter: 10.00,
  chapter_index: 1,
  is_paid: true,
};

export default function EbookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [initialArticle, setInitialArticle] = useState<EbookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const userRole = useUserRole();

  useEffect(() => {
    if (!id) return;

    const isMember = userRole === 'member' || userRole === 'admin';
    if (!isMember) {
      router.push('/muxintang/learn/ebooks');
      return;
    }

    fetchEbook(id as string);
  }, [id, userRole, router]);

  const fetchEbook = async (ebookId: string) => {
    setLoading(true);
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setInitialArticle(mockEbook);
        setLoading(false);
        return;
      }

      const res = await fetch(`${supabaseUrl}/rest/v1/muxintang_articles?id=eq.${ebookId}&tenant_id=eq.muxintang&category=eq.ebook`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
      });

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setInitialArticle({
          id: data[0].id,
          title: data[0].title,
          content: data[0].content || '',
          created_at: data[0].created_at,
          author: data[0].author,
          categories: data[0].categories ? JSON.parse(data[0].categories) : [],
          free_chapter_count: data[0].free_chapter_count || 0,
          price_per_chapter: data[0].price_per_chapter || 0,
          chapter_index: data[0].chapter_index || 0,
          is_paid: data[0].is_paid || false,
        });
      } else {
        setInitialArticle(mockEbook);
      }
    } catch {
      setInitialArticle(mockEbook);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!initialArticle) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <p className="text-[#808080]">电子书不存在</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-3xl mx-auto px-4">
        <ContentReader 
          articleId={id as string}
          tenantId="muxintang"
          initialArticle={initialArticle}
        />
        
        <div className="mt-8 flex justify-center gap-4">
          <button
            onClick={() => router.back()}
            className="bg-[#242424] text-[#808080] px-6 py-2 rounded-lg hover:bg-[#333] transition-colors"
          >
            ← 返回列表
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(initialArticle.content)}
            className="bg-[#8B4513] text-[#D4AF37] px-6 py-2 rounded-lg hover:bg-[#A0522D] transition-colors"
          >
            📋 复制全文
          </button>
        </div>
      </div>
    </div>
  );
}
