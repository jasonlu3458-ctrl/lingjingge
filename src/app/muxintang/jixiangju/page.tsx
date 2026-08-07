'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MOCK_DATA, MUXINTANG_CATEGORIES as categories, type Product } from '@/lib/muxintang-products';

export default function JixiangjuPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      setProducts(MOCK_DATA);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#8B4513]/30 to-[#0a0a0a]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-serif text-white/90 tracking-wider mb-2">吉祥馆</h1>
            <p className="text-zinc-400 text-sm md:text-base">甄选吉祥好物，滋养心灵家园</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
              }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#8B4513] text-[#D4AF37] border border-[#D4AF37]'
                  : 'bg-[#242424] text-[#C0C0C0] border border-[#333333] hover:border-[#8B4513]'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">📦</p>
            <p className="text-[#808080]">暂无商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
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
                    <button className="text-[#808080] text-xs hover:text-[#D4AF37] transition-colors">
                      查看详情 →
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
