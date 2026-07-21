'use client';

import { useState, useEffect } from 'react';
import { getProductsByTenant, type Product } from '@/lib/merchant-engine';

interface ProductListProps {
  tenantId: string;
  onAddToCart?: (product: Product) => void;
}

export default function ProductList({ tenantId, onAddToCart }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const data = await getProductsByTenant(tenantId);
        setProducts(data);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [tenantId]);

  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter((p) => p.category === selectedCategory);

  const handleAddToCart = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product);
    } else {
      console.log('Add to cart:', product);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#808080]">暂无商品</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              selectedCategory === cat
                ? 'bg-[#8B4513] text-[#D4AF37]'
                : 'bg-[#242424] text-[#808080] hover:bg-[#333333]'
            }`}
          >
            {cat === 'all' ? '全部' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="muxintang-card overflow-hidden hover:border-[#D4AF37] transition-all"
          >
            <div className="relative aspect-square overflow-hidden bg-[#1a1a1a]">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#444]">
                  <span className="text-4xl">📦</span>
                </div>
              )}
              {product.original_price && (
                <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                  优惠
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-white font-medium mb-2 line-clamp-1">{product.name}</h3>
              <p className="text-sm text-[#808080] mb-3 line-clamp-2">{product.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {product.tags.slice(0, 3).map((tag) => (
                  <span 
                    key={tag}
                    className="text-xs text-[#D4AF37] bg-[#8B4513]/30 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-bold text-[#D4AF37]">¥{product.price}</span>
                  {product.original_price && (
                    <span className="text-sm text-[#555555] line-through ml-2">
                      ¥{product.original_price}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleAddToCart(product)}
                  className="bg-[#8B4513] text-[#D4AF37] px-4 py-2 rounded-lg hover:bg-[#A0522D] transition-colors text-sm"
                >
                  请奉
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}