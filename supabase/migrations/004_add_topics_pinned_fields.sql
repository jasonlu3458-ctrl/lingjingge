-- 为 topics 表添加置顶和每日话题字段

-- 添加 is_pinned 字段（置顶标记）
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- 添加 is_daily 字段（每日话题标记）
ALTER TABLE topics ADD COLUMN IF NOT EXISTS is_daily boolean DEFAULT false;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_topics_is_pinned ON topics(is_pinned);
CREATE INDEX IF NOT EXISTS idx_topics_is_daily ON topics(is_daily);

-- 添加注释
COMMENT ON COLUMN topics.is_pinned IS '是否置顶';
COMMENT ON COLUMN topics.is_daily IS '是否为每日话题';