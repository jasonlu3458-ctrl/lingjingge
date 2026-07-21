export async function callDifyForTool(
  type: string,
  inputs: Record<string, any>,
  query: string,
  user: string = 'muxintang-user'
): Promise<string> {
  try {
    const response = await fetch('http://localhost:3000/api/dify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': 'muxintang',
      },
      body: JSON.stringify({
        type,
        inputs,
        query,
        user,
      }),
    });

    if (!response.ok) {
      throw new Error(`Dify 请求失败: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.split('\n');
    let fullAnswer = '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const json = JSON.parse(line.slice(6));
          if (json.event === 'message' || json.event === 'agent_message') {
            if (typeof json.answer === 'string') {
              fullAnswer += json.answer;
            } else if (typeof json.content === 'string') {
              fullAnswer += json.content;
            }
          }
        } catch {
          // ignore parse errors for non-JSON lines
        }
      }
    }

    return fullAnswer.trim() || '阿阇梨正在观照，请稍候再试。';
  } catch (error) {
    console.error('Dify 调用失败:', error);
    return '阿阇梨正在观照，请稍候再试。';
  }
}
