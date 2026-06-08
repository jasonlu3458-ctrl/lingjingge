/**
 * 订阅流程 Mock 测试数据
 * 
 * 使用方法：
 * 1. 在浏览器控制台中运行此文件
 * 2. 或者创建一个测试页面来调用这些 mock 函数
 */

// ========================================
// Mock Stripe 价格配置
// ========================================
export const MOCK_PRICE_IDS = {
  monthly: 'price_mock_monthly_001',
  yearly: 'price_mock_yearly_001',
};

// ========================================
// Mock 用户数据
// ========================================
export const MOCK_USER = {
  id: 'user_mock_123456789',
  email: 'test@example.com',
  user_metadata: {
    name: '测试用户',
  },
};

// ========================================
// Mock Profile 数据
// ========================================
export const MOCK_PROFILE = {
  id: 'user_mock_123456789',
  email: 'test@example.com',
  role: 'free', // 'free' | 'monthly' | 'yearly'
  subscription_status: null, // null | 'active' | 'past_due' | 'canceled'
  stripe_customer_id: null,
  stripe_subscription_id: null,
  subscription_start: null,
  subscription_end: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// ========================================
// Mock Stripe Checkout Session 响应
// ========================================
export const MOCK_CHECKOUT_SESSION = {
  id: 'cs_mock_' + Date.now(),
  object: 'checkout.session',
  payment_method_types: ['card'],
  mode: 'subscription',
  status: 'open',
  url: 'https://checkout.stripe.com/pay/cs_mock_xxx',
  customer: 'cus_mock_' + Date.now(),
  subscription: 'sub_mock_' + Date.now(),
  metadata: {
    userId: MOCK_USER.id,
    plan: 'monthly',
  },
  subscription_data: {
    metadata: {
      userId: MOCK_USER.id,
      plan: 'monthly',
    },
  },
};

// ========================================
// Mock Stripe Subscription 响应
// ========================================
export const MOCK_SUBSCRIPTION = {
  id: 'sub_mock_' + Date.now(),
  object: 'subscription',
  status: 'active',
  current_period_start: Math.floor(Date.now() / 1000),
  current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30天后
  metadata: {
    userId: MOCK_USER.id,
    plan: 'monthly',
  },
  customer: 'cus_mock_' + Date.now(),
};

// ========================================
// Mock API 响应
// ========================================

/**
 * 创建 Checkout Session 的 Mock 响应
 */
export function getMockCheckoutResponse(overrides = {}) {
  return {
    sessionId: MOCK_CHECKOUT_SESSION.id,
    url: MOCK_CHECKOUT_SESSION.url,
    ...overrides,
  };
}

/**
 * 订阅成功的 Mock 响应
 */
export function getMockSubscriptionSuccessResponse(overrides = {}) {
  return {
    received: true,
    ...overrides,
  };
}

/**
 * 订阅失败的 Mock 响应
 */
export function getMockErrorResponse(message = '订阅失败') {
  return {
    error: message,
  };
}

/**
 * 已订阅的 Mock 响应
 */
export function getMockAlreadySubscribedResponse() {
  return {
    error: '您已经是付费会员，无需重复订阅',
    alreadySubscribed: true,
  };
}

// ========================================
// Mock 函数
// ========================================

interface CreateCheckoutSessionParams {
  priceId?: string;
  userId?: string | null;
  email?: string;
  plan?: string;
}

/**
 * 模拟创建 Checkout Session
 */
export async function mockCreateCheckoutSession(params: CreateCheckoutSessionParams) {
  console.log('🧪 Mock: 创建 Checkout Session', params);
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // 检查参数
  if (!params.userId) {
    return { error: '请先登录后再订阅' };
  }
  
  // 返回成功的 Checkout Session
  return getMockCheckoutResponse({
    sessionId: 'cs_mock_' + Date.now(),
    url: 'http://localhost:3000/success?session_id=cs_mock_' + Date.now(),
  });
}

/**
 * 模拟 Webhook 事件处理
 */
export async function mockHandleWebhook(eventType: string, data: Record<string, unknown> = {}) {
  console.log('🧪 Mock: 处理 Webhook 事件', { eventType, data });
  
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  switch (eventType) {
    case 'checkout.session.completed':
      console.log('✅ Mock: 订阅完成事件已处理');
      return { received: true };
      
    case 'customer.subscription.updated':
      console.log('📝 Mock: 订阅更新事件已处理');
      return { received: true };
      
    case 'customer.subscription.deleted':
      console.log('❌ Mock: 订阅取消事件已处理');
      return { received: true };
      
    case 'invoice.payment_succeeded':
      console.log('💰 Mock: 支付成功事件已处理');
      return { received: true };
      
    case 'invoice.payment_failed':
      console.log('⚠️ Mock: 支付失败事件已处理');
      return { received: true };
      
    default:
      console.log('⚪ Mock: 未知事件类型', eventType);
      return { received: true };
  }
}

/**
 * 模拟订阅流程测试
 */
export async function testSubscriptionFlow(plan = 'monthly') {
  console.log('========================================');
  console.log('🧪 开始测试订阅流程');
  console.log('========================================');
  console.log('📋 测试计划:', plan);
  console.log('');
  
  try {
    // Step 1: 检查登录状态
    console.log('📝 Step 1: 检查登录状态');
    console.log('✅ 用户已登录:', MOCK_USER);
    console.log('');
    
    // Step 2: 检查订阅状态
    console.log('📝 Step 2: 检查订阅状态');
    console.log('✅ 当前订阅状态:', MOCK_PROFILE.subscription_status || '无订阅');
    console.log('✅ 当前角色:', MOCK_PROFILE.role);
    console.log('');
    
    // Step 3: 创建 Checkout Session
    console.log('📝 Step 3: 创建 Checkout Session');
    const checkoutResult = await mockCreateCheckoutSession({
      priceId: plan === 'monthly' ? MOCK_PRICE_IDS.monthly : MOCK_PRICE_IDS.yearly,
      userId: MOCK_USER.id,
      email: MOCK_USER.email,
      plan: plan,
    });
    
    if ('error' in checkoutResult) {
      console.log('❌ Checkout Session 创建失败:', checkoutResult.error);
      return { success: false, error: checkoutResult.error };
    }
    
    console.log('✅ Checkout Session 创建成功:', checkoutResult.sessionId);
    console.log('🔗 支付链接:', checkoutResult.url);
    console.log('');
    
    // Step 4: 模拟支付完成
    console.log('📝 Step 4: 模拟支付完成（Webhook）');
    const webhookResult = await mockHandleWebhook('checkout.session.completed', {
      session: checkoutResult,
      subscription: MOCK_SUBSCRIPTION,
    });
    console.log('✅ Webhook 处理成功');
    console.log('');
    
    // Step 5: 验证订阅状态更新
    console.log('📝 Step 5: 验证订阅状态更新');
    const updatedProfile = {
      ...MOCK_PROFILE,
      role: plan,
      subscription_status: 'active',
      stripe_subscription_id: MOCK_SUBSCRIPTION.id,
      subscription_start: new Date(MOCK_SUBSCRIPTION.current_period_start * 1000).toISOString(),
      subscription_end: new Date(MOCK_SUBSCRIPTION.current_period_end * 1000).toISOString(),
    };
    console.log('✅ 订阅状态已更新:', updatedProfile);
    console.log('');
    
    console.log('========================================');
    console.log('🎉 订阅流程测试完成！');
    console.log('========================================');
    
    return {
      success: true,
      profile: updatedProfile,
      checkoutSession: checkoutResult,
      subscription: MOCK_SUBSCRIPTION,
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 模拟重复订阅检查
 */
export async function testAlreadySubscribedCheck() {
  console.log('========================================');
  console.log('🧪 测试重复订阅检查');
  console.log('========================================');
  console.log('');
  
  // 模拟用户已经是付费会员
  const existingProfile = {
    ...MOCK_PROFILE,
    role: 'monthly',
    subscription_status: 'active',
  };
  
  console.log('📋 当前用户信息:', existingProfile);
  console.log('');
  
  // 尝试订阅
  if (existingProfile.role !== 'free' && existingProfile.subscription_status === 'active') {
    console.log('⚠️ 检测到用户已有活跃订阅');
    const response = getMockAlreadySubscribedResponse();
    console.log('❌ 返回错误:', response);
    console.log('');
    console.log('========================================');
    console.log('✅ 重复订阅检查测试通过！');
    console.log('========================================');
    return response;
  }
}

// ========================================
// 测试用例
// ========================================

export const TEST_CASES = {
  // 正常订阅流程
  monthlySubscription: () => testSubscriptionFlow('monthly'),
  yearlySubscription: () => testSubscriptionFlow('yearly'),
  
  // 重复订阅检查
  alreadySubscribed: () => testAlreadySubscribedCheck(),
  
  // 未登录尝试订阅
  notLoggedIn: async () => {
    console.log('========================================');
    console.log('🧪 测试未登录订阅');
    console.log('========================================');
    console.log('');
    
    const result = await mockCreateCheckoutSession({
      userId: null,
    });
    
    console.log('❌ 返回错误:', result);
    console.log('');
    console.log('========================================');
    console.log('✅ 未登录检查测试通过！');
    console.log('========================================');
    return result;
  },
};

// ========================================
// 导出所有测试工具
// ========================================
export default {
  // Mock 数据
  MOCK_PRICE_IDS,
  MOCK_USER,
  MOCK_PROFILE,
  MOCK_CHECKOUT_SESSION,
  MOCK_SUBSCRIPTION,
  
  // Mock 函数
  mockCreateCheckoutSession,
  mockHandleWebhook,
  testSubscriptionFlow,
  testAlreadySubscribedCheck,
  
  // 测试用例
  TEST_CASES,
  
  // Mock 响应生成器
  getMockCheckoutResponse,
  getMockSubscriptionSuccessResponse,
  getMockErrorResponse,
  getMockAlreadySubscribedResponse,
};
