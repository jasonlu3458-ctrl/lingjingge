'use client';
/* eslint-disable react/no-unescaped-entities */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AvatarPlaceholder } from '@/components/AvatarPlaceholder';
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/Animations';

interface Master {
  id: string;
  name: string;
  era: string;
  quote: string;
  image: string;
  bio: string;
}

interface Lineage {
  name: string;
  description: string;
  masters: Master[];
}

const lineages: Record<string, Lineage> = {
  zen: {
    name: '禅宗法脉',
    description: '从佛陀拈花到临济棒喝，千年智慧一脉相承',
    masters: [
      {
        id: 'buddha',
        name: '释迦牟尼佛',
        era: '公元前563-483年',
        quote: '拈花一笑，教外别传',
        image: '/images/lineage/buddha.png',
        bio: '古印度迦毗罗卫国太子，29岁出家，35岁悟道，创立佛教，讲法49年，开启了智慧的传承。'
      },
      {
        id: 'bodhidharma',
        name: '达摩祖师',
        era: '公元528年',
        quote: '东渡传法，开启禅宗',
        image: '/images/lineage/bodhidharma.png',
        bio: '南天竺香至王第三子，于南朝梁时来华，在少林寺面壁九年，创立禅宗，传法慧可。'
      },
      {
        id: 'huineng',
        name: '六祖慧能',
        era: '公元638-713年',
        quote: '顿悟法门，著《坛经》',
        image: '/images/lineage/huineng.png',
        bio: '广东新州人，以"菩提本无树"偈子得五祖弘忍衣钵，开创南宗顿悟法门，使禅宗大兴于中国。'
      },
      {
        id: 'linji',
        name: '临济义玄',
        era: '公元？-867年',
        quote: '创立临济宗，棒喝接人',
        image: '/images/lineage/linji.png',
        bio: '唐代高僧，创立临济宗，以棒喝方式接引学人，机锋峻烈，是中国禅宗最盛的宗派之一。'
      },
      {
        id: 'xuyun',
        name: '虚云老和尚',
        era: '公元1840-1959年',
        quote: '中兴禅宗，传承法脉',
        image: '/images/lineage/xuyun.png',
        bio: '中国近代禅宗泰斗，一身兼挑五宗法脉，重兴祖师道场，为禅宗传承做出巨大贡献。'
      },
    ]
  },
  yijing: {
    name: '易学法脉',
    description: '从伏羲画卦到孔子作传，天地之道一以贯之',
    masters: [
      {
        id: 'fuxi',
        name: '伏羲氏',
        era: '上古',
        quote: '创八卦，开易学之源',
        image: '/images/lineage/fuxi.png',
        bio: '中国古圣先王，画八卦，结网罟，教民渔猎，开启了易学的源头。'
      },
      {
        id: 'wenwang',
        name: '周文王',
        era: '商末',
        quote: '演六十四卦，作卦辞',
        image: '/images/lineage/wenwang.png',
        bio: '商末周族领袖，被纣王囚禁于羑里时，将八卦演绎为六十四卦，为《周易》奠定基础。'
      },
      {
        id: 'confucius',
        name: '孔子',
        era: '公元前551-479年',
        quote: '作《十翼》，传易学',
        image: '/images/lineage/confucius.png',
        bio: '春秋时期伟大的思想家和教育家，晚年整理《周易》，作《十翼》，使易学得以发扬光大。'
      },
      {
        id: 'wangbi',
        name: '王弼',
        era: '公元226-249年',
        quote: '注《周易》，开玄学',
        image: '/images/lineage/wangbi.png',
        bio: '曹魏时期玄学家，少年天才，以道家思想解《易》，得意忘象，开魏晋玄学之风。'
      },
      {
        id: 'shaoyong',
        name: '邵雍',
        era: '公元1011-1077年',
        quote: '创先天易学，影响深远',
        image: '/images/lineage/shaoyong.png',
        bio: '北宋理学大家，创先天象数之学，著《皇极经世》，对宋明理学影响深远。'
      },
    ]
  },
  dao: {
    name: '道家法脉',
    description: '从老子出关到庄子逍遥，道法自然一脉相承',
    masters: [
      {
        id: 'laozi',
        name: '老子',
        era: '春秋',
        quote: '著《道德经》，开道家之宗',
        image: '/images/lineage/laozi.png',
        bio: '春秋末期思想家，周王室守藏室之史，后西出函谷关，留下《道德经》五千言，为道家始祖。'
      },
      {
        id: 'zhuangzi',
        name: '庄子',
        era: '战国',
        quote: '著《庄子》，逍遥自在',
        image: '/images/lineage/zhuangzi.png',
        bio: '战国时期道家代表人物，作《庄子》，以寓言故事表达道的深邃，追求精神自由。'
      },
      {
        id: 'zhangdaoling',
        name: '张道陵',
        era: '东汉',
        quote: '创立天师道，传承道家',
        image: '/images/lineage/zhangdaoling.png',
        bio: '东汉道教创始人，在四川鹤鸣山创立天师道，尊老子为道祖，使道家有了组织形式。'
      },
      {
        id: 'wangchongyang',
        name: '王重阳',
        era: '金代',
        quote: '创立全真教，三教合一',
        image: '/images/lineage/wangchongyang.png',
        bio: '金代全真道创始人，主张儒释道三教合一，以"清静无为"为宗旨，使道教面貌一新。'
      },
      {
        id: 'sanfeng',
        name: '张三丰',
        era: '明初',
        quote: '创立武当道，内外兼修',
        image: '/images/lineage/sanfeng.png',
        bio: '明初道教宗师，创立武当道，将内丹与武术结合，成为武当派祖师，影响深远。'
      },
    ]
  },
};

