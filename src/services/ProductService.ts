import { Product } from '../models/Product';
import { Category } from '../models/Category';
import { Brand } from '../models/Brand';
import { Supplier } from '../models/Supplier';
import { IProduct } from '../types';
import { BaseCacheService, CacheConfig, RedisConfig } from './BaseCache';

export interface ProductQuery {
  search?: string;
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  activoEcommerce?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'nombre' | 'precio' | 'stock' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductsResult {
  products: any[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CatalogData {
  categories: any[];
  brands: any[];
  suppliers: any[];
}

export class ProductService extends BaseCacheService {
  constructor(config?: CacheConfig, redisConfig?: RedisConfig) {
    super(config, redisConfig);
  }

  /**
   * Get all products with caching and intelligent invalidation
   */
  async getAllProducts(): Promise<any[]> {
    const cacheKey = 'products:all';

    try {
      // Check if we have a cached version
      const cached = await this.getCache(cacheKey);
      if (cached) {
        // Check if cache is stale by comparing with latest product update
        const latestProduct = await Product.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } });

        if (!latestProduct || !this.isCacheStale(cacheKey, latestProduct.updatedAt)) {
          return cached;
        }
      }

      // Fetch from database with all populated fields
      const products = await Product.find({})
        .populate('marcaId', 'nombre')
        .populate('categoriaId', 'nombre slug')
        .populate('proveedorId', 'nombre')
        .sort({ updatedAt: -1 })
        .lean();

      // Transform to include populated field names at root level
      const transformedProducts = products.map(product => ({
        ...product,
        marcaNombre: (product.marcaId as any)?.nombre,
        categoriaNombre: (product.categoriaId as any)?.nombre,
        categoriaSlug: (product.categoriaId as any)?.slug,
        proveedorNombre: (product.proveedorId as any)?.nombre,
      }));

      // Cache the result
      const latestUpdate = new Date();
      await this.setCache(cacheKey, transformedProducts, latestUpdate);

      return transformedProducts;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get products with filtering and pagination
   */
  async getProducts(query: ProductQuery = {}): Promise<ProductsResult> {
    const {
      search,
      categoryId,
      brandId,
      supplierId,
      activoEcommerce,
      lowStock,
      page = 1,
      limit = 20,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = query;

    // Create cache key based on query parameters
    const queryString = JSON.stringify(query);
    const cacheKey = `products:query:${Buffer.from(queryString).toString('base64')}`;

    try {
      // Try cache first
      const cached = await this.getCache(cacheKey);
      if (cached) {
        const latestProduct = await Product.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } });

        if (!latestProduct || !this.isCacheStale(cacheKey, latestProduct.updatedAt)) {
          return cached;
        }
      }

      // Build MongoDB query
      const filter: any = {};

      if (search) {
        filter.$or = [
          { nombre: { $regex: search, $options: 'i' } },
          { codigoInterno: { $regex: search, $options: 'i' } },
          { codigosBarras: { $in: [new RegExp(search, 'i')] } }
        ];
      }

      if (categoryId) filter.categoriaId = categoryId;
      if (brandId) filter.marcaId = brandId;
      if (supplierId) filter.proveedorId = supplierId;
      if (typeof activoEcommerce === 'boolean') filter.activoEcommerce = activoEcommerce;
      if (lowStock) {
        filter.$expr = { $lte: ['$stock', '$umbralStockBajo'] };
      }

      // Count total documents
      const total = await Product.countDocuments(filter);

      // Calculate pagination
      const totalPages = Math.ceil(total / limit);
      const skip = (page - 1) * limit;

      // Build sort object
      const sort: any = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Fetch products
      const products = await Product.find(filter)
        .populate('marcaId', 'nombre')
        .populate('categoriaId', 'nombre slug')
        .populate('proveedorId', 'nombre')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean();

      // Transform products
      const transformedProducts = products.map(product => ({
        ...product,
        marcaNombre: (product.marcaId as any)?.nombre,
        categoriaNombre: (product.categoriaId as any)?.nombre,
        categoriaSlug: (product.categoriaId as any)?.slug,
        proveedorNombre: (product.proveedorId as any)?.nombre,
      }));

      const result: ProductsResult = {
        products: transformedProducts,
        total,
        page,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };

      // Cache the result with shorter TTL for queries (15 minutes)
      const latestUpdate = new Date();
      await this.setCache(cacheKey, result, latestUpdate);

      return result;
    } catch (error) {
      console.error('Error fetching products with query:', error);
      throw error;
    }
  }

