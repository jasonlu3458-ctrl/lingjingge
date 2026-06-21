-- ============================================================
-- 009_user_coins.sql —— 灵境币（每日签到奖励体系）
-- 目标：每天登录 / 进入同修 → 签到 +10 灵境币
-- 字段：余额 + 最后签到日期（用于去重）
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_coins (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance         int         NOT NULL DEFAULT 0 CHECK (balance >= 0),
  last_sign_in_date date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  -- 一位用户只能拥有一行"钱包"
  CONSTRAINT user_coins_user_unique UNIQUE (user_id)
);

-- 索引：加快按 user_id 查余额
CREATE INDEX IF NOT EXISTS idx_user_coins_user_id ON public.user_coins (user_id);

-- updated_at 自动维护
CREATE OR REPLACE FUNCTION public.user_coins_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_coins_updated_at ON public.user_coins;
CREATE TRIGGER trg_user_coins_updated_at
  BEFORE UPDATE ON public.user_coins
  FOR EACH ROW
  EXECUTE FUNCTION public.user_coins_set_updated_at();

-- ============================================================
-- RLS（行级安全）：用户只能读写自己的钱包
-- ============================================================
ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_coins_select_own" ON public.user_coins;
CREATE POLICY "user_coins_select_own"
  ON public.user_coins
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_coins_insert_own" ON public.user_coins;
CREATE POLICY "user_coins_insert_own"
  ON public.user_coins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_coins_update_own" ON public.user_coins;
CREATE POLICY "user_coins_update_own"
  ON public.user_coins
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 注释
COMMENT ON TABLE  public.user_coins                  IS '灵境币钱包：每日签到 +10，未来可兑换 AI 次数 / 特殊报告';
COMMENT ON COLUMN public.user_coins.balance          IS '当前灵境币余额';
COMMENT ON COLUMN public.user_coins.last_sign_in_date IS '最近一次签到日期（YYYY-MM-DD），用于去重';