export default function LineagePage() {
  const [selectedLineage, setSelectedLineage] = useState<'zen' | 'yijing' | 'dao'>('zen');
  const [selectedMaster, setSelectedMaster] = useState<any>(null);

  const current = lineages[selectedLineage];

  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-serif text-[#2c2c2c] mb-4 text-center" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
          法脉源流
        </h1>
        <p className="text-center text-gray-600 mb-8">千年智慧，一脉相承</p>

        {/* 法脉切换标签 */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setSelectedLineage('zen')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
              selectedLineage === 'zen' ? 'bg-[#2c2c2c] text-white' : 'bg-white text-[#2c2c2c] hover:bg-gray-100'
            }`}
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            禅宗法脉
          </button>
          <button
            onClick={() => setSelectedLineage('yijing')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
              selectedLineage === 'yijing' ? 'bg-[#2c2c2c] text-white' : 'bg-white text-[#2c2c2c] hover:bg-gray-100'
            }`}
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            易学法脉
          </button>
          <button
            onClick={() => setSelectedLineage('dao')}
            className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
              selectedLineage === 'dao' ? 'bg-[#2c2c2c] text-white' : 'bg-white text-[#2c2c2c] hover:bg-gray-100'
            }`}
            style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
          >
            道家法脉
          </button>
        </div>

        {/* 法脉详情 */}
        <div className="bg-white/80 rounded-xl p-6 shadow-sm backdrop-blur-sm">
          <FadeIn>
            <h2 className="text-2xl font-serif mb-4 text-center" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
              {current.name}
            </h2>
            <p className="text-center text-gray-600 mb-8">{current.description}</p>
          </FadeIn>

          {/* 卷轴式列表 */}
          <div className="relative">
            {/* 装饰性墨线 */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-300/50 to-transparent -ml-px" />

            <StaggerContainer>
              <div className="space-y-8">
                {current.masters.map((master, idx) => (
                  <StaggerItem key={idx}>
                    <div className="relative">
                      <motion.div
                        className="relative z-10 flex flex-col md:flex-row items-center gap-6 p-6 bg-white/90 rounded-xl shadow-sm hover:shadow-md cursor-pointer group transition-all"
                        onClick={() => setSelectedMaster(master)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {/* 左侧：画像 */}
                        <AvatarPlaceholder name={master.name} size={128} image={master.image} />

                        {/* 中间：核心信息 */}
                        <div className="flex-1 text-center md:text-left">
                          <h3 className="text-xl font-serif font-bold mb-1" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                            {master.name}
                          </h3>
                          <p className="text-sm text-gray-500 mb-2">{master.era}</p>
                          <p className="mt-2 text-sm text-gray-600 italic">'{master.quote}'</p>
                        </div>

                        {/* 右侧：指示箭头 */}
                        <div className="text-gray-400 group-hover:text-[#2c2c2c] transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </motion.div>

                      {/* 连接点 */}
                      {idx < current.masters.length - 1 && (
                        <div className="absolute left-1/2 bottom-[-16px] w-3 h-3 bg-gray-300/50 rounded-full -ml-1.5" />
                      )}
                    </div>
                  </StaggerItem>
                ))}
              </div>
            </StaggerContainer>
          </div>
        </div>
      </main>

      {/* 祖师详情模态框 */}
      <AnimatePresence>
        {selectedMaster && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMaster(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4 mb-4">
                <AvatarPlaceholder name={selectedMaster.name} size={80} image={selectedMaster.image} />
                <div className="flex-1">
                  <h3 className="text-xl font-serif font-bold mb-1" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                    {selectedMaster.name}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedMaster.era}</p>
                </div>
                <button
                  onClick={() => setSelectedMaster(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-[#f5f0eb] rounded-xl p-4 mb-4">
                <p className="italic text-center text-gray-700">'{selectedMaster.quote}'</p>
              </div>

              <p className="text-gray-600 leading-relaxed" style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}>
                {selectedMaster.bio}
              </p>

              <div className="mt-6 text-right">
                <button
                  onClick={() => setSelectedMaster(null)}
                  className="px-6 py-2 bg-[#2c2c2c] text-white rounded-lg hover:bg-[#4a4a4a] transition-colors font-medium"
                  style={{ fontFamily: "'Ma Shan Zheng', cursive, serif" }}
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