  /**
   * Get catalog data (categories, brands, suppliers) with caching
   */
  async getCatalogData(): Promise<CatalogData> {
    const cacheKey = 'catalog:data';

    try {
      // Try cache first
      const cached = await this.getCache(cacheKey);
      if (cached) {
        // Check staleness against latest updates from any catalog collection
        const [latestCategory, latestBrand, latestSupplier] = await Promise.all([
          Category.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } }),
          Brand.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } }),
          Supplier.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } })
        ]);

        const latestUpdate = new Date(Math.max(
          latestCategory?.updatedAt?.getTime() || 0,
          latestBrand?.updatedAt?.getTime() || 0,
          latestSupplier?.updatedAt?.getTime() || 0
        ));

        if (!this.isCacheStale(cacheKey, latestUpdate)) {
          return cached;
        }
      }

      // Fetch all catalog data
      const [categories, brands, suppliers] = await Promise.all([
        Category.find({}, { nombre: 1, slug: 1 }).sort({ nombre: 1 }).lean(),
        Brand.find({}, { nombre: 1 }).sort({ nombre: 1 }).lean(),
        Supplier.find({}, { nombre: 1 }).sort({ nombre: 1 }).lean()
      ]);

      const catalogData: CatalogData = {
        categories,
        brands,
        suppliers
      };

      // Cache with longer TTL since catalog data changes less frequently
      await this.setCache(cacheKey, catalogData, new Date());

      return catalogData;
    } catch (error) {
      console.error('Error fetching catalog data:', error);
      throw error;
    }
  }

  /**
   * Get products with low stock
   */
  async getLowStockProducts(): Promise<any[]> {
    const cacheKey = 'products:low-stock';

    try {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        const latestProduct = await Product.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } });

        if (!latestProduct || !this.isCacheStale(cacheKey, latestProduct.updatedAt)) {
          return cached;
        }
      }

      const products = await Product.find({
        $expr: { $lte: ['$stock', '$umbralStockBajo'] }
      })
        .populate('marcaId', 'nombre')
        .populate('categoriaId', 'nombre')
        .sort({ stock: 1 })
        .lean();

      const transformedProducts = products.map(product => ({
        ...product,
        marcaNombre: (product.marcaId as any)?.nombre,
        categoriaNombre: (product.categoriaId as any)?.nombre,
      }));

      // Cache with shorter TTL since stock changes frequently
      await this.setCache(cacheKey, transformedProducts, new Date());

      return transformedProducts;
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }
  }

  /**
   * Search products by text
   */
  async searchProducts(searchTerm: string, limit: number = 20): Promise<any[]> {
    if (!searchTerm.trim()) return [];

    const cacheKey = `products:search:${searchTerm.toLowerCase()}:${limit}`;

    try {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        const latestProduct = await Product.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } });

        if (!latestProduct || !this.isCacheStale(cacheKey, latestProduct.updatedAt)) {
          return cached;
        }
      }

      const products = await Product.find({
        $or: [
          { nombre: { $regex: searchTerm, $options: 'i' } },
          { codigoInterno: { $regex: searchTerm, $options: 'i' } },
          { codigosBarras: { $in: [new RegExp(searchTerm, 'i')] } }
        ]
      })
        .populate('marcaId', 'nombre')
        .populate('categoriaId', 'nombre')
        .limit(limit)
        .lean();

      const transformedProducts = products.map(product => ({
        ...product,
        marcaNombre: (product.marcaId as any)?.nombre,
        categoriaNombre: (product.categoriaId as any)?.nombre,
      }));

      // Cache search results with shorter TTL (10 minutes)
      await this.setCache(cacheKey, transformedProducts, new Date());

      return transformedProducts;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Invalidate all product-related caches
   */
  async invalidateProductCache(): Promise<void> {
    await Promise.all([
      this.invalidateCache('products:all'),
      this.invalidateCache('products:low-stock'),
      this.clearCache('products:query:*'),
      this.clearCache('products:search:*')
    ]);
  }

  /**
   * Invalidate catalog cache
   */
  async invalidateCatalogCache(): Promise<void> {
    await this.invalidateCache('catalog:data');
  }
}