import { Cost } from '../models';
import { createCache } from '../cache';
import { logger } from '../utils/logger';
import { protectedCall } from '../utils/circuitBreaker';

export class CostService {
  private static cache = createCache<Cost[]>();

  static async getAllCosts(): Promise<Cost[]> {
    return protectedCall('get-costs', async () => {
      const cached = await this.cache.get('all-costs');
      if (cached) return cached;

      const costs = await this.fetchCosts();
      await this.cache.set('all-costs', costs);
      return costs;
    });
  }

  static async getCostsByResourceId(resourceId: string): Promise<Cost[]> {
    const costs = await this.getAllCosts();
    return costs.filter(c => c.resourceId === resourceId);
  }

  static async getCostMetrics(): Promise<{
    totalCost: number;
    costByResource: Record<string, number>;
    costByPeriod: Record<string, number>;
  }> {
    const costs = await this.getAllCosts();

    const costByResource = costs.reduce((acc, c) => {
      acc[c.resourceId] = (acc[c.resourceId] || 0) + c.amount;
      return acc;
    }, {} as Record<string, number>);

    const costByPeriod = costs.reduce((acc, c) => {
      acc[c.period] = (acc[c.period] || 0) + c.amount;
      return acc;
    }, {} as Record<string, number>);

    const totalCost = costs.reduce((total, c) => total + c.amount, 0);

    return {
      totalCost,
      costByResource,
      costByPeriod,
    };
  }

  private static async fetchCosts(): Promise<Cost[]> {
    try {
      return [
        {
          resourceId: 'i-1234567890',
          amount: 72.50,
          currency: 'USD',
          period: '2024-01',
          breakdown: {
            compute: 50.00,
            storage: 15.00,
            network: 7.50,
          },
          timestamp: new Date().toISOString(),
        },
        {
          resourceId: 'i-0987654321',
          amount: 145.20,
          currency: 'USD',
          period: '2024-01',
          breakdown: {
            compute: 100.00,
            storage: 35.00,
            network: 10.20,
          },
          timestamp: new Date().toISOString(),
        },
        {
          resourceId: 'i-5432109876',
          amount: 108.30,
          currency: 'USD',
          period: '2024-01',
          breakdown: {
            compute: 75.00,
            storage: 25.00,
            network: 8.30,
          },
          timestamp: new Date().toISOString(),
        },
      ];
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to fetch costs', error);
      } else {
        logger.error('Failed to fetch costs', new Error(String(error)));
      }
      throw error;
    }
  }
}

export default CostService; 