import { Alert } from '../models';
import { createCache } from '../cache';
import { logger } from '../utils/logger';
import { protectedCall } from '../utils/circuitBreaker';

export class AlertService {
  private static cache = createCache<Alert[]>();

  static async getAllAlerts(): Promise<Alert[]> {
    return protectedCall('get-alerts', async () => {
      const cached = await this.cache.get('all-alerts');
      if (cached) return cached;

      const alerts = await this.fetchAlerts();
      await this.cache.set('all-alerts', alerts);
      return alerts;
    });
  }

  static async getAlertsByResourceId(resourceId: string): Promise<Alert[]> {
    const alerts = await this.getAllAlerts();
    return alerts.filter(a => a.resourceId === resourceId);
  }

  static async getAlertsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): Promise<Alert[]> {
    const alerts = await this.getAllAlerts();
    return alerts.filter(a => a.severity === severity);
  }

  static async getAlertMetrics(): Promise<{
    total: number;
    bySeverity: Record<string, number>;
    byStatus: Record<string, number>;
    activeAlerts: number;
  }> {
    const alerts = await this.getAllAlerts();

    const bySeverity = alerts.reduce((acc, a) => {
      acc[a.severity] = (acc[a.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = alerts.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const activeAlerts = alerts.filter(a => a.status === 'active').length;

    return {
      total: alerts.length,
      bySeverity,
      byStatus,
      activeAlerts,
    };
  }

  private static async fetchAlerts(): Promise<Alert[]> {
    try {
      return [
        {
          id: 'alert-001',
          resourceId: 'i-1234567890',
          type: 'cpu_utilization',
          severity: 'high',
          message: 'CPU utilization above 90% for 15 minutes',
          timestamp: new Date().toISOString(),
          status: 'active',
          metrics: {
            cpu_utilization: 95,
            duration_minutes: 15,
          },
        },
        {
          id: 'alert-002',
          resourceId: 'i-0987654321',
          type: 'memory_usage',
          severity: 'medium',
          message: 'Memory usage above 80% for 10 minutes',
          timestamp: new Date().toISOString(),
          status: 'active',
          metrics: {
            memory_usage: 85,
            duration_minutes: 10,
          },
        },
        {
          id: 'alert-003',
          resourceId: 'i-5432109876',
          type: 'disk_space',
          severity: 'low',
          message: 'Disk space usage above 70%',
          timestamp: new Date().toISOString(),
          status: 'resolved',
          metrics: {
            disk_usage: 75,
            free_space_gb: 25,
          },
        },
      ];
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to fetch alerts', error);
      } else {
        logger.error('Failed to fetch alerts', new Error(String(error)));
      }
      throw error;
    }
  }
}

export default AlertService; 