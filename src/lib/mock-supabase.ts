/**
 * 本地 Mock Supabase 客户端
 *
 * 用途：在不连真实 Supabase 项目的情况下，让「对话持久化」/「用户角色」等
 *       客户端代码走完 mock 流程，方便在本地联调。
 *
 * 启用方式（.env.local）：
 *   NEXT_PUBLIC_USE_MOCK_SUPABASE=true
 *
 * 浏览器 Console 调试工具：
 *   window.mockSupabase.seedDemo()        // 注入 3 条 mock 消息
 *   window.mockSupabase.clear()           // 清空 mock 数据
 *   window.mockSupabase.whoAmI()          // 打印 mock 用户
 *   window.mockSupabase.listMessages()    // 打印所有 mock 消息
 *   window.mockSupabase.pushMessage({...})// 手动注入一条
 */

export const MOCK_USER_ID = 'mock-user-001';
export const MOCK_USER_EMAIL = 'tester@lingjingge.local';
const LS_MESSAGES_KEY = 'mock_chat_messages_v1';

export interface MockMessage {
  id: string;
  user_id: string;
  conversation_id: string;
  chat_type: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

function readStore(): MockMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(LS_MESSAGES_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeStore(items: MockMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LS_MESSAGES_KEY, JSON.stringify(items));
  } catch {
    /* ignore quota */
  }
}

export function isMockSupabaseEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const flag = (process as any)?.env?.NEXT_PUBLIC_USE_MOCK_SUPABASE;
  return flag === 'true' || flag === '1';
}

