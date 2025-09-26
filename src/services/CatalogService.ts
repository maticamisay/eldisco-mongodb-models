import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import { Supplier } from '../models/Supplier';
import { Especificacion } from '../models/Especificacion';
import { ICategory, IBrand, ISupplier, IEspecificacion } from '../types';
import { BaseCacheService, CacheConfig, RedisConfig } from './BaseCache';

export interface CatalogFullData {
  categories: any[];
  brands: any[];
  suppliers: any[];
  especificaciones: any[];
}

export class CatalogService extends BaseCacheService {
  constructor(config?: CacheConfig, redisConfig?: RedisConfig) {
    super(config, redisConfig);
  }

  /**
   * Get all categories with caching
   */
  async getCategories(): Promise<any[]> {
    const cacheKey = 'catalog:categories';

    try {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        const latestCategory = await Category.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } });

        if (!latestCategory || !this.isCacheStale(cacheKey, latestCategory.updatedAt)) {
          return cached;
        }
      }

      const categories = await Category.find({})
        .sort({ nombre: 1 })
        .lean();

      // Cache with longer TTL since catalog data changes less frequently
      await this.setCache(cacheKey, categories, new Date());

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get all brands with caching
   */
  async getBrands(): Promise<any[]> {
    const cacheKey = 'catalog:brands';

    try {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        const latestBrand = await Brand.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } });

        if (!latestBrand || !this.isCacheStale(cacheKey, latestBrand.updatedAt)) {
          return cached;
        }
      }

      const brands = await Brand.find({})
        .sort({ nombre: 1 })
        .lean();

      await this.setCache(cacheKey, brands, new Date());

      return brands;
    } catch (error) {
      console.error('Error fetching brands:', error);
      throw error;
    }
  }

  /**
   * Get all suppliers with caching
   */
  async getSuppliers(): Promise<any[]> {
    const cacheKey = 'catalog:suppliers';

    try {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        const latestSupplier = await Supplier.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } });

        if (!latestSupplier || !this.isCacheStale(cacheKey, latestSupplier.updatedAt)) {
          return cached;
        }
      }

      const suppliers = await Supplier.find({})
        .sort({ nombre: 1 })
        .lean();

      await this.setCache(cacheKey, suppliers, new Date());

      return suppliers;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw error;
    }
  }

  /**
   * Get active specifications for a category
   */
  async getEspecificacionesByCategory(categoryId: string): Promise<any[]> {
    const cacheKey = `catalog:specs:${categoryId}`;

    try {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        const latestSpec = await Especificacion.findOne(
          { categoriaIds: categoryId },
          { updatedAt: 1 },
          { sort: { updatedAt: -1 } }
        );

        if (!latestSpec || !this.isCacheStale(cacheKey, latestSpec.updatedAt)) {
          return cached;
        }
      }

      const especificaciones = await Especificacion.find({
        categoriaIds: categoryId,
        isActive: true
      })
        .sort({ nombre: 1 })
        .lean();

      await this.setCache(cacheKey, especificaciones, new Date());

      return especificaciones;
    } catch (error) {
      console.error('Error fetching especificaciones:', error);
      throw error;
    }
  }

  /**
   * Get all catalog data in one request
   */
  async getFullCatalogData(): Promise<CatalogFullData> {
    const cacheKey = 'catalog:full';

    try {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        // Check staleness against latest updates from any catalog collection
        const [latestCategory, latestBrand, latestSupplier, latestSpec] = await Promise.all([
          Category.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } }),
          Brand.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } }),
          Supplier.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } }),
          Especificacion.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } })
        ]);

        const latestUpdate = new Date(Math.max(
          latestCategory?.updatedAt?.getTime() || 0,
          latestBrand?.updatedAt?.getTime() || 0,
          latestSupplier?.updatedAt?.getTime() || 0,
          latestSpec?.updatedAt?.getTime() || 0
        ));

        if (!this.isCacheStale(cacheKey, latestUpdate)) {
          return cached;
        }
      }

      // Fetch all catalog data in parallel
      const [categories, brands, suppliers, especificaciones] = await Promise.all([
        Category.find({}).sort({ nombre: 1 }).lean(),
        Brand.find({}).sort({ nombre: 1 }).lean(),
        Supplier.find({}).sort({ nombre: 1 }).lean(),
        Especificacion.find({ isActive: true }).sort({ nombre: 1 }).lean()
      ]);

      const catalogData: CatalogFullData = {
        categories,
        brands,
        suppliers,
        especificaciones
      };

      // Cache with longer TTL since catalog data changes less frequently
      await this.setCache(cacheKey, catalogData, new Date());

      return catalogData;
    } catch (error) {
      console.error('Error fetching full catalog data:', error);
      throw error;
    }
  }

  /**
   * Get categories that have products
   */
  async getCategoriesWithProducts(): Promise<Array<{ _id: string; nombre: string; productCount: number }>> {
    const cacheKey = 'catalog:categories-with-products';

    try {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        // Check against both categories and products for staleness
        const [latestCategory, latestProduct] = await Promise.all([
          Category.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } }),
          // We need to check product updates too since this affects the count
          require('../models/Product').Product.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } })
        ]);

        const latestUpdate = new Date(Math.max(
          latestCategory?.updatedAt?.getTime() || 0,
          latestProduct?.updatedAt?.getTime() || 0
        ));

        if (!this.isCacheStale(cacheKey, latestUpdate)) {
          return cached;
        }
      }

      // Import Product model dynamically to avoid circular dependency
      const { Product } = require('../models/Product');

      const categoriesWithCount = await Product.aggregate([
        {
          $group: {
            _id: '$categoriaId',
            productCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: '$category'
        },
        {
          $project: {
            _id: 1,
            nombre: '$category.nombre',
            productCount: 1
          }
        },
        {
          $sort: { nombre: 1 }
        }
      ]);

      await this.setCache(cacheKey, categoriesWithCount, new Date());

      return categoriesWithCount;
    } catch (error) {
      console.error('Error fetching categories with products:', error);
      throw error;
    }
  }

  /**
   * Invalidate all catalog caches
   */
  async invalidateCatalogCache(): Promise<void> {
    await Promise.all([
      this.invalidateCache('catalog:categories'),
      this.invalidateCache('catalog:brands'),
      this.invalidateCache('catalog:suppliers'),
      this.invalidateCache('catalog:full'),
      this.invalidateCache('catalog:categories-with-products'),
      this.clearCache('catalog:specs:*')
    ]);
  }

  /**
   * Invalidate specific catalog type
   */
  async invalidateSpecificCache(type: 'categories' | 'brands' | 'suppliers' | 'especificaciones'): Promise<void> {
    switch (type) {
      case 'categories':
        await Promise.all([
          this.invalidateCache('catalog:categories'),
          this.invalidateCache('catalog:full'),
          this.invalidateCache('catalog:categories-with-products')
        ]);
        break;
      case 'brands':
        await Promise.all([
          this.invalidateCache('catalog:brands'),
          this.invalidateCache('catalog:full')
        ]);
        break;
      case 'suppliers':
        await Promise.all([
          this.invalidateCache('catalog:suppliers'),
          this.invalidateCache('catalog:full')
        ]);
        break;
      case 'especificaciones':
        await Promise.all([
          this.clearCache('catalog:specs:*'),
          this.invalidateCache('catalog:full')
        ]);
        break;
    }
  }
}