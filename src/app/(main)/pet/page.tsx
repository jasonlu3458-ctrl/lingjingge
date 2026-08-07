'use client';

import Link from 'next/link';

const PET_SERVICES = [
  { id: 'naming', name: '爱宠起名', icon: '🐾', desc: '为爱宠赐名，福泽相伴', href: '/pet/naming' },
  { id: 'accessories', name: '吉祥配饰', icon: '💎', desc: '佩戴祥瑞，平安喜乐', href: '/jixiangju?category=爱宠配饰' },
  { id: 'daily-care', name: '衣食住行', icon: '🥣', desc: '照料起居，健康相随', href: '/pet/daily-care' },
  { id: 'liberation', name: '爱宠超度', icon: '🕊️', desc: '超度导引，慈悲为怀', href: '/pet/liberation' },
];

export default function PetPage() {
  return (
    <div className="min-h-screen bg-zen-beige py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 
            className="text-3xl font-bold mb-4 text-[#2c2c2c]"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            爱宠屋
          </h1>
          <p className="text-[#7a7a7a]">为您的爱宠带来吉祥与祝福</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {PET_SERVICES.map((service) => (
            <Link 
              key={service.id} 
              href={service.href}
              className="bg-white rounded-xl p-6 text-center hover:shadow-lg transition-all hover:-translate-y-1 border border-[#e8e0d0]"
            >
              <span className="text-4xl mb-4 block">{service.icon}</span>
              <h3 
                className="text-lg font-semibold mb-2 text-[#2c2c2c]"
                style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
              >
                {service.name}
              </h3>
              <p className="text-sm text-[#7a7a7a]">{service.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-xl p-8 border border-[#e8e0d0]">
          <h2 
            className="text-xl font-semibold mb-4 text-[#2c2c2c]"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            🐾 宠物与空间能量
          </h2>
          <p className="text-[#5a5a5a] leading-relaxed">
            宠物不仅是家庭的一员，也是空间布局中重要的一环。犬主守护，猫主灵动，不同性格的宠物与主人的能量场相互影响，营造出家宅的氛围。
          </p>
          <p className="text-[#5a5a5a] leading-relaxed mt-4">
            牧心堂提示：选择宠物时，可以根据自家空间大小、成员作息与宠物的天性来综合考量。例如，喜欢静谧可养金鱼，渴望陪伴可养猫犬。
          </p>
        </div>
      </div>
    </div>
  );
}
