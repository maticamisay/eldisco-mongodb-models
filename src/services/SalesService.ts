import { SalesNote } from '../models/SalesNote';
import { ServiceRequest } from '../models/ServiceRequest';
import { ISalesNote, IServiceRequest } from '../types';
import { BaseCacheService, CacheConfig, RedisConfig } from './BaseCache';

export interface SalesQuery {
  startDate?: Date;
  endDate?: Date;
  customerName?: string;
  customerDoc?: string;
  page?: number;
  limit?: number;
  sortBy?: 'fecha' | 'total' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SalesStats {
  totalSales: number;
  totalAmount: number;
  salesThisMonth: number;
  amountThisMonth: number;
  salesThisWeek: number;
  amountThisWeek: number;
  salesToday: number;
  amountToday: number;
  averageTicket: number;
}

export interface ServiceStats {
  totalRequests: number;
  pendingRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  totalRevenue: number;
  averageTicket: number;
}

export class SalesService extends BaseCacheService {
  constructor(config?: CacheConfig, redisConfig?: RedisConfig) {
    super(config, redisConfig);
  }

  /**
   * Get recent sales notes with caching
   */
  async getRecentSalesNotes(limit: number = 50): Promise<any[]> {
    const cacheKey = `sales:recent:${limit}`;

    try {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        const latestSale = await SalesNote.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } });

        if (!latestSale || !this.isCacheStale(cacheKey, latestSale.updatedAt)) {
          return cached;
        }
      }

      const salesNotes = await SalesNote.find({})
        .sort({ fecha: -1, createdAt: -1 })
        .limit(limit)
        .lean();

      // Cache with shorter TTL since sales data changes frequently
      await this.setCache(cacheKey, salesNotes, new Date());

      return salesNotes;
    } catch (error) {
      console.error('Error fetching recent sales notes:', error);
      throw error;
    }
  }

  /**
   * Get sales statistics with caching
   */
  async getSalesStats(): Promise<SalesStats> {
    const cacheKey = 'sales:stats';

    try {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        const latestSale = await SalesNote.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } });

        if (!latestSale || !this.isCacheStale(cacheKey, latestSale.updatedAt)) {
          return cached;
        }
      }

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Aggregate sales data
      const [
        totalStats,
        monthlyStats,
        weeklyStats,
        dailyStats
      ] = await Promise.all([
        SalesNote.aggregate([
          {
            $group: {
              _id: null,
              totalSales: { $sum: 1 },
              totalAmount: { $sum: '$total' }
            }
          }
        ]),
        SalesNote.aggregate([
          {
            $match: {
              fecha: { $gte: startOfMonth }
            }
          },
          {
            $group: {
              _id: null,
              salesThisMonth: { $sum: 1 },
              amountThisMonth: { $sum: '$total' }
            }
          }
        ]),
        SalesNote.aggregate([
          {
            $match: {
              fecha: { $gte: startOfWeek }
            }
          },
          {
            $group: {
              _id: null,
              salesThisWeek: { $sum: 1 },
              amountThisWeek: { $sum: '$total' }
            }
          }
        ]),
        SalesNote.aggregate([
          {
            $match: {
              fecha: { $gte: startOfToday }
            }
          },
          {
            $group: {
              _id: null,
              salesToday: { $sum: 1 },
              amountToday: { $sum: '$total' }
            }
          }
        ])
      ]);

      const total = totalStats[0] || { totalSales: 0, totalAmount: 0 };
      const monthly = monthlyStats[0] || { salesThisMonth: 0, amountThisMonth: 0 };
      const weekly = weeklyStats[0] || { salesThisWeek: 0, amountThisWeek: 0 };
      const daily = dailyStats[0] || { salesToday: 0, amountToday: 0 };

      const stats: SalesStats = {
        ...total,
        ...monthly,
        ...weekly,
        ...daily,
        averageTicket: total.totalSales > 0 ? total.totalAmount / total.totalSales : 0
      };

      // Cache stats with moderate TTL (30 minutes)
      await this.setCache(cacheKey, stats, new Date());

      return stats;
    } catch (error) {
      console.error('Error fetching sales stats:', error);
      throw error;
    }
  }

  /**
   * Get service request statistics
   */
  async getServiceStats(): Promise<ServiceStats> {
    const cacheKey = 'service:stats';

    try {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        const latestService = await ServiceRequest.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } });

        if (!latestService || !this.isCacheStale(cacheKey, latestService.updatedAt)) {
          return cached;
        }
      }

      const [statusStats, revenueStats] = await Promise.all([
        ServiceRequest.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]),
        ServiceRequest.aggregate([
          {
            $match: {
              status: 'Completed'
            }
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalCost' },
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      const statusCounts = statusStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {} as any);

      const revenue = revenueStats[0] || { totalRevenue: 0, count: 0 };

      const stats: ServiceStats = {
        totalRequests: Object.values(statusCounts).reduce((sum: number, count: any) => sum + count, 0) as number,
        pendingRequests: statusCounts['Pending'] || 0,
        inProgressRequests: statusCounts['In Progress'] || 0,
        completedRequests: statusCounts['Completed'] || 0,
        totalRevenue: revenue.totalRevenue,
        averageTicket: revenue.count > 0 ? revenue.totalRevenue / revenue.count : 0
      };

      // Cache service stats with moderate TTL (30 minutes)
      await this.setCache(cacheKey, stats, new Date());

      return stats;
    } catch (error) {
      console.error('Error fetching service stats:', error);
      throw error;
    }
  }

  /**
   * Get recent service requests
   */
  async getRecentServiceRequests(limit: number = 20): Promise<any[]> {
    const cacheKey = `service:recent:${limit}`;

    try {
      const cached = await this.getCache(cacheKey);
      if (cached) {
        const latestService = await ServiceRequest.findOne({}, { updatedAt: 1 }, { sort: { updatedAt: -1 } });

        if (!latestService || !this.isCacheStale(cacheKey, latestService.updatedAt)) {
          return cached;
        }
      }

      const serviceRequests = await ServiceRequest.find({ isArchived: false })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      // Cache with shorter TTL since service data changes frequently
      await this.setCache(cacheKey, serviceRequests, new Date());

      return serviceRequests;
    } catch (error) {
      console.error('Error fetching recent service requests:', error);
      throw error;
    }
  }

  /**
   * Invalidate sales-related caches
   */
  async invalidateSalesCache(): Promise<void> {
    await Promise.all([
      this.invalidateCache('sales:stats'),
      this.clearCache('sales:recent:*')
    ]);
  }

  /**
   * Invalidate service-related caches
   */
  async invalidateServiceCache(): Promise<void> {
    await Promise.all([
      this.invalidateCache('service:stats'),
      this.clearCache('service:recent:*')
    ]);
  }
}