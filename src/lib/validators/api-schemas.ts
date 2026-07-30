// ============================================================
// src/lib/validators/api-schemas.ts
// 灵境阁后台 API 请求体 Zod 校验中心
// ------------------------------------------------------------
//  - 所有 POST / PATCH / PUT 路由在进入业务逻辑前必须先调用
//    parseRequestBody(schema, body) 完成类型 / 格式校验。
//  - .strict() 模式：拒绝任何未在 schema 中声明的字段，防止
//    攻击者注入未知键污染数据库。
//  - 错误统一返回 400 + { error, details: fieldErrors }，
//    客户端可基于 details 做表单级高亮。
// ============================================================

import { z } from 'zod';
import { NextResponse } from 'next/server';

// ============================================================
// 通用工具
// ============================================================

/**
 * 安全解析请求体：成功返回 { data }，失败返回 NextResponse(400)。
 * 用法：
 *   const parsed = parseRequestBody(ProductSchema, body);
 *   if (parsed instanceof NextResponse) return parsed;
 *   // parsed.data 已是强类型
 */
export function parseRequestBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown
): { data: z.infer<T> } | NextResponse {
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        error: '请求数据格式错误',
        details: result.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }
  return { data: result.data };
}

// ============================================================
// 1. 商品管理 (merchant_products)
// ------------------------------------------------------------
// 表格字段：title / price / description / image_url / category
//  / status / product_type / stock_quantity / digital_file_url
// ============================================================

export const ProductCategoryEnum = z.enum([
  '牧心吉品',
  '爱宠配饰',
  '数字法物',
  '密法读物',
  'default',
]);

export const ProductTypeEnum = z.enum(['physical', 'digital']);

export const ProductStatusEnum = z.enum(['active', 'inactive', 'draft']);

// 新建商品：必填字段
export const ProductCreateSchema = z
  .object({
    title: z.string().min(1, '标题不能为空').max(100, '标题最长 100 字'),
    price: z.number().positive('价格必须大于 0'),
    description: z.string().max(2000, '描述过长').optional(),
    image_url: z.string().url('请提供有效的图片 URL').optional().or(z.literal('')),
    category: ProductCategoryEnum,
    product_type: ProductTypeEnum,
    status: ProductStatusEnum.optional(),
    stock_quantity: z.number().int().min(0, '库存不能为负数').optional(),
    digital_file_url: z.string().url().optional().or(z.literal('')),
  })
  .strict();

// 更新商品：所有字段可选，但必须传 id
export const ProductUpdateSchema = z
  .object({
    id: z.string().min(1, '缺少商品 ID'),
    title: z.string().min(1).max(100).optional(),
    price: z.number().positive().optional(),
    description: z.string().max(2000).optional(),
    image_url: z.string().url().optional().or(z.literal('')),
    category: ProductCategoryEnum.optional(),
    product_type: ProductTypeEnum.optional(),
    status: ProductStatusEnum.optional(),
    stock_quantity: z.number().int().min(0).optional(),
    digital_file_url: z.string().url().optional().or(z.literal('')),
  })
  .strict();

// /api/admin/products/[id] 当前实现对应的是 promotions 表
// （保留原语义，仅校验请求体形状）
export const PromotionUpdateSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    price: z.number().nonnegative().optional(),
    description: z.string().max(2000).optional(),
    category: z.string().min(1).max(100).optional(),
    status: z.string().min(1).max(50).optional(),
  })
  .strict();

// ============================================================
// 2. 功能市场 / 租户额外配置 (tenants.extra_config)
// ============================================================

export const FeaturesConfigSchema = z
  .object({
    ai_wallpaper: z.boolean().optional(),
    pet_zone: z.boolean().optional(),
    ebook_download: z.boolean().optional(),
    consultation_form: z.boolean().optional(),
    daily_digest: z.boolean().optional(),
  })
  .strict();

export const FeaturesConfigUpdateSchema = z
  .object({
    extra_config: FeaturesConfigSchema,
  })
  .strict();

// ============================================================
// 3. 租户更新 (tenants)
// ------------------------------------------------------------
// 限定可修改的字段，.strict() 拒绝注入额外列。
// ============================================================

const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, '请提供 #RRGGBB 格式的色值');

const ThemeConfigSchema = z
  .object({
    primary: z.string().optional(),
    primary_light: z.string().optional(),
    primary_dark: z.string().optional(),
    gold: z.string().optional(),
    gold_light: z.string().optional(),
    gold_dark: z.string().optional(),
    bg_dark: z.string().optional(),
    bg_card: z.string().optional(),
    text_primary: z.string().optional(),
    text_secondary: z.string().optional(),
    text_muted: z.string().optional(),
    border_color: z.string().optional(),
  })
  .strict()
  .partial();

const NavItemSchema = z
  .object({
    label: z.string().min(1).max(50),
    href: z.string().min(1).max(200),
    icon: z.string().max(20).optional(),
  })
  .strict();

export const UpdateTenantSchema = z
  .object({
    name: z.string().min(1).max(50).optional(),
    logo_url: z.string().url().optional().or(z.literal('')),
    primary_color: HexColorSchema.optional(),
    theme_config: ThemeConfigSchema.optional(),
    extra_config: z.record(z.boolean()).optional(),
    enabled_features: z.array(NavItemSchema).max(20, '菜单项不能超过 20 个').optional(),
    ai_persona_prefix: z.string().max(2000, '人格前缀过长').optional(),
  })
  .strict();

// ============================================================
// 4. 文章管理 (articles)
// ============================================================

export const ArticleSourceEnum = z.enum(['original', 'translation', 'curated']);

export const ArticleCreateSchema = z
  .object({
    slug: z
      .string()
      .min(1, 'slug 不能为空')
      .max(200)
      .regex(/^[a-z0-9-]+$/i, 'slug 仅支持字母、数字、连字符'),
    title: z.string().min(1, '标题不能为空').max(200),
    content: z.string().min(1, '内容不能为空').max(200_000, '内容过长'),
    source: ArticleSourceEnum.optional(),
    category: z.string().max(50).optional(),
  })
  .strict();

// ============================================================
// 5. 创作者 AI 配置 (acharya_ai_configs)
// ============================================================

export const AcharyaAIConfigCreateSchema = z
  .object({
    acharya_id: z.string().min(1, '阿阇梨 ID 不能为空').max(100),
    acharya_name: z.string().min(1, '阿阇梨名称不能为空').max(50),
    dify_api_key: z.string().min(10, 'Dify API Key 格式不正确').max(500),
    system_prompt: z.string().min(1, '系统提示词不能为空').max(10_000),
    knowledge_base_ids: z.array(z.string().min(1).max(200)).max(20).optional(),
  })
  .strict();

// /api/admin/acharya-ai-configs/[id] PUT 同样字段
export const AcharyaAIConfigUpdateSchema = AcharyaAIConfigCreateSchema.partial();

// ============================================================
// 6. 长文生成 (generate-article)
// ============================================================

export const GenerateArticleSchema = z
  .object({
    notes: z
      .string({ required_error: '笔记内容必填' })
      .min(50, '笔记内容至少需要 50 字')
      .max(20_000, '笔记内容过长'),
    title: z.string().min(1).max(200).optional(),
    // 请求里允许带 tenantId，但服务端会忽略（强制使用 auth.tenantId 防越权）
    tenantId: z.string().max(100).optional(),
  })
  .strict();
