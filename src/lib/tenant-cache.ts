// ============================================================
// src/lib/tenant-cache.ts
// 进程内 LRU 缓存（手动 Map LRU，edge runtime 兼容，无外部依赖）
// ------------------------------------------------------------
//  - TTL 5 分钟，最多 100 个 key，超出时淘汰最久未使用。
//  - 支持缓存 null（用于显式标记"已查过但不存在"，避免击穿）。
//  - 与 src/middleware.ts 中原有 LRU 模式一致，便于复用。
// ============================================================

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX = 100;

export interface LRUCacheEntry<T> {
  value: T | null;
  expiresAt: number;
}

export class LRUCache<T> {
  private store = new Map<string, LRUCacheEntry<T>>();

  /**
   * 读取缓存。命中且未过期返回 value；命中但已过期返回 undefined；
   * 未命中返回 undefined。
   */
  get(key: string): T | null | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    // LRU touch: 重新插入以更新访问顺序
    this.store.delete(key);
    this.store.set(key, entry);
    return entry.value;
  }

  /**
   * 写入缓存。当达到上限时淘汰最久未使用的 key（Map 迭代顺序为插入顺序）。
   * 允许 value 为 null，用于显式标记"已查过但不存在"。
   */
  set(key: string, value: T | null): void {
    if (this.store.size >= CACHE_MAX) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) this.store.delete(firstKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  /**
   * 判断 key 是否存在（且未过期）。即使 value 为 null 也会返回 true。
   */
  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /**
   * 主动删除某个 key（用于租户配置更新后的失效）。
   */
  delete(key: string): void {
    this.store.delete(key);
  }
}
