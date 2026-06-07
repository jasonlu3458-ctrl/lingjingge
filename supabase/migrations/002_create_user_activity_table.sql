-- 创建用户活动记录表
-- 用于记录用户的修行活动数据

create table user_activity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  activity_type text not null, -- 'meditation', 'chat', 'report', 'gongan'
  duration_minutes integer,
  metadata jsonb,
  created_at timestamp with time zone default now()
);

-- 创建索引以提高查询性能
create index idx_user_activity_user_id on user_activity(user_id);
create index idx_user_activity_type on user_activity(activity_type);
create index idx_user_activity_created_at on user_activity(created_at);

-- 启用 RLS (Row Level Security)
alter table user_activity enable row level security;

-- 用户只能查看自己的活动记录
create policy "Users can view their own activity"
  on user_activity for select
  using (auth.uid() = user_id);

-- 用户只能插入自己的活动记录
create policy "Users can insert their own activity"
  on user_activity for insert
  with check (auth.uid() = user_id);

-- 用户只能更新自己的活动记录
create policy "Users can update their own activity"
  on user_activity for update
  using (auth.uid() = user_id);

-- 用户只能删除自己的活动记录
create policy "Users can delete their own activity"
  on user_activity for delete
  using (auth.uid() = user_id);