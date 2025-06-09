import { Recommendation, OptimizationResult, Resource } from '../models';
import ResourceService from './ResourceService';
import AlertService from './AlertService';
import { Optimization } from '../models';
import { createCache } from '../cache';
import { logger } from '../utils/logger';
import { protectedCall } from '../utils/circuitBreaker';

export class OptimizationService {
  private static cache = createCache<Optimization[]>();

  static async getAllOptimizations(): Promise<Optimization[]> {
    return protectedCall('get-optimizations', async () => {
      const cached = await this.cache.get('all-optimizations');
      if (cached) return cached;

      const optimizations = await this.fetchOptimizations();
      await this.cache.set('all-optimizations', optimizations);
      return optimizations;
    });
  }

  static async getOptimizationsByResourceId(resourceId: string): Promise<Optimization[]> {
    const optimizations = await this.getAllOptimizations();
    return optimizations.filter(o => o.resourceId === resourceId);
  }

  static async getOptimizationsByImpact(impact: 'low' | 'medium' | 'high'): Promise<Optimization[]> {
    const optimizations = await this.getAllOptimizations();
    return optimizations.filter(o => o.impact === impact);
  }

  static async getOptimizationMetrics(): Promise<{
    total: number;
    byImpact: Record<string, number>;
    byType: Record<string, number>;
    totalPotentialSavings: number;
  }> {
    const optimizations = await this.getAllOptimizations();

    const byImpact = optimizations.reduce((acc, o) => {
      acc[o.impact] = (acc[o.impact] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byType = optimizations.reduce((acc, o) => {
      acc[o.type] = (acc[o.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalPotentialSavings = optimizations.reduce((total, o) => total + o.potentialSavings, 0);

    return {
      total: optimizations.length,
      byImpact,
      byType,
      totalPotentialSavings,
    };
  }

  private static async fetchOptimizations(): Promise<Optimization[]> {
    try {
      return [
        {
          resourceId: 'i-1234567890',
          type: 'rightsizing',
          impact: 'high',
          description: 'Instance is oversized based on CPU utilization',
          potentialSavings: 45.20,
          implementation: 'Change instance type from c5.xlarge to c5.large',
          risks: [
            'Brief downtime during instance modification',
            'Potential performance impact during peak loads',
          ],
          timestamp: new Date().toISOString(),
        },
        {
          resourceId: 'i-0987654321',
          type: 'scheduling',
          impact: 'medium',
          description: 'Development environment running 24/7',
          potentialSavings: 72.80,
          implementation: 'Implement auto-shutdown during non-business hours',
          risks: [
            'Developers might need access outside business hours',
            'Some background jobs might be affected',
          ],
          timestamp: new Date().toISOString(),
        },
        {
          resourceId: 'i-5432109876',
          type: 'storage',
          impact: 'low',
          description: 'Unused EBS volumes detected',
          potentialSavings: 25.50,
          implementation: 'Delete or archive unused volumes',
          risks: [
            'Data might be needed in the future',
            'Volume might be planned for future use',
          ],
          timestamp: new Date().toISOString(),
        },
      ];
    } catch (error) {
      if (error instanceof Error) {
        logger.error('Failed to fetch optimizations', error);
      } else {
        logger.error('Failed to fetch optimizations', new Error(String(error)));
      }
      throw error;
    }
  }

  public async generateRecommendations(): Promise<OptimizationResult> {
    const resources = await ResourceService.getAllResources();
    const alerts = AlertService.getAllAlerts();
    const recommendations: Recommendation[] = [];

    resources.forEach((resource) => {
      const resourceAlerts = alerts.filter(alert => alert.resourceId === resource.id);
      const recommendation = this.analyzeResource(resource, resourceAlerts);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    });

    return { recommendations };
  }

  private analyzeResource(resource: Resource, alerts: any[]): Recommendation | null {
    // Analyze resource based on type, status, and alerts
    const hasCritical = alerts.some(alert => alert.severity === 'critical');
    const hasWarning = alerts.some(alert => alert.severity === 'warning');

    if (resource.status === 'degraded' || hasCritical) {
      return {
        resourceId: resource.id,
        action: this.getUrgentAction(resource),
        reason: hasCritical ? 'Resource has critical alerts and requires immediate attention' 
                           : 'Resource is in degraded state',
      };
    }

    if (hasWarning) {
      return {
        resourceId: resource.id,
        action: this.getPreventiveAction(resource),
        reason: 'Resource has warning alerts - preventive action recommended',
      };
    }

    // Check for optimization opportunities
    if (resource.hourlyRate > 0.15 && resource.type === 'VM') {
      return {
        resourceId: resource.id,
        action: 'Consider downgrading to a smaller instance type',
        reason: 'Resource may be over-provisioned - cost optimization opportunity',
      };
    }

    if (resource.type === 'Storage' && resource.hourlyRate > 0.03) {
      return {
        resourceId: resource.id,
        action: 'Review storage tier and data lifecycle policies',
        reason: 'Storage costs are above average - optimization opportunity',
      };
    }

    // Default optimization for healthy resources
    return {
      resourceId: resource.id,
      action: 'Monitor resource utilization patterns',
      reason: 'Resource is healthy - continue monitoring for optimization opportunities',
    };
  }

  private getUrgentAction(resource: Resource): string {
    switch (resource.type) {
      case 'VM':
        return 'Restart instance or increase CPU/memory allocation';
      case 'Database':
        return 'Check database performance and consider scaling up';
      case 'Storage':
        return 'Increase storage capacity or implement data archiving';
      default:
        return 'Investigate resource issues immediately';
    }
  }

  private getPreventiveAction(resource: Resource): string {
    switch (resource.type) {
      case 'VM':
        return 'Schedule maintenance window and review performance metrics';
      case 'Database':
        return 'Optimize queries and consider read replicas';
      case 'Storage':
        return 'Implement data compression and cleanup old files';
      default:
        return 'Review resource configuration and update monitoring thresholds';
    }
  }

  public async getPotentialSavings(): Promise<{ totalSavings: number; savingsByAction: Record<string, number> }> {
    const recommendations = await this.generateRecommendations();
    let totalSavings = 0;
    const savingsByAction: Record<string, number> = {};
    for (const rec of recommendations.recommendations) {
      const resource = await ResourceService.getResourceById(rec.resourceId.toString());
      if (resource) {
        const savings = this.calculatePotentialSavings(resource, rec.action);
        totalSavings += savings;
        savingsByAction[rec.action] = (savingsByAction[rec.action] || 0) + savings;
      }
    }

    return {
      totalSavings: parseFloat(totalSavings.toFixed(2)),
      savingsByAction,
    };
  }

  private calculatePotentialSavings(resource: Resource, action: string): number {
    // Mock calculation based on action type
    if (action.includes('downgrad')) {
      return resource.hourlyRate * 0.3 * 24 * 30; // 30% monthly savings
    }
    if (action.includes('storage') || action.includes('archiv')) {
      return resource.hourlyRate * 0.2 * 24 * 30; // 20% monthly savings
    }
    if (action.includes('optimi')) {
      return resource.hourlyRate * 0.1 * 24 * 30; // 10% monthly savings
    }
    return 0;
  }
}

export default OptimizationService; 