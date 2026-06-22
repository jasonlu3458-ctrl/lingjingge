-- ============================================================
-- 007_invite_rewards_and_profiles_rls.sql
-- 邀请奖励 + profiles 表 RLS 兜底
--
-- 背景：
--   * 008 仅添加了 consent_* 字段，profiles 表的 RLS 此前未建
--   * /api/user/invite/reward 依赖 profiles.invited_by / reward_claimed
--     两个字段（前端已通过 008 的兜底逻辑兼容缺失）
--   * 002 已废弃（被 010 的 user_activities 替代），编号空出 002
--     留给"未来需要时再补"，本文件占用 007 保持编号连续
--
-- 幂等：所有 ALTER / CREATE 都用 IF NOT EXISTS，policy 用 DROP IF EXISTS
-- ============================================================

-- 1) profiles 邀请字段
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS invited_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reward_claimed  boolean     NOT NULL DEFAULT false;

-- 2) 索引：加快"我邀请了谁" / "谁邀请了我" 查询
CREATE INDEX IF NOT EXISTS idx_profiles_invited_by     ON profiles(invited_by);
CREATE INDEX IF NOT EXISTS idx_profiles_reward_claimed ON profiles(reward_claimed);

-- 3) 字段注释
COMMENT ON COLUMN profiles.invited_by      IS '邀请人 user_id（FK→auth.users.id，邀请奖励链路）';
COMMENT ON COLUMN profiles.reward_claimed  IS '是否已领取邀请奖励（避免重复发放）';

-- 4) profiles 表 RLS 兜底
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all"     ON profiles;
DROP POLICY IF EXISTS "profiles_select_own"     ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"     ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"     ON profiles;

-- 4.1) 公开字段：所有人可读（用于"邀请人 / 同修主页"等展示场景）
CREATE POLICY "profiles_select_all"
  ON profiles FOR SELECT
  USING (true);

-- 4.2) 只能改自己的资料
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 4.3) insert 走 auth trigger（handle_new_user），客户端不允许自插入
-- 显式不创建 INSERT policy → 拒绝任何客户端 insert 尝试

-- 5) 邀请链路完整性：被邀请人写入 invited_by（注册 trigger 或客户端注册时写入）
-- 这里只保证字段存在 + 索引到位，trigger 由后续脚本补
