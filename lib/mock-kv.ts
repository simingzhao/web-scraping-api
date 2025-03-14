// Mock KV implementation for local development
class MockKV {
  private store = new Map<string, { value: unknown; expiry?: number }>();

  async get<T>(key: string): Promise<T | null> {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expiry && item.expiry < Date.now()) {
      this.store.delete(key);
      return null;
    }
    
    return item.value as T;
  }

  async set(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
    const expiry = options?.ex ? Date.now() + (options.ex * 1000) : undefined;
    this.store.set(key, { value, expiry });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string): Promise<number> {
    const value = (await this.get<number>(key) || 0) + 1;
    await this.set(key, value);
    return value;
  }
}

// Export a mock KV instance if we're in development and don't have KV credentials
const isLocal = !process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN;
export const kv = isLocal ? new MockKV() : (await import('@vercel/kv')).kv; 