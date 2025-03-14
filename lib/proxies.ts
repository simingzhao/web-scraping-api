import { kv } from './mock-kv';

interface Proxy {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export async function getProxy(): Promise<Proxy | null> {
  try {
    // Get proxies from KV store
    const proxies = await kv.get<Proxy[]>('proxies');
    if (!proxies || proxies.length === 0) {
      return null;
    }

    // Get current index from KV store
    let currentIndex = await kv.get<number>('proxy_index') || 0;
    
    // Get next proxy
    const proxy = proxies[currentIndex];
    
    // Update index
    currentIndex = (currentIndex + 1) % proxies.length;
    await kv.set('proxy_index', currentIndex);

    return proxy;
  } catch (error) {
    console.error('Error getting proxy:', error);
    return null;
  }
}

export async function addProxy(proxy: Proxy): Promise<void> {
  try {
    const proxies = await kv.get<Proxy[]>('proxies') || [];
    proxies.push(proxy);
    await kv.set('proxies', proxies);
  } catch (error) {
    console.error('Error adding proxy:', error);
  }
}

export async function removeProxy(host: string, port: number): Promise<void> {
  try {
    const proxies = await kv.get<Proxy[]>('proxies') || [];
    const filteredProxies = proxies.filter(
      p => p.host !== host || p.port !== port
    );
    await kv.set('proxies', filteredProxies);
  } catch (error) {
    console.error('Error removing proxy:', error);
  }
}

export async function listProxies(): Promise<Proxy[]> {
  try {
    return await kv.get<Proxy[]>('proxies') || [];
  } catch (error) {
    console.error('Error listing proxies:', error);
    return [];
  }
} 