-- 用户文章/小说表（牧心堂个人创作）
CREATE TABLE IF NOT EXISTS public.muxintang_user_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'article' CHECK (type IN ('article', 'novel', 'poem', 'essay')),
  category text NOT NULL DEFAULT 'life',
  title text NOT NULL,
  content text,
  summary text,
  cover_image text,
  word_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_muxintang_user_articles_user ON public.muxintang_user_articles(user_id);
CREATE INDEX idx_muxintang_user_articles_tenant ON public.muxintang_user_articles(tenant_id);
CREATE INDEX idx_muxintang_user_articles_status ON public.muxintang_user_articles(status);

-- 启用 RLS
ALTER TABLE public.muxintang_user_articles ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的文章
CREATE POLICY "Users can view own articles"
  ON public.muxintang_user_articles
  FOR SELECT
  USING (user_id = auth.uid());

-- 用户只能创建自己的文章
CREATE POLICY "Users can create own articles"
  ON public.muxintang_user_articles
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 用户只能更新自己的文章
CREATE POLICY "Users can update own articles"
  ON public.muxintang_user_articles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 用户只能删除自己的文章
CREATE POLICY "Users can delete own articles"
  ON public.muxintang_user_articles
  FOR DELETE
  USING (user_id = auth.uid());
