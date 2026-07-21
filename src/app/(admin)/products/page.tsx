'use client';

import ProductManager from '@/components/admin/ProductManager';

export default function ProductsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#D4AF37]" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          商品管理
        </h1>
      </div>
      
      <ProductManager />
    </div>
  );
}