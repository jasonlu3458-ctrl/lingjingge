# 📋 Supabase SQL 执行指南

## 🎯 你的任务

你提供的 SQL 已经在迁移文件中，但**需要在 Supabase 后台实际执行**才能生效：

```sql
ALTER TABLE articles ADD COLUMN category TEXT;
UPDATE articles SET category = 'classics' WHERE source = '老子';
```

> 💡 **推荐使用改进版**：`002_ensure_articles_category_column.sql`（更安全、幂等、智能分类）

## 📝 执行步骤

### 步骤 1：打开 Supabase 后台
1. 访问：https://supabase.com/dashboard
2. 选择你的项目：`asvgzdhmijygbeuvxlfj`
3. 左侧菜单 → **SQL Editor**

### 步骤 2：新建 Query
点击右上角 **"New query"**

### 步骤 3：粘贴 SQL
**方式 A：使用改进版（推荐）**

打开项目文件 `supabase/migrations/002_ensure_articles_category_column.sql`，复制全部内容，粘贴到 SQL Editor。

**方式 B：使用你的原版**

直接粘贴：
```sql
ALTER TABLE articles ADD COLUMN category TEXT;
UPDATE articles SET category = 'classics' WHERE source = '老子';
```

### 步骤 4：执行
- 点击右下角 **"Run"** 按钮
- 等待执行完成（通常 < 1 秒）

### 步骤 5：验证
执行成功后，刷新页面，运行验证查询：
```sql
SELECT slug, title, source, category FROM articles LIMIT 10;
```

你应该能看到：
- 所有 `source = '老子'` 的记录 `category = 'classics'`
- 字段允许的值为 `'classics'` / `'treasure'` / `'essay'`

## ✅ 已完成的前端修复（无需你操作）

| # | 文件 | 修复内容 |
|---|------|---------|
| 1 | `src/types/supabase.ts` | 修正 articles 类型定义（`id: string`、删除 excerpt/summary、添加 `category`） |
| 2 | `supabase/migrations/002_*.sql` | 创建幂等 SQL 迁移（可重复执行） |

## ⚠️ 字段映射对照

| 旧类型定义 | 实际数据库 | 状态 |
|----------|----------|------|
| `id: number` | `id: uuid` | ✅ 已修正 |
| ❌ `excerpt: string` | 无此字段 | ✅ 已删除 |
| ❌ `summary: string` | 无此字段 | ✅ 已删除 |
| ❌ `author: string` | `source: text` | ✅ 已替换 |
| ❌ `published_at: string` | `created_at: timestamp` | ✅ 已替换 |
| ❌ `status: string` | 无此字段 | ✅ 已删除 |
| ❌ `category` 字段 | `category: text` | ✅ 已添加 |

## 🧪 验证前端是否工作

执行完 SQL 后，访问 http://localhost:3000/zang/library

应该看到：
- ✅ 典籍列表（《道德经》《六祖坛经》等）
- ✅ 术语百科
- ✅ 按 `category = 'classics'` / `category = 'treasure'` 分类显示

## 🆘 遇到错误？

**错误：`relation "articles" does not exist`**
→ 表明 articles 表还没创建，请先执行 `001_create_articles_table.sql`

**错误：`column "category" already exists`**
→ 无害，可忽略（说明字段已存在，SQL 跳过了 ALTER）

**其他错误**
→ 把错误信息发给我，我会帮你解决
