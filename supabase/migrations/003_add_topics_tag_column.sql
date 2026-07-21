-- 为 topics 表添加分类标签字段
-- 用于存储AI识别的帖子分类

-- 添加 tag 字段
ALTER TABLE topics ADD COLUMN IF NOT EXISTS tag text DEFAULT '心得';

-- 创建索引以提高按标签查询的性能
CREATE INDEX IF NOT EXISTS idx_topics_tag ON topics(tag);

-- 添加注释
COMMENT ON COLUMN topics.tag IS 'AI识别的帖子分类：问卦/心得/求助/分享';