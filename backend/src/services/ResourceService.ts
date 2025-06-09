import { Resource } from '../models';
import { createCache } from '../cache';
import { logger } from '../utils/logger';
import { protectedCall } from '../utils/circuitBreaker';

export class ResourceService {
  private static cache = createCache<Resource[]>();

  static async getAllResources(): Promise<Resource[]> {
    return protectedCall('get-resources', async () => {
      const cached = await this.cache.get('all-resources');
      if (cached) return cached;

      const resources = await this.fetchResources();
      await this.cache.set('all-resources', resources);
      return resources;
    });
  }

  static async getResourceById(id: string): Promise<Resource | null> {
    const resources = await this.getAllResources();
    return resources.find(r => r.id === id) || null;
  }

  static async getResourcesByType(type: string): Promise<Resource[]> {
    const resources = await this.getAllResources();
    return resources.filter(r => r.type === type);
  }

  static async getResourcesByStatus(status: string): Promise<Resource[]> {
    const resources = await this.getAllResources();
    return resources.filter(r => r.status === status);
  }

  static async getResourceMetrics(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    costPerHour: number;
  }> {
    const resources = await this.getAllResources();

    const byType = resources.reduce((acc, r) => {
      acc[r.type] = (acc[r.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = resources.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const costPerHour = resources.reduce((total, r) => total + r.hourlyRate, 0);

    return {
      total: resources.length,
      byType,
      byStatus,
      costPerHour,
    };
  }

  private static async fetchResources(): Promise<Resource[]> {
    try {
      return [
        {
          id: 'i-1234567890',
          name: 'web-server-1',
          type: 'ec2',
          status: 'running',
          region: 'us-east-1',
          hourlyRate: 0.10,
          tags: { env: 'prod', role: 'web' },
          metrics: {
            cpu: 75,
            memory: 85,
            network: 60,
          },
        },
        {
          id: 'i-0987654321',
          name: 'db-server-1',
          type: 'rds',
          status: 'running',
          region: 'us-east-1',
          hourlyRate: 0.20,
          tags: { env: 'prod', role: 'db' },
          metrics: {
            cpu: 65,
            memory: 75,
            network: 40,
          },
        },
        {
          id: 'i-5432109876',
          name: 'cache-1',
          type: 'elasticache',
          status: 'running',
          region: 'us-east-1',
          hourlyRate: 0.15,
          tags: { env: 'prod', role: 'cache' },
          metrics: {
            cpu: 45,
            memory: 60,
            network: 30,
          },
        },
      ];
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to fetch resources', error);
      } else {
        logger.error('Failed to fetch resources', new Error(String(error)));
      }
      throw error;
    }
  }
}

export default ResourceService; 