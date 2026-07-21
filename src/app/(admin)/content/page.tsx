'use client';

import ArticleManager from '@/components/admin/ArticleManager';
import StudyPostManager from '@/components/admin/StudyPostManager';

export default function ContentPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          内容管理
        </h1>
      </div>
      
      <ArticleManager />
      <StudyPostManager />
    </div>
  );
}