export function getMockUser() {
  return {
    id: MOCK_USER_ID,
    email: MOCK_USER_EMAIL,
    user_metadata: { name: '本地测试用户' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };
}

/**
 * 构造一个最小可用的 queryBuilder mock，覆盖 useAIChat 实际用到的链式调用：
 *   .from('chat_messages').select('id, role, content, created_at')
 *   .eq('user_id', x).eq('conversation_id', x).eq('chat_type', x)
 *   .order('created_at', { ascending: true })
 *   .from('chat_messages').insert({...})
 */
function buildMessagesQuery() {
  const filters: Array<(m: MockMessage) => boolean> = [];
  let order: { col: string; asc: boolean } | null = null;

  const exec = async () => {
    const all = readStore();
    let rows = all.filter((m) => filters.every((f) => f(m)));
    if (order) {
      rows = [...rows].sort((a, b) => {
        const av = (a as any)[order!.col];
        const bv = (b as any)[order!.col];
        if (av < bv) return order!.asc ? -1 : 1;
        if (av > bv) return order!.asc ? 1 : -1;
        return 0;
      });
    }
    return { data: rows, error: null };
  };

  const builder: any = {
    select() {
      return builder;
    },
    eq(col: string, val: any) {
      filters.push((m) => (m as any)[col] === val);
      return builder;
    },
    order(col: string, opts: { ascending?: boolean } = {}) {
      order = { col, asc: opts.ascending !== false };
      return builder;
    },
    single: async () => {
      const { data } = await exec();
      return { data: data?.[0] ?? null, error: null };
    },
    then: (resolve: any, reject: any) => exec().then(resolve, reject),
  };
  return builder;
}

function buildProfilesQuery() {
  // mock: 这个 user 是会员
  return {
    select() {
      return this;
    },
    eq() {
      return this;
    },
    single: async () => ({
      data: { id: MOCK_USER_ID, role: 'member', email: MOCK_USER_EMAIL },
      error: null,
    }),
  } as any;
}

export const mockSupabaseClient: any = {
  auth: {
    getUser: async () => ({ data: { user: getMockUser() }, error: null }),
    getSession: async () => ({
      data: { session: { user: getMockUser(), access_token: 'mock-token' } },
      error: null,
    }),
    signInWithPassword: async () => ({
      data: { user: getMockUser(), session: { access_token: 'mock-token' } },
      error: null,
    }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: (_cb: any) => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
  from(table: string) {
    if (table === 'chat_messages') {
      const q = buildMessagesQuery();
      // 暴露 insert —— useAIChat 调的是 supabase.from('chat_messages').insert(row)
      (q as any).insert = async (row: any) => {
        const all = readStore();
        const newRow: MockMessage = {
          id: row.id ?? `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          user_id: row.user_id,
          conversation_id: row.conversation_id,
          chat_type: row.chat_type,
          role: row.role,
          content: row.content,
          created_at: row.created_at ?? new Date().toISOString(),
        };
        all.push(newRow);
        writeStore(all);
        return { data: [newRow], error: null };
      };
      return q;
    }
    if (table === 'profiles') {
      return buildProfilesQuery();
    }
    // 其他表：返回空结果
    return {
      select() {
        return this;
      },
      eq() {
        return this;
      },
      order() {
        return this;
      },
      single: async () => ({ data: null, error: null }),
      insert: async () => ({ data: null, error: null }),
      then: (resolve: any) => resolve({ data: [], error: null }),
    } as any;
  },
};

/* ============ 浏览器 Console 调试工具 ============ */

export function installMockDevTools(): void {
  if (typeof window === 'undefined') return;
  if (!isMockSupabaseEnabled()) return;
  if ((window as any).__mockInstalled) return;
  (window as any).__mockInstalled = true;

  const api = {
    whoAmI: () => {
      console.log('[mockSupabase] user =', getMockUser());
      return getMockUser();
    },
    listMessages: () => {
      const all = readStore();
      console.log(`[mockSupabase] 共 ${all.length} 条消息：`);
      console.table(all);
      return all;
    },
    clear: () => {
      writeStore([]);
      console.log('[mockSupabase] 已清空消息。刷新页面查看效果。');
    },
    seedDemo: () => {
      const now = Date.now();
      const demo: MockMessage[] = [
        {
          id: `seed-1`,
          user_id: MOCK_USER_ID,
          conversation_id: 'conv-demo-001',
          chat_type: 'neiguan',
          role: 'user',
          content: '我最近很焦虑，晚上经常失眠。',
          created_at: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
        },
        {
          id: `seed-2`,
          user_id: MOCK_USER_ID,
          conversation_id: 'conv-demo-001',
          chat_type: 'neiguan',
          role: 'assistant',
          content: '焦虑常由心念攀缘而起。建议先观呼吸 108 息，让气沉丹田。',
          created_at: new Date(now - 1000 * 60 * 60 * 24 * 2 + 30000).toISOString(),
        },
        {
          id: `seed-3`,
          user_id: MOCK_USER_ID,
          conversation_id: 'conv-demo-001',
          chat_type: 'neiguan',
          role: 'user',
          content: '好的，我试试。',
          created_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(),
        },
      ];
      writeStore(demo);
      console.log('[mockSupabase] 已注入 3 条演示消息。刷新页面查看效果。');
      return demo;
    },
    pushMessage: (m: Partial<MockMessage>) => {
      const all = readStore();
      const row: MockMessage = {
        id: m.id ?? `manual-${Date.now()}`,
        user_id: m.user_id ?? MOCK_USER_ID,
        conversation_id: m.conversation_id ?? 'conv-manual',
        chat_type: m.chat_type ?? 'neiguan',
        role: m.role ?? 'user',
        content: m.content ?? '',
        created_at: m.created_at ?? new Date().toISOString(),
      };
      all.push(row);
      writeStore(all);
      console.log('[mockSupabase] 已写入：', row);
      return row;
    },
  };
  (window as any).mockSupabase = api;
  console.log(
    '%c[mockSupabase] 已启用',
    'color:#0a7; font-weight:bold;',
    '可用命令：mockSupabase.whoAmI() / .listMessages() / .seedDemo() / .clear() / .pushMessage({...})'
  );
}
