export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * 社区 AI 自动回帖 API
 *
 * 调用流程：
 * 1. 客户端发布新帖成功后，POST 到本接口（带 topicId 或 title/content/tag）
 * 2. 本接口调用 /api/dify/community (auto-reply) 拿到 AI 鼓励回复
 * 3. 把回复作为一条 child topic 写回 topics 表（is_ai_reply=true, parent_topic_id=原帖 id）
 *
 * 设计要点：
 * - 完全异步：失败也不影响原帖发布
 * - 系统账号 user_id 用全零 UUID（需要 migration 005 让 user_id 可空）
 * - 不阻塞用户操作：超时 8 秒保护
 * - 用原生 fetch 调 PostgREST，绕开 supabase-js header 校验问题
 */

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

interface AutoReplyBody {
  // 二选一：传 topicId 自动查帖子
  topicId?: number;
  // 或直接传帖子内容
  title?: string;
  content?: string;
  tag?: string;
  // 可选：作者昵称（用于"@xxx"称呼）
  authorName?: string;
}

interface DifyCommunityResponse {
  success?: boolean;
  result?: string;
  error?: string;
}

interface TopicRow {
  id: number;
  title: string;
  content: string;
  tag: string | null;
  user_id: string | null;
}

function restHeaders(): Record<string, string> {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return {
    'apikey': key || '',
    'Authorization': `Bearer ${key || ''}`,
    'Content-Type': 'application/json',
  };
}

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'Supabase 未配置' }, { status: 503 });
  }

  let body: AutoReplyBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: '请求体不是合法 JSON' }, { status: 400 });
  }

  // 1) 拿帖子内容
  let title = body.title || '';
  let content = body.content || '';
  let tag = body.tag || '心得';
  let parentId = body.topicId;

  if (parentId && !title) {
    try {
      const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/topics?select=id,title,content,tag,user_id&id=eq.${parentId}&limit=1`;
      const r = await fetch(url, { method: 'GET', headers: restHeaders() });
      if (!r.ok) {
        return NextResponse.json(
          { error: `未找到主帖：${r.status}` },
          { status: 404 }
        );
      }
      const rows: TopicRow[] = await r.json();
      if (!rows.length) {
        return NextResponse.json({ error: '主帖不存在' }, { status: 404 });
      }
      title = rows[0].title;
      content = rows[0].content;
      tag = rows[0].tag || '心得';
    } catch (e) {
      return NextResponse.json(
        { error: `查询主帖失败：${e instanceof Error ? e.message : 'unknown'}` },
        { status: 500 }
      );
    }
  }

  if (!title.trim() || !content.trim()) {
    return NextResponse.json(
      { error: '缺少 title / content' },
      { status: 400 }
    );
  }

  // 2) 调 Dify 拿回复
  let replyText = '';
  try {
    const difyBase = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const ctrl = new AbortController();
    const timeoutId = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(`${difyBase}/api/dify/community`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'auto-reply',
        content: { title, body: content, tag },
      }),
      signal: ctrl.signal,
    });
    clearTimeout(timeoutId);
    const data: DifyCommunityResponse = await r.json();
    replyText = (data.result || '').trim();
  } catch (e) {
    return NextResponse.json(
      { error: `AI 回帖失败：${e instanceof Error ? e.message : 'unknown'}` },
      { status: 502 }
    );
  }

  if (!replyText) {
    return NextResponse.json(
      { error: 'AI 回帖内容为空' },
      { status: 502 }
    );
  }

  // 3) 写回 topics（作为 AI 回帖）
  try {
    const insertUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/topics`;
    const insertPayload: Record<string, unknown> = {
      user_id: null,
      title: `[AI 回复] ${title.slice(0, 20)}`,
      content: replyText,
      tag: tag,
      is_ai_reply: true,
      created_at: new Date().toISOString(),
    };
    if (parentId) insertPayload.parent_topic_id = parentId;

    const insRes = await fetch(insertUrl, {
      method: 'POST',
      headers: { ...restHeaders(), 'Prefer': 'return=representation' },
      body: JSON.stringify(insertPayload),
    });

    if (!insRes.ok) {
      const errText = await insRes.text();
      return NextResponse.json(
        { error: `写入 AI 回帖失败：${insRes.status} ${errText.slice(0, 200)}` },
        { status: 500 }
      );
    }

    const rows = await insRes.json();
    return NextResponse.json({ success: true, reply: rows[0] });
  } catch (e) {
    return NextResponse.json(
      { error: `写入失败：${e instanceof Error ? e.message : 'unknown'}` },
      { status: 500 }
    );
  }
}
