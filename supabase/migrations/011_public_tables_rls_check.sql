-- ============================================================
-- 011_public_tables_rls_check.sql
-- 兜底：确保所有 public 表均已开启 RLS
-- 配合 001/005/007/009/010 中已声明的 RLS，本文件作为线上巡检后的"修整"脚本
-- 幂等：ENABLE 是幂等操作
-- ============================================================

-- articles：001 已开启（兜底再开一次）
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- topics：005 已开启
ALTER TABLE topics   ENABLE ROW LEVEL SECURITY;

-- profiles：007 已开启
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- user_coins：009 已开启
ALTER TABLE user_coins      ENABLE ROW LEVEL SECURITY;

-- user_activities：010 已开启
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- chat_messages / subscriptions / checkins / user_points / report_purchases /
-- promotion_configs / free_turns 由各表自身迁移保证（006/008），此处仅兜底
ALTER TABLE IF EXISTS chat_messages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS checkins          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_points       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS report_purchases  ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS promotion_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS free_turns        ENABLE ROW LEVEL SECURITY;

-- 提示：刷新 PostgREST schema cache
NOTIFY pgrst, 'reload schema';
