-- 阶段五 · 同修板块
-- 在 Supabase SQL Editor 中执行（项目 → SQL → New query → 粘贴 → Run）

-- =====================================================
-- 1. user_points 积分表
-- =====================================================
CREATE TABLE IF NOT EXISTS user_points (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  points        int DEFAULT 0,
  sign_in_date  date,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(user_id, sign_in_date)
);

-- 索引：按用户 + 日期范围查询
CREATE INDEX IF NOT EXISTS idx_user_points_user_date
  ON user_points(user_id, sign_in_date DESC);

-- RLS
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;

-- 自己的记录可读
DROP POLICY IF EXISTS "user_points select own" ON user_points;
CREATE POLICY "user_points select own"
  ON user_points FOR SELECT
  USING (auth.uid() = user_id);

-- 写操作由服务端 service_role 绕过 RLS；如需客户端写入可再加 INSERT policy：
-- DROP POLICY IF EXISTS "user_points insert own" ON user_points;
-- CREATE POLICY "user_points insert own" ON user_points FOR INSERT WITH CHECK (auth.uid() = user_id);


-- =====================================================
-- 2. profiles 添加邀请字段
-- =====================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS invited_by    uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reward_claimed boolean DEFAULT false;

-- 索引：查"我邀请的人"
CREATE INDEX IF NOT EXISTS idx_profiles_invited_by
  ON profiles(invited_by)
  WHERE invited_by IS NOT NULL;


-- =====================================================
-- 3. free_turns 免费对话次数表（可选）
-- =====================================================
CREATE TABLE IF NOT EXISTS free_turns (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  turns       int DEFAULT 0,
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE free_turns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "free_turns select own" ON free_turns;
CREATE POLICY "free_turns select own"
  ON free_turns FOR SELECT
  USING (auth.uid() = user_id);


-- =====================================================
-- 验证
-- =====================================================
-- SELECT * FROM user_points LIMIT 5;
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles' AND column_name IN ('invited_by','reward_claimed');
-- SELECT * FROM free_turns LIMIT 5;
