ALTER TABLE IF EXISTS muxintang_articles 
ADD COLUMN IF NOT EXISTS free_chapter_count INT DEFAULT 0;

ALTER TABLE IF EXISTS muxintang_articles 
ADD COLUMN IF NOT EXISTS price_per_chapter DECIMAL(10,2) DEFAULT 0;

ALTER TABLE IF EXISTS muxintang_articles 
ADD COLUMN IF NOT EXISTS series_id UUID;

ALTER TABLE IF EXISTS muxintang_articles 
ADD COLUMN IF NOT EXISTS chapter_index INT;

ALTER TABLE IF EXISTS muxintang_articles 
ADD COLUMN IF NOT EXISTS article_id TEXT;

CREATE TABLE IF NOT EXISTS content_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  article_id UUID REFERENCES muxintang_articles(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP DEFAULT NOW(),
  type TEXT DEFAULT 'single'
);

CREATE INDEX IF NOT EXISTS idx_content_purchases_user ON content_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_content_purchases_article ON content_purchases(article_id);
CREATE INDEX IF NOT EXISTS idx_content_purchases_tenant ON content_purchases(tenant_id);

ALTER TABLE content_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "content_purchases_select_own"
  ON content_purchases FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "content_purchases_select_admin"
  ON content_purchases FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "content_purchases_insert_authenticated"
  ON content_purchases FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

NOTIFY pgrst, 'reload schema';
