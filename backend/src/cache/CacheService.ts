import { logger } from '../utils/logger';

export interface CacheOptions {
  ttl: number;
  maxSize: number;
  cleanupInterval: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
  avgAccessTime: number;
  evictions: number;
}

export interface CacheEntry<T> {
  value: T;
  expiry: number;
  lastAccessed: number;
  accessCount: number;
}

export class CacheService<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;
  private totalAccessTime: number = 0;
  private totalAccesses: number = 0;
  private cleanupTimer!: NodeJS.Timeout;

  constructor(
    private options: CacheOptions = {
      ttl: 300000,
      maxSize: 1000,
      cleanupInterval: 60000,
    }
  ) {
    this.startCleanup();
  }

  async get(key: string): Promise<T | null> {
    const start = Date.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    entry.lastAccessed = Date.now();
    entry.accessCount++;
    this.hits++;

    const accessTime = Date.now() - start;
    this.totalAccessTime += accessTime;
    this.totalAccesses++;

    if (accessTime > 100) {
      logger.warn('Slow cache access detected', {
        key,
        accessTime,
        accessCount: entry.accessCount,
      });
    }

    return entry.value;
  }

  async set(key: string, value: T, ttl?: number): Promise<void> {
    if (this.cache.size >= this.options.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      value,
      expiry: Date.now() + (ttl || this.options.ttl),
      lastAccessed: Date.now(),
      accessCount: 0,
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.resetStats();
  }

  getStats(): CacheStats {
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0,
      avgAccessTime: this.totalAccessTime / this.totalAccesses || 0,
      evictions: this.evictions,
    };
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiry) {
          this.cache.delete(key);
        }
      }
    }, this.options.cleanupInterval);
  }

  private evict(): void {
    let oldestAccess = Date.now();
    let keyToEvict: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        keyToEvict = key;
      }
    }

    if (keyToEvict) {
      this.cache.delete(keyToEvict);
      this.evictions++;
    }
  }

  private resetStats(): void {
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
    this.totalAccessTime = 0;
    this.totalAccesses = 0;
  }

  stop(): void {
    clearInterval(this.cleanupTimer);
  }
}

export const createCache = <T>(options?: CacheOptions): CacheService<T> => {
  return new CacheService<T>(options);
}; 