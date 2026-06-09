-- ==============================================
-- 002_ensure_articles_category_column.sql
-- ==============================================
-- 作用：幂等地确保 articles 表的 category 字段存在
-- 即使 001_create_articles_table.sql 尚未执行也能工作
-- 适合在 Supabase SQL Editor 中独立执行
-- ==============================================

-- 1. 安全添加 category 字段（如果不存在）
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS category text;

-- 2. 重新应用 check 约束（确保枚举值）
DO $$
BEGIN
  -- 删除旧约束（如果存在）
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'articles' AND constraint_name = 'articles_category_check'
  ) THEN
    ALTER TABLE articles DROP CONSTRAINT articles_category_check;
  END IF;
END $$;

-- 添加新的 check 约束
ALTER TABLE articles
ADD CONSTRAINT articles_category_check
CHECK (category IS NULL OR category IN ('classics', 'treasure', 'essay'));

-- 3. 创建索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

-- 4. 数据迁移：将 source='老子' 的文章标记为 classics
UPDATE articles
SET category = 'classics'
WHERE source = '老子' AND category IS NULL;

-- 5. 智能分类其他来源（兜底）
UPDATE articles
SET category = 'classics'
WHERE source IN ('老子', '庄子', '孔子', '孟子', '荀子', '释迦牟尼', '慧能', '达摩', '弘忍')
  AND category IS NULL;

UPDATE articles
SET category = 'treasure'
WHERE source IS NULL AND category IS NULL;

-- 6. 兜底：未分类的都设为 essay
UPDATE articles
SET category = 'essay'
WHERE category IS NULL;

-- 7. 验证
SELECT
  category,
  COUNT(*) AS total
FROM articles
GROUP BY category
ORDER BY category;
