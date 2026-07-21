-- 创建文章表 articles
create table articles (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  content text not null,
  source text,
  category text check (category in ('classics', 'treasure', 'essay')),
  created_at timestamp with time zone default now()
);

-- 创建索引以提升查询性能
create index idx_articles_category on articles(category);
create index idx_articles_slug on articles(slug);
create index idx_articles_created_at on articles(created_at desc);

-- 启用 Row Level Security (RLS) - 可根据需要调整策略
alter table articles enable row level security;

-- 允许所有人读取文章（公开内容）
create policy "Public articles are viewable by everyone"
  on articles for select
  using (true);

-- 只有认证用户可以插入文章
create policy "Authenticated users can insert articles"
  on articles for insert
  with check (auth.role() = 'authenticated');

-- 只有认证用户可以更新文章
create policy "Authenticated users can update articles"
  on articles for update
  using (auth.role() = 'authenticated');

-- 只有认证用户可以删除文章
create policy "Authenticated users can delete articles"
  on articles for delete
  using (auth.role() = 'authenticated');

-- 插入示例数据
insert into articles (slug, title, content, source, category) values 
  ('dao-de-jing-chapter-1', '道德经·第一章', '道可道，非常道；名可名，非常名...', '老子', 'classics'), 
  ('liu-zu-tan-jing-xing-you-pin', '六祖坛经·行由品', '菩提本无树，明镜亦非台...', '慧能', 'classics');
