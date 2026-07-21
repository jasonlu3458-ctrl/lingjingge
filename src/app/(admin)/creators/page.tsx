'use client';

import CreatorAIConfig from '@/components/admin/CreatorAIConfig';

export default function CreatorsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          创作者（阿阇梨）管理
        </h1>
      </div>
      
      <CreatorAIConfig />
    </div>
  );
}