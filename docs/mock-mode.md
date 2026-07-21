# 本地 Mock 模式 · 测试指南

用于在没连真实 Supabase 的情况下，本地验证 **今日禅机** 与 **对话持久化**。

---

## 1. 启动

```bash
npm run dev
# 浏览器打开 http://localhost:3000
```

`.env.local` 已设置：
```
NEXT_PUBLIC_USE_MOCK_SUPABASE=true
```
开启后，Supabase 客户端全部走内存 mock（数据存 localStorage），不需要真实 Supabase 项目。

> 关闭 mock：把这一行改成 `false` 或删掉，dev server 重启即生效。

---

## 2. 验证「今日禅机」

打开 http://localhost:3000 ，滚到第二屏（标题下方约 1.2s 出现）。

应该看到：
- 干支日期：「丙午年×月×日 · 灵境尊者言」
- 主句：「应无所住而生其心」
- 出处：「——《金刚经》」
- 两个按钮：「📖 参读藏经」「🧘 开启对话 →」

如果首屏没有文字，等约 1.5s 即可（页面有进场动画）。

---

## 3. 验证「对话持久化」

### 步骤 1 — 注入演示数据

打开浏览器开发者工具 Console，执行：

```js
mockSupabase.seedDemo()
```

返回 3 条 mock 消息。刷新页面（Ctrl+R）后进任一带对话的页面（/neiguan 等），
应该看到 3 条历史气泡自动显示出来——证明**从 Supabase 拉取历史**的链路通了。

### 步骤 2 — 真实发送一条

在对话页输入一句话并发送，再开 Console：

```js
mockSupabase.listMessages()
```

会看到 `console.table` 打印的消息列表——包含你刚发的那条 + AI 回复。证明**写入 Supabase** 的链路通了。

### 步骤 3 — 刷新页面

Ctrl+R 刷新，整段对话应依然在。证明 **localStorage 兜底** 也通了（即使 mock 模式清空 Supabase 数据，localStorage 里仍有）。

### 步骤 4 — 跨会话持久

Console 改 chat_type 再注入一条：

```js
mockSupabase.pushMessage({
  role: 'user',
  content: '隔夜测试',
  chat_type: 'jiejue',
  conversation_id: 'conv-x'
})
```

再开 `/jiejue` 页面，应能看到这条。说明 `conversation_id` + `chat_type` 二维隔离生效。

### 步骤 5 — 清空

```js
mockSupabase.clear()
```

刷新页面，所有历史都没了。

---

## 4. Console 工具一览

| 命令 | 作用 |
|---|---|
| `mockSupabase.whoAmI()` | 打印 mock 用户（`mock-user-001`） |
| `mockSupabase.seedDemo()` | 注入 3 条 `conv-demo-001` 演示消息 |
| `mockSupabase.listMessages()` | console.table 打印所有 mock 消息 |
| `mockSupabase.pushMessage({...})` | 手动注入一条 |
| `mockSupabase.clear()` | 清空所有 mock 消息 |

> 数据存在 localStorage key `mock_chat_messages_v1`，DevTools → Application → Local Storage 可看原始 JSON。

---

## 5. 自检：Supabase 配置是否被 mock 接管

Console 跑：

```js
// 1) isSupabaseConfigured() 应返回 true
fetch('/api/_dev-check').catch(()=>null)  // 占位，无此 endpoint
// 2) 直接看环境变量是否生效
console.log(process?.env?.NEXT_PUBLIC_USE_MOCK_SUPABASE)  // 浏览器拿不到

// 替代方法：看 Console 是否打印了
//   [mockSupabase] 已启用
// （useEffect mount 后立即出现）
```

或者检查 Network 请求：进入对话页时**不应**有 `*.supabase.co` 域名请求，只有本地的 `/api/dify` 之类。

---

## 6. 切回真实 Supabase

1. `.env.local` 把 `NEXT_PUBLIC_USE_MOCK_SUPABASE=true` 改为 `false`（或注释掉）
2. 确认 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是真实值
3. Supabase 后台执行 `supabase/migrations/009_chat_messages.sql`（见 README）
4. 重启 dev server
5. 重新登录后即可看到跨设备同步的对话历史
