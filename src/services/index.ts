// Export all cache-related classes
export { BaseCacheService, MemoryCache, RedisCache } from './BaseCache';
export type { CacheConfig, RedisConfig } from './BaseCache';

// Export individual services
export { ProductService } from './ProductService';
export type { ProductQuery, ProductsResult, CatalogData } from './ProductService';

export { CatalogService } from './CatalogService';
export type { CatalogFullData } from './CatalogService';

export { SalesService } from './SalesService';
export type { SalesQuery, SalesStats, ServiceStats } from './SalesService';

// Export cache manager
export { CacheManager } from './CacheManager';
export type { CacheManagerConfig } from './CacheManager';

// Convenience exports for quick access
import { CacheManager } from './CacheManager';
import { ProductService } from './ProductService';
import { CatalogService } from './CatalogService';
import { SalesService } from './SalesService';

export const createCacheManager = (config?: any) => {
  return CacheManager.getInstance(config);
};

export const createProductService = (config?: any, redisConfig?: any) => {
  return new ProductService(config, redisConfig);
};

export const createCatalogService = (config?: any, redisConfig?: any) => {
  return new CatalogService(config, redisConfig);
};

export const createSalesService = (config?: any, redisConfig?: any) => {
  return new SalesService(config, redisConfig);
};