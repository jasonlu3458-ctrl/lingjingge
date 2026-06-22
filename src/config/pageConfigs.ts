import type { PageConfig } from '@/components/ChatUI';

/**
 * 页面配置集合
 * 所有AI服务页面的配置集中管理
 */
export const pageConfigs: Record<string, PageConfig> = {
  // ===== 问道系列 (wen/) =====
  
  'meditation': {
    title: '正念冥想',
    subtitle: '回到当下，与自己的心相遇',
    icon: '🧘‍♂️',
    theme: '#5a8a6a',
    welcomeMessage: '回来了。觉察此刻你的心，是躁动的，还是疲惫的？',
    difyType: 'meditation',
    meditationConfig: {
      stateOptions: [
        { label: '🌪️ 心绪不宁，杂念纷飞', value: 'restless', recommendation: '安那般那念', duration: 20 },
        { label: '😔 身心疲惫，提不起劲', value: 'fatigued', recommendation: '慈心禅', duration: 10 },
        { label: '🧘 平静如水，安住当下', value: 'calm', recommendation: '默照禅', duration: 30 },
        { label: '🌙 即将入睡，希望助眠', value: 'sleep', recommendation: '观想月光', duration: 15 },
        { label: '💡 想提升专注力', value: 'focus', recommendation: '数息法', duration: 15 },
      ],
      promptTemplate: '你是一位对禅宗与唐密有深刻领悟的老禅师。用户当前状态为：{state}。请根据此状态，推荐最适合的修法，并生成一段引导词。',
    },
  },

  'mind': {
    title: 'AI疗愈师',
    subtitle: '用温暖对话，疗愈你的情绪',
    icon: '💚',
    theme: '#7a9a7a',
    welcomeMessage: '🌸 这里是你的专属心灵港湾。不必拘束，想说什么就说什么。我们可以从"今天你过得怎么样？"开始聊起。',
    difyType: 'mind',
    conversationConfig: {
      roundsForReport: 4,
      promptStart: '你是一位拥有30年经验的资深疗愈师。用户正处在情绪需要倾诉的阶段。你的核心任务是：共情、深度聆听、温和提问、逐步引导用户深度探索内心。',
      reportStructure: {
        free: ['当前情绪状态', '核心困扰识别', '即刻安抚建议'],
        premium: ['深层情绪根源分析', '量身定制疗愈计划', '长期成长路径', '自我觉察练习'],
      },
    },
  },

  'ai-zen-master': {
    title: 'AI禅师',
    subtitle: '机锋对答，参悟禅心',
    icon: '🧘',
    theme: '#2c2c2c',
    welcomeMessage: '闲坐茶亭，与君共话禅机。',
    difyType: 'ai-zen-master',
    // 纯对话无表单
  },

  'light-solution': {
    title: '解忧师',
    subtitle: '把心事说出来，答案就藏在你心里',
    icon: '💭',
    theme: '#a8c4d4',
    welcomeMessage: '说一句你现在的烦恼，让我陪你理一理。',
    difyType: 'light-solution',
    conversationConfig: {
      roundsForReport: 3,
      promptStart: '你是一位温柔耐心、善于倾听的陪伴者。用户正经历一些生活困扰，希望被理解、被看见。你的任务是共情、复述情绪、提出 1-2 个开放式问题帮用户理清思路。',
      reportStructure: {
        free: ['情绪标签', '困扰简析', '可尝试的一步'],
        premium: ['深层模式识别', '专属建议清单', '7 天自我照护计划'],
      },
    },
  },

  'awakening': {
    title: '觉醒日记',
    subtitle: '每日一悟，明心见性',
    icon: '✨',
    theme: '#e8e0d8',
    welcomeMessage: '今日，你看见了什么？',
    difyType: 'awakening',
    // 纯对话 + 每日引导
  },

  'gongan': {
    title: '公案参究',
    subtitle: '以疑为门，以悟为归',
    icon: '🪷',
    theme: '#8a7a6a',
    welcomeMessage: '一则公案，恰似一把钥匙。',
    difyType: 'gongan',
    // 纯对话 + 随机公案
  },

  'healing': {
    title: '身心疗愈',
    subtitle: '身心同治，内外兼修',
    icon: '🌿',
    theme: '#5a8a8a',
    welcomeMessage: '你的身体，就是你最好的道场。',
    difyType: 'healing',
    // 可增加场景选择（后续）
  },

  'parenting': {
    title: 'AI亲子导师',
    subtitle: '育儿路上的智慧同修',
    icon: '👨‍👩‍👦',
    theme: '#e8c8a0',
    welcomeMessage: '养育孩子，也是一场自我修行。',
    difyType: 'parenting',
    formConfig: {
      submitLabel: '生成亲子报告',
      fields: [
        {
          name: 'child_age',
          label: '孩子年龄',
          type: 'select',
          options: [
            { label: '0-3岁 (婴幼儿)', value: '0-3' },
            { label: '3-6岁 (学前)', value: '3-6' },
            { label: '6-12岁 (小学)', value: '6-12' },
            { label: '12-18岁 (青少年)', value: '12-18' },
          ],
          required: true,
        },
        {
          name: 'child_name',
          label: '孩子称呼 (可选)',
          type: 'text',
          placeholder: '如：小宝、乐乐',
          required: false,
        },
        {
          name: 'main_concern',
          label: '你最主要的困扰是什么？',
          type: 'textarea',
          placeholder: '请用一句话描述...',
          required: true,
        },
        {
          name: 'detailed_situation',
          label: '请详细描述一下具体情况',
          type: 'textarea',
          placeholder: '发生了什么？频率如何？你的感受？',
          required: true,
        },
        {
          name: 'family_background',
          label: '家庭背景 (可选)',
          type: 'textarea',
          placeholder: '家庭结构、父母关系、教育方式等...',
          required: false,
        },
      ],
      reportStructure: {
        free: ['问题分析', '即时建议', '沟通技巧'],
        premium: ['深度心理分析', '长期教育方案', '个性化成长计划'],
      },
    },
  },

  'yili': {
    title: 'AI易理师',
    subtitle: '起一智慧指引，答你心中惑',
    icon: '☯️',
    theme: '#8a7a4a',
    welcomeMessage: '心诚则灵。你心中默念所问之事，我为你智慧指引。',
    difyType: 'yili',
    formConfig: {
      submitLabel: '智慧指引问事',
      fields: [
        { name: 'real_name', label: '你的姓名', type: 'text', placeholder: '请输入姓名', required: true },
        { name: 'question', label: '你想问什么事？', type: 'textarea', placeholder: '例如：我该不该跳槽？', required: true },
      ],
      reportStructure: {
        free: ['本卦解读', '卦象简析', '吉凶判断'],
        premium: ['变卦详解', '应期预测', '趋吉避凶建议'],
      },
    },
  },

  // ===== 观心系列 (guan/) =====

  // mingli 已迁出 pageConfigs 通用模板，改走 lifecode 紫蓝新架构：
  //   页面： src/app/guan/lifecode/LifeCodePageClient.tsx
  //   规则： src/lib/lifecode-rules.ts
  //   API：  src/app/api/lifecode/route.ts + src/app/api/lifecode/polish/route.ts
  // 原因：lifecode 需要「日干人格 + 出生季节 + 本年流年 + Dify 流式润色」，
  // 通用 ChatUI 模板撑不起这 5+5 的报告结构与玻璃 UI。保留占位以避免类型报错。

  // === 内观系列新增 5 项 (family/career/education/house/body) ===

  // family 模块已迁出 pageConfigs 通用模板，改走「教育 4 件套」架构：
  //   页面： src/app/guan/family/FamilyPageClient.tsx
  //   规则： src/lib/marriage-rules.ts
  //   API：  src/app/api/marriage/route.ts + src/app/api/marriage/polish/route.ts
  // 原因：family 需要「双八字比对 + 关系状态/痛点 + 流年付费差异化」，
  // 通用 ChatUI 模板撑不起双列表单和复杂报告结构。保留占位以避免类型报错。
  'family': null as unknown as PageConfig,

  'career': {
    title: 'AI事业财富',
    subtitle: '看清大势，顺势而为',
    icon: '💼',
    theme: '#8a6a4a',
    welcomeMessage: '事业是天赋与世界相遇的方式。',
    difyType: 'career',
    formConfig: {
      submitLabel: '生成事业建议',
      fields: [
        { name: 'industry', label: '当前行业 / 领域', type: 'text', placeholder: '如：互联网 / 教育 / 设计', required: true },
        { name: 'career_stage', label: '事业阶段', type: 'select', options: [
          { label: '起步期 (0-3 年)', value: 'start' },
          { label: '成长期 (3-8 年)', value: 'growth' },
          { label: '转型期', value: 'pivot' },
          { label: '成熟期 (8 年+)', value: 'mature' },
        ], required: true },
        { name: 'concern', label: '当前的卡点', type: 'textarea', placeholder: '是收入瓶颈？晋升难题？方向迷茫？', required: true },
      ],
      reportStructure: {
        free: ['天赋与行业匹配度', '近期趋势提示'],
        premium: ['三年事业蓝图', '关键决策清单', '财富增长建议'],
      },
    },
  },

  'education': {
    title: 'AI子女教育',
    subtitle: '懂孩子，才能教孩子',
    icon: '🌱',
    theme: '#5a8a6a',
    welcomeMessage: '每一个孩子，都有自己的时区。',
    difyType: 'education',
    formConfig: {
      submitLabel: '生成养育建议',
      fields: [
        { name: 'child_age', label: '孩子年龄', type: 'text', placeholder: '如：7 岁', required: true },
        { name: 'child_traits', label: '性格特征', type: 'textarea', placeholder: '活泼 / 敏感 / 内向 / 慢热 ...', required: false },
        { name: 'concern', label: '目前最关心的教育问题', type: 'textarea', placeholder: '写作业拖拉 / 情绪管理 / 学业压力 ...', required: true },
      ],
      reportStructure: {
        free: ['孩子气质分析', '常见误区提醒'],
        premium: ['个性化教养策略', '亲子沟通话术', '阶段性成长建议'],
      },
    },
  },

  'house': {
    title: 'AI家居环境',
    subtitle: '住的舒服，是最好的空间布局',
    icon: '🏠',
    theme: '#6a7a8a',
    welcomeMessage: '家，是身心的容器。',
    difyType: 'house',
    formConfig: {
      submitLabel: '生成家居建议',
      fields: [
        { name: 'house_type', label: '户型', type: 'select', options: [
          { label: '一室一厅', value: '1b1l' },
          { label: '两室一厅', value: '2b1l' },
          { label: '三室及以上', value: '3b' },
          { label: 'loft / 复式', value: 'loft' },
        ], required: true },
        { name: 'orientation', label: '房屋朝向', type: 'select', options: [
          { label: '坐北朝南', value: 'sn' },
          { label: '东西向', value: 'ew' },
          { label: '不规则 / 不清楚', value: 'unknown' },
        ], required: false },
        { name: 'concern', label: '想改善的空间或困扰', type: 'textarea', placeholder: '卧室睡眠 / 客厅凌乱 / 儿童房 / 书房 ...', required: true },
      ],
      reportStructure: {
        free: ['空间能量诊断', '基础摆放建议'],
        premium: ['逐区域优化方案', '色彩与材质指南', '四季调整策略'],
      },
    },
  },

  'body': {
    title: 'AI身心合一',
    subtitle: '炼体炼心，内外同调',
    icon: '🌿',
    theme: '#6a8a5a',
    welcomeMessage: '身心本是一体，听见身体的低语。',
    difyType: 'body',
    formConfig: {
      submitLabel: '生成身心报告',
      fields: [
        { name: 'birth_date', label: '出生日期', type: 'date', required: true },
        { name: 'gender', label: '性别', type: 'select', options: [
          { label: '男', value: 'male' }, { label: '女', value: 'female' }
        ], required: true },
        { name: 'focus', label: '关注方向（可多选）', type: 'select', options: [
          { label: '体质与养生', value: 'constitution' },
          { label: '功法与炼体', value: 'practice' },
          { label: '心绪与释怀', value: 'emotion' },
          { label: '三者皆想了解', value: 'all' },
        ], required: true },
        { name: 'current_state', label: '当前身体 / 情绪状态', type: 'textarea', placeholder: '最近睡眠 / 精力 / 情绪的实际情况', required: false },
        { name: 'past_pattern', label: '想照见的前因 / 业力课题 (可选)', type: 'textarea', placeholder: '反复出现的模式、想解开的结', required: false },
      ],
      reportStructure: {
        free: ['体质类型概要', '身心互动简析'],
        premium: ['深度体质报告', '炼体功法定制', '心绪疏导路径', '前世因缘参考'],
      },
    },
  },

  // ===== 藏经系列 (zang/) =====

  'library_classics': {
    title: '经典',
    subtitle: '根本智慧，源头活水',
    icon: '📖',
    theme: '#5a4a3a',
    welcomeMessage: '经典是千年的对话。',
    difyType: 'library_classics',
    requireConsent: false, // 藏经阁原文：非关键页面，不强制弹窗
  },

  'library_treasure': {
    title: '秘藏',
    subtitle: '独门心法，不传之秘',
    icon: '💎',
    theme: '#5a4a3a',
    welcomeMessage: '唯有行者，方得一见。',
    difyType: 'library_treasure',
    requireConsent: false, // 秘藏原文：非关键页面，不强制弹窗
  },

  // ===== 同修系列 (tong/) =====

  'community_essence': {
    title: '精华区',
    subtitle: '道友心得，智慧结晶',
    icon: '💎',
    theme: '#5a4a3a',
    welcomeMessage: '这里汇聚了同修们的真知灼见。',
    difyType: 'community_essence',
  },

  'community_topics': {
    title: '话题聚合',
    subtitle: '一题一参，共修共悟',
    icon: '🪷',
    theme: '#5a4a3a',
    welcomeMessage: '每一主题，都是一次集体参悟。',
    difyType: 'community_topics',
  },
};

/**
 * 获取页面配置
 * @param configKey 配置键名
 * @returns 页面配置
 */
export function getPageConfig(configKey: string): PageConfig | undefined {
  return pageConfigs[configKey];
}