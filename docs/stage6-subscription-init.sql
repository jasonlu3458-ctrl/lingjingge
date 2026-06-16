-- 会员订阅 · Supabase 迁移
-- 在 Supabase SQL Editor 中执行（项目 → SQL → New query → 粘贴 → Run）
-- 已加 IF NOT EXISTS / ADD COLUMN IF NOT EXISTS，可重复执行

-- =====================================================
-- 1. profiles 表补充会员字段
-- =====================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_start   timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_end     timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_status  text DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'canceled', 'expired', 'inactive')),
  ADD COLUMN IF NOT EXISTS subscription_type    text
    CHECK (subscription_type IN ('monthly', 'yearly'));


-- =====================================================
-- 2. report_purchases（单次报告购买记录）
-- =====================================================
CREATE TABLE IF NOT EXISTS report_purchases (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  report_type   text NOT NULL,
  price         numeric(10,2) DEFAULT 9.9,
  purchased_at  timestamptz DEFAULT now(),
  report_id     text,
  UNIQUE(user_id, report_type)
);

CREATE INDEX IF NOT EXISTS idx_report_purchases_user
  ON report_purchases(user_id, purchased_at DESC);

ALTER TABLE report_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "report_purchases select own" ON report_purchases;
CREATE POLICY "report_purchases select own"
  ON report_purchases FOR SELECT
  USING (auth.uid() = user_id);


-- =====================================================
-- 3. membership_offers（会员续费优惠记录）
-- =====================================================
CREATE TABLE IF NOT EXISTS membership_offers (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_type  text NOT NULL,
  applied_at  timestamptz DEFAULT now(),
  expires_at  timestamptz
);

CREATE INDEX IF NOT EXISTS idx_membership_offers_user
  ON membership_offers(user_id, applied_at DESC);

ALTER TABLE membership_offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "membership_offers select own" ON membership_offers;
CREATE POLICY "membership_offers select own"
  ON membership_offers FOR SELECT
  USING (auth.uid() = user_id);


-- =====================================================
-- 4. promotion_configs（限时优惠配置）
-- =====================================================
CREATE TABLE IF NOT EXISTS promotion_configs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text NOT NULL,
  description     text,
  discount_type   text NOT NULL,            -- 'first_month' / 'seasonal' / '...
  discount_value  numeric(10,2) NOT NULL,   -- 首月价格 19.9
  start_date      timestamptz,
  end_date        timestamptz,
  product_id      text,                     -- 关联 Polar product_id
  max_uses        int,
  current_uses    int DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_promotion_configs_active
  ON promotion_configs(discount_type, start_date, end_date);

-- 示例数据：首月特惠 19.9（请按需修改）
INSERT INTO promotion_configs (name, description, discount_type, discount_value, product_id, max_uses)
VALUES (
  '首月特惠',
  '新手专享：行者会员首月仅 19.9 元',
  'first_month',
  19.9,
  (SELECT id FROM polar_products WHERE slug = 'monthly' LIMIT 1),
  1000
)
ON CONFLICT DO NOTHING;


-- =====================================================
-- 验证
-- =====================================================
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'profiles' AND column_name LIKE 'subscription%';
-- SELECT * FROM report_purchases LIMIT 5;
-- SELECT * FROM promotion_configs;
