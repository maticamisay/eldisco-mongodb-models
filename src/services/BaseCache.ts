import { Document } from 'mongoose';

export interface CacheConfig {
  ttl?: number; // Time to live in seconds (default: 3600 = 1 hour)
  maxSize?: number; // Max entries in memory cache (default: 1000)
  enabled?: boolean; // Enable/disable cache (default: true)
}

export interface RedisConfig {
  url: string;
  token: string;
}

// In-memory cache implementation
export class MemoryCache {
  private cache = new Map<string, { data: any; expires: number; lastModified?: Date }>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  set(key: string, data: any, ttl: number = 3600, lastModified?: Date): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    const expires = Date.now() + (ttl * 1000);
    this.cache.set(key, { data, expires, lastModified });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  isStale(key: string, lastModified: Date): boolean {
    const entry = this.cache.get(key);
    if (!entry || !entry.lastModified) return true;

    return lastModified > entry.lastModified;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

// Redis cache implementation (optional)
export class RedisCache {
  private redis: any = null;

  constructor(config: RedisConfig) {
    try {
      const { Redis } = require('@upstash/redis');
      this.redis = new Redis(config);
    } catch (error) {
      console.warn('Upstash Redis not available. Install @upstash/redis to use Redis cache.');
    }
  }

  async set(key: string, data: any, ttl: number = 3600): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.setex(key, ttl, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Redis cache set error:', error);
    }
  }

  async get(key: string): Promise<any | null> {
    if (!this.redis) return null;

    try {
      const result = await this.redis.get(key);
      if (!result) return null;

      const parsed = JSON.parse(result);
      return parsed.data;
    } catch (error) {
      console.error('Redis cache get error:', error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Redis cache delete error:', error);
    }
  }

  async clear(pattern?: string): Promise<void> {
    if (!this.redis) return;

    try {
      if (pattern) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        await this.redis.flushall();
      }
    } catch (error) {
      console.error('Redis cache clear error:', error);
    }
  }

  isAvailable(): boolean {
    return this.redis !== null;
  }
}

// Base cache service
export abstract class BaseCacheService {
  protected memoryCache: MemoryCache;
  protected redisCache?: RedisCache;
  protected config: Required<CacheConfig>;

  constructor(
    config: CacheConfig = {},
    redisConfig?: RedisConfig
  ) {
    this.config = {
      ttl: 3600,
      maxSize: 1000,
      enabled: true,
      ...config
    };

    this.memoryCache = new MemoryCache(this.config.maxSize);

    if (redisConfig) {
      this.redisCache = new RedisCache(redisConfig);
    }
  }

  protected async setCache(key: string, data: any, lastModified?: Date): Promise<void> {
    if (!this.config.enabled) return;

    // Set in memory cache
    this.memoryCache.set(key, data, this.config.ttl, lastModified);

    // Set in Redis cache if available
    if (this.redisCache?.isAvailable()) {
      await this.redisCache.set(key, data, this.config.ttl);
    }
  }

  protected async getCache(key: string): Promise<any | null> {
    if (!this.config.enabled) return null;

    // Try memory cache first (fastest)
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult !== null) {
      return memoryResult;
    }

    // Try Redis cache
    if (this.redisCache?.isAvailable()) {
      const redisResult = await this.redisCache.get(key);
      if (redisResult !== null) {
        // Back-fill memory cache
        this.memoryCache.set(key, redisResult, this.config.ttl);
        return redisResult;
      }
    }

    return null;
  }

  protected async invalidateCache(key: string): Promise<void> {
    this.memoryCache.delete(key);

    if (this.redisCache?.isAvailable()) {
      await this.redisCache.delete(key);
    }
  }

  protected async clearCache(pattern?: string): Promise<void> {
    if (pattern) {
      // For memory cache, we need to find matching keys
      const stats = this.memoryCache.getStats();
      if (stats.size > 0) {
        this.memoryCache.clear(); // Simplified - clear all for pattern matching
      }
    } else {
      this.memoryCache.clear();
    }

    if (this.redisCache?.isAvailable()) {
      await this.redisCache.clear(pattern);
    }
  }

  protected isCacheStale(key: string, lastModified: Date): boolean {
    return this.memoryCache.isStale(key, lastModified);
  }

  // Get cache statistics
  getCacheStats(): { memory: { size: number; maxSize: number }; redis: boolean } {
    return {
      memory: this.memoryCache.getStats(),
      redis: this.redisCache?.isAvailable() || false
    };
  }
}