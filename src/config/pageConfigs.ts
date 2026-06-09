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
    subtitle: '起一卦，解你心中惑',
    icon: '☯️',
    theme: '#8a7a4a',
    welcomeMessage: '心诚则灵。你心中默念所问之事，我为你起卦。',
    difyType: 'yili',
    formConfig: {
      submitLabel: '起卦问事',
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

  'mingli': {
    title: 'AI生命密码',
    subtitle: '揭秘你的天赋与人生使命',
    icon: '🔮',
    theme: '#6a4a8a',
    welcomeMessage: '你的出生日期，藏着你的生命密码。让我为你解读。',
    difyType: 'mingli',
    formConfig: {
      submitLabel: '解读我的生命密码',
      fields: [
        { name: 'birth_date', label: '你的出生日期', type: 'date', required: true },
        { name: 'birth_time', label: '出生时辰 (可选)', type: 'select', options: [
          { label: '子时', value: 'zi' }, { label: '丑时', value: 'chou' }, { label: '寅时', value: 'yin' },
          { label: '卯时', value: 'mao' }, { label: '辰时', value: 'chen' }, { label: '巳时', value: 'si' },
          { label: '午时', value: 'wu' }, { label: '未时', value: 'wei' }, { label: '申时', value: 'shen' },
          { label: '酉时', value: 'you' }, { label: '戌时', value: 'xu' }, { label: '亥时', value: 'hai' },
        ], required: false },
        { name: 'gender', label: '性别', type: 'select', options: [
          { label: '男', value: 'male' }, { label: '女', value: 'female' }
        ], required: true },
      ],
      reportStructure: {
        free: ['生命灵数解析', '星座/生肖概要', '天赋潜能'],
        premium: ['深度八字简析', '人生阶段运势', '个性化成长建议'],
      },
    },
  },

  'name': {
    title: 'AI取名轩',
    subtitle: '赐你好名，一生相伴',
    icon: '📝',
    theme: '#b85a4a',
    welcomeMessage: '一个好名，就是一道护身符。',
    difyType: 'name',
    formConfig: {
      submitLabel: '生成名字建议',
      fields: [
        { name: 'surname', label: '姓氏', type: 'text', placeholder: '请输入姓氏', required: true },
        { name: 'gender', label: '性别', type: 'select', options: [{label:'男',value:'male'},{label:'女',value:'female'}], required: true },
        { name: 'birth_date', label: '出生日期 (可选)', type: 'date', required: false },
        { name: 'style', label: '期望风格', type: 'select', options: [{label:'古典',value:'classic'},{label:'现代',value:'modern'},{label:'诗意',value:'poetic'}], required: false },
      ],
      reportStructure: {
        free: ['名字推荐', '五行解析'],
        premium: ['深度姓名分析', '运势关联'],
      },
    },
  },

  'tili': {
    title: 'AI炼体师',
    subtitle: '炼形炼神，内外合一',
    icon: '⚡',
    theme: '#b88a4a',
    welcomeMessage: '身体是灵魂的殿堂。',
    difyType: 'tili',
    formConfig: {
      submitLabel: '生成炼体方案',
      fields: [
        { name: 'age', label: '年龄', type: 'text', placeholder: '请输入年龄', required: true },
        { name: 'body_type', label: '体质类型', type: 'select', options: [
          { label: '平和 (精力充沛，睡眠良好，不易生病)', value: 'balanced' },
          { label: '气虚 (容易疲劳，说话有气无力，稍动就出汗)', value: 'qi_deficiency' },
          { label: '阳虚 (非常怕冷，手脚冰凉，喜热食热饮)', value: 'yang_deficiency' },
          { label: '阴虚 (口干咽燥，手心脚心发热，容易失眠)', value: 'yin_deficiency' },
          { label: '痰湿 (体型偏胖，身体沉重，容易困倦，舌苔厚腻)', value: 'phlegm_dampness' },
        ], required: true },
        { name: 'symptoms', label: '当前症状', type: 'textarea', placeholder: '请描述身体不适', required: false },
      ],
      reportStructure: {
        free: ['功法推荐', '呼吸法'],
        premium: ['定制炼体计划', '饮食建议'],
      },
    },
  },

  'health': {
    title: 'AI体质观察',
    subtitle: '辨体质，调身心',
    icon: '🌱',
    theme: '#6a8a5a',
    welcomeMessage: '你的体质，藏着你的健康密码。',
    difyType: 'health',
    formConfig: {
      submitLabel: '生成体质报告',
      fields: [
        { name: 'height', label: '身高 (cm)', type: 'text', placeholder: '请输入身高', required: true },
        { name: 'weight', label: '体重 (kg)', type: 'text', placeholder: '请输入体重', required: true },
        { name: 'symptoms', label: '主要症状', type: 'textarea', placeholder: '请描述您的身体状况', required: true },
        { name: 'tongue', label: '舌象描述 (可选)', type: 'text', placeholder: '如：舌苔白腻', required: false },
      ],
      reportStructure: {
        free: ['体质类型', '四季调养'],
        premium: ['深度体质分析', '定制方案'],
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
  },

  'library_treasure': {
    title: '秘藏',
    subtitle: '独门心法，不传之秘',
    icon: '💎',
    theme: '#5a4a3a',
    welcomeMessage: '唯有行者，方得一见。',
    difyType: 'library_treasure',
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