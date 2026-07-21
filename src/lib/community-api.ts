/**
 * 社区助手 API 类型定义和调用工具
 */

/**
 * 社区助手功能类型
 */
export type CommunityType = 'classify' | 'knowledge' | 'essence' | 'topic';

/**
 * API 响应格式
 */
export interface CommunityResponse {
  success: boolean;
  type: CommunityType;
  result: string;
  error?: string;
}

/**
 * 调用社区助手的工具函数
 * 
 * @param type - 功能类型：classify（分类）、knowledge（知识库）、essence（精华识别）、topic（话题生成）
 * @param content - 内容（分类内容、知识库问题、帖子内容、日期）
 * @param user - 用户标识（可选）
 * @returns API 响应
 */
export async function callCommunityAssistant(
  type: CommunityType,
  content: string,
  user?: string
): Promise<{ result: string }> {
  const response = await fetch('/api/dify/community', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      content,
      user: user || 'lingjingge-user'
    })
  });

  const data: CommunityResponse = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'API 调用失败');
  }

  return { result: data.result };
}

// ===== 便捷函数 =====

/**
 * 帖子分类
 * @param content - 帖子内容
 * @returns 分类结果（问卦/心得/求助/分享）
 */
export async function classifyPost(content: string): Promise<string> {
  const { result } = await callCommunityAssistant('classify', content);
  return result;
}

/**
 * 知识库问答
 * @param query - 查询问题
 * @returns 回答内容
 */
export async function knowledgeQuery(query: string): Promise<string> {
  const { result } = await callCommunityAssistant('knowledge', query);
  return result;
}

/**
 * 精华识别
 * @param content - 帖子内容
 * @returns 识别结果
 */
export async function checkEssence(content: string): Promise<string> {
  const { result } = await callCommunityAssistant('essence', content);
  return result;
}

/**
 * 生成今日话题
 * @param date - 日期（格式：YYYY-MM-DD）
 * @returns 今日话题
 */
export async function generateTodayTopic(date: string): Promise<string> {
  const { result } = await callCommunityAssistant('topic', date);
  return result;
}
