'use client';

import Link from 'next/link';

const PET_SERVICES = [
  { id: 'naming', name: '爱宠起名', icon: '🐾', desc: '为爱宠赐名，福泽相伴', href: '/pet/naming' },
  { id: 'accessories', name: '吉祥配饰', icon: '�', desc: '佩戴祥瑞，平安喜乐', href: '/pet/accessories' },
  { id: 'diet', name: '衣食住行', icon: '🥣', desc: '照料起居，健康相随', href: '/pet/diet' },
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
            🐾 宠物与风水
          </h2>
          <p className="text-[#5a5a5a] leading-relaxed">
            宠物不仅是家庭的一员，也是风水布局中重要的一环。犬属戌土，猫属寅木，不同生肖的宠物与主人的八字五行相生相克，影响着家庭的运势。
          </p>
          <p className="text-[#5a5a5a] leading-relaxed mt-4">
            阿阇梨提示：选择宠物时，可根据自身八字五行来选择合适的宠物，以达到相生相助的效果。例如，五行缺火的人适合养红色的宠物，五行缺水的人适合养鱼。
          </p>
        </div>
      </div>
    </div>
  );
}
