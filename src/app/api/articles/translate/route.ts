export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * 经典白话文翻译（批量）
 *
 * 为 articles 表中 source = '老子' 的所有条目（即《道德经》81 章）
 * 调用 Dify "经典白话文翻译助手" 应用，逐条生成白话译文并写回
 * articles.translation / translated_at 字段。
 *
 * 用法：
 *   POST /api/articles/translate
 *   Header: x-translate-secret: $TRANSLATE_SECRET  （可选，环境变量配置了才校验）
 *   Body（可选）：{ "source": "老子", "dryRun": true, "limit": 5 }
 *
 * 环境变量（必填）：
 *   DIFY_API_KEY              Dify 应用的 API Key
 *   DIFY_TRANSLATE_APP_ID     Dify "经典白话文翻译助手" 应用 ID（应用 URL 末尾那段）
 *   SUPABASE_SERVICE_ROLE_KEY  Supabase service role key（用于绕过 RLS 写入）
 *   NEXT_PUBLIC_SUPABASE_URL  Supabase URL
 *
 * 安全：
 *   - 默认仅翻译 translation IS NULL 的条目，避免重复调用浪费 Dify 额度
 *   - 设了 TRANSLATE_SECRET 时校验请求头
 *   - 单次上限 limit 默认 5（防止一次打爆 Dify 配额）
 */

interface DifyChatRequest {
  inputs: Record<string, string>;
  query: string;
  user: string;
  response_mode: 'streaming' | 'blocking';
}

interface DifyChatResponse {
  answer?: string;
  message?: string;
}

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  content: string;
  translation: string | null;
}

interface TranslateResult {
  slug: string;
  status: 'translated' | 'skipped' | 'failed' | 'dry-run';
  reason?: string;
  translationPreview?: string;
}

async function callDifyTranslate(title: string, content: string, userId: string): Promise<string> {
  const apiKey = process.env.DIFY_API_KEY;
  const appId = process.env.DIFY_TRANSLATE_APP_ID;

  if (!apiKey || !appId) {
    throw new Error('DIFY_API_KEY / DIFY_TRANSLATE_APP_ID 未配置');
  }

  const url = `https://api.dify.ai/v1/chat-messages`;
  const body: DifyChatRequest = {
    inputs: {
      title,
      original_text: content,
    },
    query: `请将以下经典原文翻译成通俗易懂的现代白话文：\n\n【篇目】${title}\n\n【原文】\n${content}\n\n请直接输出白话译文，不要加"译文："等前缀。`,
    user: userId,
    response_mode: 'blocking',
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dify 调用失败 ${res.status}: ${text.slice(0, 300)}`);
  }

  const data = (await res.json()) as DifyChatResponse;
  const answer = data.answer || data.message;
  if (!answer) {
    throw new Error('Dify 返回为空');
  }
  return answer.trim();
}

async function fetchLaoziArticles(
  supabaseUrl: string,
  serviceKey: string,
  source: string,
  onlyUntranslated: boolean,
  limit: number
): Promise<ArticleRow[]> {
  // PostgREST 过滤：source=eq.老子，可选 translation=is.null
  const filters = [`source=eq.${encodeURIComponent(source)}`];
  if (onlyUntranslated) filters.push('translation=is.null');
  const url = `${supabaseUrl}/rest/v1/articles?select=id,slug,title,content,translation&${filters.join('&')}&order=created_at.asc&limit=${limit}`;

  const res = await fetch(url, {
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`查询 articles 失败 ${res.status}: ${text.slice(0, 300)}`);
  }

  return (await res.json()) as ArticleRow[];
}

async function saveTranslation(
  supabaseUrl: string,
  serviceKey: string,
  id: string,
  translation: string
): Promise<void> {
  const url = `${supabaseUrl}/rest/v1/articles?id=eq.${id}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      translation,
      translated_at: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`写入 translation 失败 ${res.status}: ${text.slice(0, 300)}`);
  }
}

export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Supabase URL / Service Role Key 未配置' },
      { status: 503 }
    );
  }

  // 安全：可选密钥校验
  const expected = process.env.TRANSLATE_SECRET;
  if (expected) {
    const got = req.headers.get('x-translate-secret') || '';
    if (got !== expected) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // 解析入参
  let body: { source?: string; dryRun?: boolean; limit?: number; force?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // 允许空 body
  }
  const source = body.source || '老子';
  const dryRun = body.dryRun === true;
  const limit = Math.min(Math.max(body.limit ?? 5, 1), 81);
  const onlyUntranslated = body.force !== true; // force=true 时重译已有译文

  try {
    const articles = await fetchLaoziArticles(supabaseUrl, serviceKey, source, onlyUntranslated, limit);

    if (articles.length === 0) {
      return NextResponse.json({
        success: true,
        message: `没有需要翻译的${source}条目（仅未翻译: ${onlyUntranslated}）`,
        summary: { total: 0, translated: 0, skipped: 0, failed: 0, dryRun },
        results: [],
      });
    }

    const results: TranslateResult[] = [];
    let translated = 0;
    let skipped = 0;
    let failed = 0;

    for (const a of articles) {
      // 兜底：内容为空 / 已翻译
      if (!a.content || a.content.trim().length < 4) {
        results.push({ slug: a.slug, status: 'skipped', reason: '原文过短' });
        skipped++;
        continue;
      }

      if (dryRun) {
        results.push({
          slug: a.slug,
          status: 'dry-run',
          translationPreview: `将翻译：${a.title} (${a.content.length} 字)`,
        });
        continue;
      }

      try {
        const translation = await callDifyTranslate(a.title, a.content, `translate-${a.id}`);
        await saveTranslation(supabaseUrl, serviceKey, a.id, translation);
        results.push({
          slug: a.slug,
          status: 'translated',
          translationPreview: translation.slice(0, 60) + (translation.length > 60 ? '…' : ''),
        });
        translated++;
      } catch (e) {
        results.push({
          slug: a.slug,
          status: 'failed',
          reason: e instanceof Error ? e.message : 'unknown',
        });
        failed++;
      }
    }

    return NextResponse.json({
      success: failed === 0,
      summary: {
        total: articles.length,
        translated,
        skipped,
        failed,
        dryRun,
        onlyUntranslated,
      },
      results,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}

// GET：仅预览待翻译的条目
export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json(
      { error: 'Supabase URL / Service Role Key 未配置' },
      { status: 503 }
    );
  }

  const source = req.nextUrl.searchParams.get('source') || '老子';
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') || 5), 81);

  try {
    const articles = await fetchLaoziArticles(supabaseUrl, serviceKey, source, true, limit);
    return NextResponse.json({
      message: `POST 到本接口可批量翻译${source}类目下未翻译的条目`,
      source,
      pending: articles.length,
      articles: articles.map(a => ({
        slug: a.slug,
        title: a.title,
        contentLength: a.content.length,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 }
    );
  }
}
