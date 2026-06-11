-- ==============================================
-- 006_add_articles_translation.sql
-- 藏经阁：经典白话翻译字段
--
-- 为 articles 表新增 translation 字段，存 Dify 经典白话文翻译助手
-- 生成的现代汉语译文，供藏经阁页面调用。
-- ==============================================

ALTER TABLE articles ADD COLUMN IF NOT EXISTS translation text DEFAULT NULL;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS translated_at timestamp with time zone DEFAULT NULL;

-- 注释
COMMENT ON COLUMN articles.translation  IS '经典白话文翻译（由 Dify 应用生成）';
COMMENT ON COLUMN articles.translated_at IS '翻译生成时间';

-- 索引：方便快速筛选"已翻译 / 未翻译"
CREATE INDEX IF NOT EXISTS idx_articles_translated_at ON articles(translated_at DESC);
