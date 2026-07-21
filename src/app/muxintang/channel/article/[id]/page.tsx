'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import ContentReader from '@/components/ContentReader';

const ARTICLE_DATA: Record<string, {
  id: string;
  title: string;
  author: string;
  date: string;
  categories: string[];
  content: string;
  free_chapter_count?: number;
  price_per_chapter?: number;
  chapter_index?: number;
  is_paid?: boolean;
}> = {
  '1': {
    id: '1',
    title: '八字排盘入门指南',
    author: '任书颖阿阇梨',
    date: '2024-01-15',
    categories: ['八字命理'],
    content: `# 八字排盘入门指南

## 一、什么是八字

八字排盘是命理分析的基础，也是学习命理的第一步。所谓八字，就是根据一个人的出生年月日时，换算成天干地支，形成四个柱，每个柱有一个天干和一个地支，共八个字，故称八字。

## 二、年柱的确定

排盘的第一步是确定出生的年柱。年柱由天干和地支组成，每六十年一个轮回。例如，2024年是甲辰年，甲是天干，辰是地支。年柱代表一个人的根基和出身背景。

## 三、月柱的确定

月柱的确定相对复杂一些，需要根据节气来划分。每个月的开始不是从农历初一，而是从节气开始。例如，立春之后才算正月，惊蛰之后才算二月。月柱代表一个人的青年时期和事业发展。

## 四、日柱的重要性

日柱是八字中最重要的一柱，代表一个人的核心性格和命运走向。日柱的天干称为日主，是整个八字分析的中心。例如，日柱为甲子，甲木就是日主，代表这个人的本性。

## 五、时柱的排法

时柱代表一个人的晚年运势和子女情况。时柱的排法需要根据出生时辰来确定，每个时辰对应两个小时。例如，子时是晚上11点到凌晨1点，丑时是凌晨1点到3点。

## 六、命理分析

排盘完成后，就可以进行命理分析了。主要包括五行分析、十神分析、大运流年等。五行分析看的是金木水火土的平衡，十神分析看的是财官印食伤的关系，大运流年则是看人生不同阶段的运势变化。`,
    free_chapter_count: 2,
    price_per_chapter: 5.00,
    chapter_index: 1,
    is_paid: false,
  },
};

export default function ArticleDetailPage() {
  const params = useParams();
  const articleId = params.id as string;
  const [initialArticle, setInitialArticle] = useState<typeof ARTICLE_DATA[string] | undefined>();

  useEffect(() => {
    setInitialArticle(ARTICLE_DATA[articleId] || ARTICLE_DATA['1']);
  }, [articleId]);

  if (!initialArticle) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12">
      <div className="max-w-4xl mx-auto px-4">
        <ContentReader 
          articleId={articleId}
          tenantId="muxintang"
          initialArticle={initialArticle}
        />
      </div>
    </div>
  );
}
