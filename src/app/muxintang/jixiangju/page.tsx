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

const MOCK_DATA: Product[] = [
  {
    id: 'prod-muxin-001',
    tenant_id: 'muxintang',
    name: '开光五帝钱 · 旺财化煞',
    description: '精选古法仿制五帝铜钱，牧心堂阿阇梨净手加持，挂于门楣，旺家运、挡煞气。',
    price: 168.00,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20five%20emperor%20coins%20fengshui%20amulet%20red%20string%20traditional&image_size=portrait_4_3',
    category: '牧心吉品',
    tags: ['五帝钱', '旺财', '化煞'],
    stock: 100,
    is_active: true,
    sort_order: 1,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-muxin-002',
    tenant_id: 'muxintang',
    name: '手工编绳 · 平安护身符',
    description: '红绳搭配金刚结，内含阿阇梨手写祈福纸卷，贴身佩戴，祈愿平安。',
    price: 88.00,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Handmade%20red%20string%20amulet%20bracelet%20Chinese%20lucky%20charm%20protection&image_size=portrait_4_3',
    category: '牧心吉品',
    tags: ['红绳', '护身符', '平安'],
    stock: 150,
    is_active: true,
    sort_order: 2,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-muxin-003',
    tenant_id: 'muxintang',
    name: '檀木法器 · 六字真言手串',
    description: '老山檀香木串，每颗珠子皆刻有六字真言，持之清净，安神定心。',
    price: 128.00,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sandalwood%20bead%20bracelet%20six%20word%20mantra%20carved%20Tibetan%20style&image_size=portrait_4_3',
    category: '牧心吉品',
    tags: ['檀木', '六字真言', '手串'],
    stock: 50,
    is_active: true,
    sort_order: 3,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-muxin-004',
    tenant_id: 'muxintang',
    name: '宠物福缘铃铛挂饰',
    description: '铜制小铃铛，音色清脆，挂于爱宠颈间，灵兽相伴，福缘自来。',
    price: 49.00,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Pet%20bell%20charm%20copper%20traditional%20Chinese%20style%20cute%20design&image_size=portrait_4_3',
    category: '爱宠配饰',
    tags: ['宠物', '铃铛', '福缘'],
    stock: 200,
    is_active: true,
    sort_order: 4,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-muxin-005',
    tenant_id: 'muxintang',
    name: '爱宠平安项圈',
    description: '手工编织项圈，内置微缩祈福经文，愿爱宠无病无灾，安康快乐。',
    price: 88.00,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Handmade%20pet%20collar%20with%20blessing%20scripture%20peaceful%20design&image_size=portrait_4_3',
    category: '爱宠配饰',
    tags: ['宠物', '项圈', '平安'],
    stock: 100,
    is_active: true,
    sort_order: 5,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-muxin-006',
    tenant_id: 'muxintang',
    name: '数字开光符 · 电子壁纸',
    description: '牧心堂专属AI生成符箓壁纸，带有阿阇梨加持能量，可下载至手机屏保，护持正念。',
    price: 19.90,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Digital%20talisman%20wallpaper%20Chinese%20traditional%20fu%20symbol%20AI%20art&image_size=portrait_4_3',
    category: '数字法物',
    tags: ['数字符', '壁纸', '加持'],
    stock: -1,
    is_active: true,
    sort_order: 6,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-muxin-007',
    tenant_id: 'muxintang',
    name: '静心梵音 · 白噪音疗愈音频',
    description: '阿阇梨诵念的舒缓白噪音音频，适合日常静心、睡眠辅助。',
    price: 39.90,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Meditation%20sound%20healing%20audio%20cover%20zen%20peaceful%20minimalist&image_size=portrait_4_3',
    category: '数字法物',
    tags: ['梵音', '白噪音', '疗愈'],
    stock: -1,
    is_active: true,
    sort_order: 7,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-muxin-008',
    tenant_id: 'muxintang',
    name: '《牧心堂随笔》电子版',
    description: '任书颖阿阇梨日常修行随笔集，涵盖唐密实修、风水感悟。',
    price: 29.90,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Chinese%20spiritual%20essay%20book%20cover%20traditional%20style%20elegant&image_size=portrait_4_3',
    category: '密法读物',
    tags: ['随笔', '唐密', '修行'],
    stock: -1,
    is_active: true,
    sort_order: 8,
    created_at: '2026-07-21T00:00:00Z',
  },
  {
    id: 'prod-muxin-009',
    tenant_id: 'muxintang',
    name: '唐密心经 · 简体注音本',
    description: '《般若波罗蜜多心经》简体注音与白话解读，适合初入唐密者阅读。',
    price: 19.90,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Heart%20Sutra%20book%20cover%20Buddhist%20scripture%20Chinese%20traditional&image_size=portrait_4_3',
    category: '密法读物',
    tags: ['心经', '注音', '唐密'],
    stock: -1,
    is_active: true,
    sort_order: 9,
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
