'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getProductsByTenant, type Product } from '@/lib/merchant-engine';

const categoryMap: Record<string, string> = {
  'ebook': '电子书',
  'image': '图片',
  'fengshui': '风水物',
  'fawu': '法物',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const products = await getProductsByTenant('main');
      const found = products.find(p => p.id === productId);
      setProduct(found || null);
    } catch (error) {
      console.error('Failed to fetch product:', error);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: Product) => item.id === productId);
    
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + quantity;
    } else {
      cart.push({ ...product, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('已加入购物车');
  };

  const handleBuyNow = () => {
    if (!product) return;
    
    const cart = [{ ...product, quantity }];
    localStorage.setItem('cart', JSON.stringify(cart));
    router.push('/jixiangju/checkout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">❌</p>
          <p className="text-[#808080]">商品不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2">
            <div className="relative aspect-square bg-[#242424] rounded-xl overflow-hidden">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl opacity-30">📦</span>
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-1/2">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-[#8B4513]/30 text-[#D4AF37] text-sm rounded-full">
                {categoryMap[product.category] || product.category}
              </span>
              <span className={`px-3 py-1 text-sm rounded-full ${
                product.is_active 
                  ? 'bg-green-900/30 text-green-400' 
                  : 'bg-gray-900/30 text-gray-400'
              }`}>
                {product.is_active ? '在售' : '下架'}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-[#C0C0C0] mb-4" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              {product.name}
            </h1>

            <div className="text-4xl font-bold text-[#D4AF37] mb-6">
              ¥{product.price}
            </div>

            <div className="mb-6">
              <h3 className="text-[#C0C0C0] font-medium mb-2">商品描述</h3>
              <p className="text-[#808080] leading-relaxed whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-[#C0C0C0] font-medium mb-3">数量</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-[#242424] border border-[#333333] rounded-lg text-[#C0C0C0] hover:border-[#D4AF37] transition-colors"
                >
                  -
                </button>
                <span className="text-xl text-[#C0C0C0] w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 bg-[#242424] border border-[#333333] rounded-lg text-[#C0C0C0] hover:border-[#D4AF37] transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!product.is_active}
                className="flex-1 bg-[#8B4513] text-[#D4AF37] py-4 rounded-lg font-medium hover:bg-[#A0522D] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🛒 加入购物车
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!product.is_active}
                className="flex-1 bg-[#D4AF37] text-[#1a1a1a] py-4 rounded-lg font-medium hover:bg-[#E5C142] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⚡ 立即购买
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
