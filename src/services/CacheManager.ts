import { ProductService } from './ProductService';
import { CatalogService } from './CatalogService';
import { SalesService } from './SalesService';
import { CacheConfig, RedisConfig } from './BaseCache';

export interface CacheManagerConfig extends CacheConfig {
  redis?: RedisConfig;
  autoInvalidate?: boolean; // Enable automatic cache invalidation on model changes
}

export class CacheManager {
  private static instance: CacheManager;

  public productService: ProductService;
  public catalogService: CatalogService;
  public salesService: SalesService;

  private config: CacheManagerConfig;

  private constructor(config: CacheManagerConfig = {}) {
    this.config = {
      ttl: 3600,
      maxSize: 1000,
      enabled: true,
      autoInvalidate: true,
      ...config
    };

    // Initialize services
    this.productService = new ProductService(this.config, this.config.redis);
    this.catalogService = new CatalogService(this.config, this.config.redis);
    this.salesService = new SalesService(this.config, this.config.redis);

    // Setup automatic invalidation if enabled
    if (this.config.autoInvalidate) {
      this.setupAutoInvalidation();
    }
  }

  public static getInstance(config?: CacheManagerConfig): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager(config);
    }
    return CacheManager.instance;
  }

  public static configure(config: CacheManagerConfig): CacheManager {
    CacheManager.instance = new CacheManager(config);
    return CacheManager.instance;
  }

  private setupAutoInvalidation(): void {
    // We'll add the hooks to models that need cache invalidation
    this.setupProductHooks();
    this.setupCatalogHooks();
    this.setupSalesHooks();
  }

  private setupProductHooks(): void {
    try {
      const { Product } = require('../models/Product');

      // Invalidate product cache on save/update
      Product.schema.post(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], async () => {
        await this.productService.invalidateProductCache();
      });

      // Invalidate product cache on delete
      Product.schema.post(['findOneAndDelete', 'deleteOne', 'deleteMany'], async () => {
        await this.productService.invalidateProductCache();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Could not setup Product cache hooks:', message);
    }
  }

  private setupCatalogHooks(): void {
    try {
      const { Category } = require('../models/Category');
      const { Brand } = require('../models/Brand');
      const { Supplier } = require('../models/Supplier');
      const { Especificacion } = require('../models/Especificacion');

      // Category hooks
      Category.schema.post(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], async () => {
        await Promise.all([
          this.catalogService.invalidateSpecificCache('categories'),
          this.productService.invalidateProductCache() // Products reference categories
        ]);
      });

      Category.schema.post(['findOneAndDelete', 'deleteOne', 'deleteMany'], async () => {
        await Promise.all([
          this.catalogService.invalidateSpecificCache('categories'),
          this.productService.invalidateProductCache()
        ]);
      });

      // Brand hooks
      Brand.schema.post(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], async () => {
        await Promise.all([
          this.catalogService.invalidateSpecificCache('brands'),
          this.productService.invalidateProductCache() // Products reference brands
        ]);
      });

      Brand.schema.post(['findOneAndDelete', 'deleteOne', 'deleteMany'], async () => {
        await Promise.all([
          this.catalogService.invalidateSpecificCache('brands'),
          this.productService.invalidateProductCache()
        ]);
      });

      // Supplier hooks
      Supplier.schema.post(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], async () => {
        await Promise.all([
          this.catalogService.invalidateSpecificCache('suppliers'),
          this.productService.invalidateProductCache() // Products reference suppliers
        ]);
      });

      Supplier.schema.post(['findOneAndDelete', 'deleteOne', 'deleteMany'], async () => {
        await Promise.all([
          this.catalogService.invalidateSpecificCache('suppliers'),
          this.productService.invalidateProductCache()
        ]);
      });

      // Especificacion hooks
      Especificacion.schema.post(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], async () => {
        await this.catalogService.invalidateSpecificCache('especificaciones');
      });

      Especificacion.schema.post(['findOneAndDelete', 'deleteOne', 'deleteMany'], async () => {
        await this.catalogService.invalidateSpecificCache('especificaciones');
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Could not setup Catalog cache hooks:', message);
    }
  }

  private setupSalesHooks(): void {
    try {
      const { SalesNote } = require('../models/SalesNote');
      const { ServiceRequest } = require('../models/ServiceRequest');

      // SalesNote hooks
      SalesNote.schema.post(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], async () => {
        await this.salesService.invalidateSalesCache();
      });

      SalesNote.schema.post(['findOneAndDelete', 'deleteOne', 'deleteMany'], async () => {
        await this.salesService.invalidateSalesCache();
      });

      // ServiceRequest hooks
      ServiceRequest.schema.post(['save', 'findOneAndUpdate', 'updateOne', 'updateMany'], async () => {
        await this.salesService.invalidateServiceCache();
      });

      ServiceRequest.schema.post(['findOneAndDelete', 'deleteOne', 'deleteMany'], async () => {
        await this.salesService.invalidateServiceCache();
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.warn('Could not setup Sales cache hooks:', message);
    }
  }

  /**
   * Manually invalidate all caches
   */
  async invalidateAllCaches(): Promise<void> {
    await Promise.all([
      this.productService.invalidateProductCache(),
      this.catalogService.invalidateCatalogCache(),
      this.salesService.invalidateSalesCache(),
      this.salesService.invalidateServiceCache()
    ]);
  }

  /**
   * Get cache statistics from all services
   */
  getCacheStats() {
    return {
      product: this.productService.getCacheStats(),
      catalog: this.catalogService.getCacheStats(),
      sales: this.salesService.getCacheStats()
    };
  }

  /**
   * Enable or disable caching
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    // Note: Individual services will check this.config.enabled in their base class
  }

  /**
   * Check if caching is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled || false;
  }
}