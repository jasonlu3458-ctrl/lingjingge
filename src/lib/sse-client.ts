// ============================================================
// Dify SSE 客户端 —— 通用流式消费工具
// ============================================================
// 协议：透传 Dify /v1/chat-messages 的 SSE 输出
//   事件：message（带 answer）、message_end、error
//   协议：data: {json}\n\n
//   收尾：服务端关闭连接 = 流结束
//
// 适用于 /api/{house,education,marriage,...}/polish 全部走 Dify streaming 的端点
// ============================================================

export interface DifySSEHandlers {
  /** 每次流式增量回调（已拼接的全文） */
  onDelta: (acc: string) => void;
  /** 流结束时回调：source='dify' 或 'local-template'（降级） */
  onEnd: (info: { source: 'dify' | 'local-template'; error?: string }) => void;
  /** 不可恢复的传输错误 */
  onError: (err: string) => void;
}

/**
 * 消费一个 SSE Response，解析 Dify 流式数据并累加 answer。
 * 自动忽略非 message 事件，message_end 时根据 metadata.fallback 切换 source。
 */
export async function consumeDifySSE(res: Response, h: DifySSEHandlers): Promise<void> {
  const reader = res.body?.getReader();
  if (!reader) {
    h.onError('response body is empty');
    return;
  }
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let acc = '';
  let lastError = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE 事件以 \n\n 分隔
      let idx: number;
      while ((idx = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 2);

        for (const line of rawEvent.split('\n')) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;

          try {
            const obj = JSON.parse(payload);
            if (obj.event === 'message' && typeof obj.answer === 'string') {
              acc += obj.answer;
              h.onDelta(acc);
            } else if (obj.event === 'message_end') {
              if (obj.metadata?.fallback) {
                lastError = obj.metadata.error || lastError;
                h.onEnd({ source: 'local-template', error: lastError });
              } else {
                h.onEnd({ source: 'dify' });
              }
            } else if (obj.event === 'error') {
              lastError = obj.message || 'stream error';
            }
          } catch {
            /* 忽略非 JSON 行（keepalive / ping） */
          }
        }
      }
    }

    // 流自然结束但没有 message_end 事件（Dify 偶发）
    if (acc && !lastError) h.onEnd({ source: 'dify' });
  } catch (err) {
    h.onError(err instanceof Error ? err.message : 'stream read failed');
  } finally {
    reader.releaseLock();
  }
}

/**
 * 一站式：根据 Response.content-type 分流。
 *   - text/event-stream → SSE 消费
 *   - 其他 → JSON 降级包
 */
export async function handleDifyPolishResponse(
  res: Response,
  setters: {
    setPolished: (s: string) => void;
    setPolishSource: (s: string) => void;
    setErrorMsg: (s: string) => void;
  }
): Promise<void> {
  const contentType = res.headers.get('content-type') || '';

  if (contentType.includes('text/event-stream') && res.body) {
    await consumeDifySSE(res, {
      onDelta: setters.setPolished,
      onEnd: ({ source, error }) => {
        setters.setPolishSource(source);
        if (error) setters.setErrorMsg(error);
      },
      onError: setters.setErrorMsg,
    });
    return;
  }

  // JSON 降级路径（Dify 失败 / 本地模板）
  try {
    const json = await res.json();
    if (!json.success) {
      setters.setErrorMsg(json.error || '润色失败');
      return;
    }
    setters.setPolished(json.polished || '');
    setters.setPolishSource(json.source || 'local-template');
  } catch (err) {
    setters.setErrorMsg(err instanceof Error ? err.message : '响应解析失败');
  }
}
