-- 010_user_activities.sql
-- 修行日历：记录用户每日活跃行为（签到 / 打坐 / 提问 / 报告生成等）
-- 用于驱动 /tong/profile 的 GitHub 风格热力图

CREATE TABLE IF NOT EXISTS user_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,           -- 'sign_in' | 'meditation' | 'ask' | 'report' | 'check_in' ...
  activity_date date NOT NULL DEFAULT CURRENT_DATE,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 同一用户同一日同类型只保留一条（去重）
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_activities_dedup
  ON user_activities(user_id, activity_date, activity_type);

-- 加速日历热力图查询
CREATE INDEX IF NOT EXISTS idx_user_activities_user_date
  ON user_activities(user_id, activity_date DESC);

-- RLS：仅本人可读 / 写
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_activities_select_own" ON user_activities;
CREATE POLICY "user_activities_select_own"
  ON user_activities FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_activities_insert_own" ON user_activities;
CREATE POLICY "user_activities_insert_own"
  ON user_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_activities_update_own" ON user_activities;
CREATE POLICY "user_activities_update_own"
  ON user_activities FOR UPDATE
  USING (auth.uid() = user_id);
