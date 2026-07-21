-- ==============================================
-- 005_community_seed_support.sql
-- 同修社区：内容填充 + AI 回帖所需的全部 schema 变更
--
-- 一次性跑完即可。已用 IF NOT EXISTS / DROP IF EXISTS 保证幂等。
--
-- 跑完后能实现：
--   1. topics 表支持置顶、每日参究、每周话题、新手必读分类
--   2. topics 表支持回帖（parent_topic_id + is_ai_reply）
--   3. 任何客户端（含 anon）都能读写 topics（社区是开放论坛）
--   4. user_id 允许为空（系统账号帖子不需要关联用户）
-- ==============================================

-- 1) 字段补全
ALTER TABLE topics ADD COLUMN IF NOT EXISTS tag             text        DEFAULT '心得';
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_pinned       boolean     DEFAULT false;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_daily         boolean     DEFAULT false;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_weekly        boolean     DEFAULT false;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_guide         boolean     DEFAULT false;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS parent_topic_id  bigint      DEFAULT NULL;
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_ai_reply      boolean     DEFAULT false;

-- 2) user_id 允许为空（系统帖不需绑定用户）
ALTER TABLE topics ALTER COLUMN user_id DROP NOT NULL;

-- 3) 索引
CREATE INDEX IF NOT EXISTS idx_topics_is_pinned       ON topics(is_pinned);
CREATE INDEX IF NOT EXISTS idx_topics_is_daily        ON topics(is_daily);
CREATE INDEX IF NOT EXISTS idx_topics_is_weekly       ON topics(is_weekly);
CREATE INDEX IF NOT EXISTS idx_topics_is_guide        ON topics(is_guide);
CREATE INDEX IF NOT EXISTS idx_topics_parent          ON topics(parent_topic_id);
CREATE INDEX IF NOT EXISTS idx_topics_created_at      ON topics(created_at DESC);

-- 4) RLS 策略：开放社区（任何人可读、可写、可改、可删）
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "topics_select_all"  ON topics;
DROP POLICY IF EXISTS "topics_insert_all"  ON topics;
DROP POLICY IF EXISTS "topics_update_all"  ON topics;
DROP POLICY IF EXISTS "topics_delete_all"  ON topics;

CREATE POLICY "topics_select_all"
  ON topics FOR SELECT
  USING (true);

CREATE POLICY "topics_insert_all"
  ON topics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "topics_update_all"
  ON topics FOR UPDATE
  USING (true);

CREATE POLICY "topics_delete_all"
  ON topics FOR DELETE
  USING (true);

-- 5) 字段注释
COMMENT ON COLUMN topics.tag             IS 'AI识别的分类：问卦/心得/求助/分享';
COMMENT ON COLUMN topics.is_pinned       IS '是否置顶';
COMMENT ON COLUMN topics.is_daily        IS '是否为每日参究';
COMMENT ON COLUMN topics.is_weekly       IS '是否为每周话题';
COMMENT ON COLUMN topics.is_guide        IS '是否为新手必读';
COMMENT ON COLUMN topics.parent_topic_id IS '回复哪条主帖（NULL=主帖）';
COMMENT ON COLUMN topics.is_ai_reply     IS '是否为AI自动回帖';

-- 跑完后请刷新 PostgREST schema cache：
--   在 Supabase 控制台 → Project Settings → API → "Reload schema"
-- 或调一次：NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload schema';
