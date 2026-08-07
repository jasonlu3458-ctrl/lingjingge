'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MOCK_DATA, type Product } from '@/lib/muxintang-products';

// 仅展示「爱宠配饰」分类商品，与主站 /jixiangju?category=爱宠配饰 行为一致
const ACCESSORY_PRODUCTS = MOCK_DATA.filter((p) => p.category === '爱宠配饰');

export default function PetAccessoriesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* —— 页头 —— */}
        <div className="text-center mb-12">
          <h1
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif", color: '#D4AF37' }}
          >
            吉祥配饰
          </h1>
          <p className="text-[#808080]">为爱宠佩戴祥瑞，平安喜乐常相伴</p>
        </div>

        {/* —— 商品网格 —— */}
        {ACCESSORY_PRODUCTS.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📦</p>
            <p className="text-[#808080]">暂无商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {ACCESSORY_PRODUCTS.map((product: Product) => (
              <Link
                key={product.id}
                href={`/muxintang/jixiangju/${product.id}`}
                className="group bg-[#242424] rounded-xl overflow-hidden border border-[#333333] hover:border-[#D4AF37] transition-all"
              >
                <div className="relative aspect-square bg-[#1a1a1a] overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-5xl opacity-30">📦</span>
                    </div>
                  )}
                  {product.is_active && (
                    <span className="absolute top-2 right-2 bg-[#8B4513] text-[#D4AF37] text-xs px-2 py-1 rounded-full">
                      在售
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-[#C0C0C0] font-medium mb-2 line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[#606060] text-xs mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[#D4AF37] font-bold">
                      ¥{product.price.toFixed(2)}
                    </span>
                    <span className="text-[#808080] text-xs group-hover:text-[#D4AF37] transition-colors">
                      查看详情 →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* —— 前往吉祥馆入口 —— */}
        <div className="mt-12 text-center">
          <Link
            href="/muxintang/jixiangju"
            className="inline-block px-8 py-3 rounded-full border border-[#8B4513] text-[#D4AF37] hover:bg-[#242424] transition-all"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            前往吉祥馆查看全部好物 →
          </Link>
        </div>
      </div>
    </div>
  );
}
