-- ============================================================
-- Migration: 2026-08-01 个性化推送 + Web Push 订阅
-- ------------------------------------------------------------
-- 适用：profiles / user_profiles（按本项目实际表执行）
-- 作用：
--   1) bazi_profile (JSONB)        命理画像（由 lifecode / bazi 工具写入）
--   2) last_zen_sent_at (TIMESTAMPTZ) 节流：记录最近一次禅机推送
--   3) is_push_enabled (BOOLEAN)   用户是否订阅了 Web Push
--   4) push_subscription (JSONB)   浏览器生成的 Web Push 订阅
-- ============================================================

-- ----------- profiles -----------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS bazi_profile      JSONB        DEFAULT '{}'::JSONB;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_zen_sent_at  TIMESTAMPTZ  DEFAULT NULL;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_push_enabled   BOOLEAN      DEFAULT false;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS push_subscription JSONB        DEFAULT NULL;

-- 可选索引：节流 / 拉取订阅者列表
CREATE INDEX IF NOT EXISTS idx_profiles_is_push_enabled
  ON profiles (is_push_enabled)
  WHERE is_push_enabled = true;

CREATE INDEX IF NOT EXISTS idx_profiles_last_zen_sent_at
  ON profiles (last_zen_sent_at);

-- ----------- user_profiles (兼容双表) -----------
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS bazi_profile      JSONB        DEFAULT '{}'::JSONB;
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS last_zen_sent_at  TIMESTAMPTZ  DEFAULT NULL;
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS is_push_enabled   BOOLEAN      DEFAULT false;
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS push_subscription JSONB        DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_is_push_enabled
  ON user_profiles (is_push_enabled)
  WHERE is_push_enabled = true;

CREATE INDEX IF NOT EXISTS idx_user_profiles_last_zen_sent_at
  ON user_profiles (last_zen_sent_at);

-- ============================================================
-- RLS 提示：
-- 已有 RLS 策略会基于 auth.uid() 限制用户只能读写自己的画像。
-- 上述新增列默认继承现有策略，无需额外配置。
-- 管理员后台（service_role）始终可读写。
-- ============================================================
