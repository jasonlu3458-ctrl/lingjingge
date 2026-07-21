export interface Product {
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image: string;
  category: string;
  tags: string[];
  stock: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface MerchantProduct {
  id: string;
  tenant_id: string;
  title: string;
  price: number;
  description: string;
  image_url: string;
  category: string;
  status: string;
  created_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  created_at: string;
  paid_at?: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
}

const MOCK_PRODUCTS: Record<string, Product[]> = {
  main: [
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
  ],
  muxintang: [
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
  ],
};

export async function getProductsByTenant(tenantId: string): Promise<Product[]> {
  try {
    const response = await fetch(`/api/admin/products`, {
      headers: { 'x-tenant-id': tenantId },
    });
    
    if (!response.ok) {
      return MOCK_PRODUCTS[tenantId] || [];
    }
    
    const data = await response.json();
    const merchantProducts = data.products || [];
    
    if (merchantProducts.length === 0) {
      return MOCK_PRODUCTS[tenantId] || [];
    }
    
    return merchantProducts.map((p: MerchantProduct): Product => ({
      id: p.id,
      tenant_id: p.tenant_id,
      name: p.title,
      description: p.description,
      price: p.price,
      image: p.image_url || '',
      category: p.category,
      tags: [],
      stock: 999,
      is_active: p.status === 'active',
      sort_order: 0,
      created_at: p.created_at,
    }));
  } catch {
    return MOCK_PRODUCTS[tenantId] || [];
  }
}

export async function getProductById(tenantId: string, productId: string): Promise<Product | null> {
  const products = MOCK_PRODUCTS[tenantId] || [];
  return products.find((p) => p.id === productId) || null;
}

export async function getProductsByCategory(tenantId: string, category: string): Promise<Product[]> {
  const products = MOCK_PRODUCTS[tenantId] || [];
  return products.filter((p) => p.category === category && p.is_active);
}

export async function createOrder(tenantId: string, userId: string, items: OrderItem[]): Promise<Order> {
  const total_amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const order: Order = {
    id: `ORD-${Date.now()}`,
    tenant_id: tenantId,
    user_id: userId,
    items,
    total_amount,
    status: 'pending',
    created_at: new Date().toISOString(),
  };
  
  return order;
}

export async function getOrdersByUser(tenantId: string, userId: string): Promise<Order[]> {
  return [];
}

export async function getOrderById(tenantId: string, orderId: string): Promise<Order | null> {
  return null;
}

export async function updateOrderStatus(tenantId: string, orderId: string, status: Order['status']): Promise<Order | null> {
  return null;
}

export async function searchProducts(tenantId: string, keyword: string): Promise<Product[]> {
  const products = MOCK_PRODUCTS[tenantId] || [];
  const lowerKeyword = keyword.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(lowerKeyword) ||
      p.description.toLowerCase().includes(lowerKeyword) ||
      p.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword))
  );
}

export async function getCategories(tenantId: string): Promise<string[]> {
  const products = MOCK_PRODUCTS[tenantId] || [];
  const categories = new Set(products.map((p) => p.category));
  return Array.from(categories);
}