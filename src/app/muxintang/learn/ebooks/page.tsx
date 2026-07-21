'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';

interface Ebook {
  id: string;
  title: string;
  preview: string;
  created_at: string;
  is_paid: boolean;
}

const mockEbooks: Ebook[] = [
  {
    id: '1',
    title: '阿阇梨年度开示录',
    preview: '岁月流转，时节更替。在这个快节奏的时代，我们常常忙碌于琐事，忘记了停下来聆听内心的声音...',
    created_at: '2024-01-15',
    is_paid: true,
  },
  {
    id: '2',
    title: '命理智慧与人生感悟',
    preview: '命由天定，运在人为。读懂八字密码，掌握人生航向...',
    created_at: '2024-01-10',
    is_paid: true,
  },
];

export default function EbooksPage() {
  const [ebooks, setEbooks] = useState<Ebook[]>(mockEbooks);
  const [loading, setLoading] = useState(true);
  const userRole = useUserRole();
  const isMember = userRole === 'member' || userRole === 'admin';

  useEffect(() => {
    fetchEbooks();
  }, []);

  const fetchEbooks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ebooks?tenant_id=muxintang');
      const data = await res.json();
      if (data.ebooks && data.ebooks.length > 0) {
        setEbooks(data.ebooks);
      }
    } catch {
      // use mock data
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            📚 会员专属电子书
          </h1>
          <p className="text-[#808080]">由阿阇梨根据多年修行心得整理而成的珍贵内容</p>
        </div>

        {!isMember && (
          <div className="bg-[#1a1a1a] rounded-lg p-8 border border-[#333333] text-center mb-8">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-semibold text-[#D4AF37] mb-2">开通会员即可阅读</h3>
            <p className="text-[#808080] mb-6">成为会员后，您将解锁所有电子书内容</p>
            <Link 
              href="/muxintang/pricing"
              className="bg-[#8B4513] text-[#D4AF37] px-8 py-3 rounded-lg hover:bg-[#A0522D] transition-colors"
            >
              查看会员方案
            </Link>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#808080] mt-4">加载中...</p>
          </div>
        ) : ebooks.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📖</div>
            <p className="text-[#808080]">暂无电子书内容</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ebooks.map((ebook) => (
              <div 
                key={ebook.id}
                className="muxintang-card p-6 hover:border-[#D4AF37] transition-all"
              >
                <div className="text-4xl mb-4">📕</div>
                <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2">{ebook.title}</h3>
                <p className="text-sm text-[#808080] mb-4 line-clamp-3">{ebook.preview}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#666]">{new Date(ebook.created_at).toLocaleDateString()}</span>
                  {isMember ? (
                    <Link 
                      href={`/muxintang/learn/ebook/${ebook.id}`}
                      className="bg-[#8B4513] text-[#D4AF37] px-4 py-2 rounded-lg hover:bg-[#A0522D] transition-colors text-sm"
                    >
                      阅读全文
                    </Link>
                  ) : (
                    <span className="text-xs text-[#808080]">会员专享</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
