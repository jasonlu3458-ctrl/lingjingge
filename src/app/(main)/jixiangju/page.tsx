'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getProductsByTenant, type Product } from '@/lib/merchant-engine';

const categories = [
  { id: 'all', name: '全部' },
  { id: '牧心吉品', name: '牧心吉品' },
  { id: '爱宠配饰', name: '爱宠配饰' },
  { id: '数字法物', name: '数字法物' },
  { id: '密法读物', name: '密法读物' },
];

const categoryMap: Record<string, string> = {
  '牧心吉品': '牧心吉品',
  '爱宠配饰': '爱宠配饰',
  '数字法物': '数字法物',
  '密法读物': '密法读物',
};

const MOCK_DATA: Product[] = [
  {
    id: 'prod-main-001',
    tenant_id: 'main',
    name: '灵境阁 · 五行养生茶礼盒',
    description: '根据五行理论调配的养生茶，适合日常调养，居家自用或送礼皆为佳品。',
    price: 198.00,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20traditional%20tea%20gift%20box%20with%20five%20elements%20design%20elegant%20packaging&image_size=portrait_4_3',
    category: '牧心吉品',
    tags: ['养生', '五行', '礼品'],
    stock: 50,
    is_active: true,
    sort_order: 1,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-main-002',
    tenant_id: 'main',
    name: '黄铜瑞兽香炉',
    description: '精铜铸造的瑞兽香炉，打坐时点一炷香，气息沉稳，心神合一。',
    price: 268.00,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20brass%20auspicious%20beast%20incense%20burner%20traditional%20style%20elegant&image_size=portrait_4_3',
    category: '牧心吉品',
    tags: ['香炉', '瑞兽', '禅修'],
    stock: 30,
    is_active: true,
    sort_order: 2,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-main-003',
    tenant_id: 'main',
    name: '手工编制 · 天珠配饰',
    description: '精选天珠搭配手工编织绳，可系于包上或车中，寓意平安吉祥。',
    price: 68.00,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Tibetan%20 dzi%20bead%20accessory%20handmade%20braided%20cord%20lucky%20charm&image_size=portrait_4_3',
    category: '爱宠配饰',
    tags: ['天珠', '配饰', '平安'],
    stock: 100,
    is_active: true,
    sort_order: 3,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-main-004',
    tenant_id: 'main',
    name: '爱宠仿真玉坠项圈',
    description: '仿白玉材质平安扣项圈，适合小型犬猫，温润可爱。',
    price: 59.00,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Pet%20collar%20with%20jade%20pendant%20white%20jade%20style%20cute%20dog%20cat&image_size=portrait_4_3',
    category: '爱宠配饰',
    tags: ['宠物', '玉坠', '平安'],
    stock: 80,
    is_active: true,
    sort_order: 4,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-main-005',
    tenant_id: 'main',
    name: 'AI 禅意壁纸 · 黑金曼荼罗',
    description: '由灵境阁AI生成的极简黑金曼荼罗壁纸，适用于电脑或手机背景。',
    price: 9.90,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Black%20gold%20mandala%20wallpaper%20minimalist%20zen%20style%20AI%20generated&image_size=portrait_4_3',
    category: '数字法物',
    tags: ['壁纸', '曼荼罗', '禅意'],
    stock: -1,
    is_active: true,
    sort_order: 5,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-main-006',
    tenant_id: 'main',
    name: '《道德经》AI 朗读版',
    description: '由灵境尊者配音的《道德经》全文朗读音频，沉浸式聆听。',
    price: 19.90,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Tao%20Te%20Ching%20audio%20book%20cover%20Chinese%20philosophy%20minimalist%20design&image_size=portrait_4_3',
    category: '数字法物',
    tags: ['道德经', '音频', '朗读'],
    stock: -1,
    is_active: true,
    sort_order: 6,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-main-007',
    tenant_id: 'main',
    name: '《周易》白话译注本',
    description: '周易原文对照现代白话翻译，适合爱好玄学文化的初学者。',
    price: 19.90,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=I%20Ching%20book%20cover%20Chinese%20classic%20philosophy%20ancient%20style&image_size=portrait_4_3',
    category: '密法读物',
    tags: ['周易', '译注', '玄学'],
    stock: -1,
    is_active: true,
    sort_order: 7,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-main-008',
    tenant_id: 'main',
    name: '《金刚经》硬笔抄经本',
    description: '硬笔抄经本，内含《金刚经》全文，方便日常抄写静心。',
    price: 12.90,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Diamond%20Sutra%20copybook%20Chinese%20calligraphy%20practice%20book%20minimalist&image_size=portrait_4_3',
    category: '密法读物',
    tags: ['金刚经', '抄经', '静心'],
    stock: 200,
    is_active: true,
    sort_order: 8,
    created_at: '2026-07-21T00:00:00Z',
  },
];

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
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="relative h-64 md:h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#8B4513]/30 to-[#1a1a1a]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-serif text-gray-800 tracking-widest mb-2">吉祥馆</h1>
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
                href={`/jixiangju/${product.id}`}
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
                  <p className="text-sm text-[#808080] mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-[#D4AF37]">¥{product.price}</span>
                    <span className="text-xs text-[#808080]">{categoryMap[product.category] || product.category}</span>
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
