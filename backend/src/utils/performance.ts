import { performance } from 'perf_hooks';
import { Request, Response, NextFunction } from 'express';

export interface PerformanceMetrics {
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  timestamp: number;
}

export class PerformanceProfiler {
  private static profiles: Map<string, PerformanceMetrics[]> = new Map();

  static startProfile(label: string): () => PerformanceMetrics {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();
    const startCpu = process.cpuUsage();

    return (): PerformanceMetrics => {
      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      const endCpu = process.cpuUsage(startCpu);

      const metrics: PerformanceMetrics = {
        duration: endTime - startTime,
        memoryUsage: {
          rss: endMemory.rss - startMemory.rss,
          heapUsed: endMemory.heapUsed - startMemory.heapUsed,
          heapTotal: endMemory.heapTotal - startMemory.heapTotal,
          external: endMemory.external - startMemory.external,
          arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers,
        },
        cpuUsage: endCpu,
        timestamp: Date.now(),
      };

      // Store metrics for analysis
      if (!this.profiles.has(label)) {
        this.profiles.set(label, []);
      }
      const profileArray = this.profiles.get(label)!;
      profileArray.push(metrics);

      // Keep only last 100 measurements
      if (profileArray.length > 100) {
        profileArray.shift();
      }

      return metrics;
    };
  }

  static getProfileStats(label: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    avgMemoryUsed: number;
  } | null {
    const profiles = this.profiles.get(label);
    if (!profiles || profiles.length === 0) return null;

    const durations = profiles.map(p => p.duration).sort((a, b) => a - b);
    const memoryUsages = profiles.map(p => p.memoryUsage.heapUsed);

    return {
      count: profiles.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p95Duration: durations[Math.floor(durations.length * 0.95)],
      avgMemoryUsed: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
    };
  }

  static getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [label] of this.profiles) {
      stats[label] = this.getProfileStats(label);
    }
    return stats;
  }
}

// Middleware for automatic performance profiling
export const performanceMiddleware = (label?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const profileLabel = label || `${req.method}:${req.route?.path || req.path}`;
    const endProfile = PerformanceProfiler.startProfile(profileLabel);

    res.on('finish', () => {
      const metrics = endProfile();
      
      // Log slow requests (> 1000ms)
      if (metrics.duration > 1000) {
        console.warn(`🐌 Slow request detected: ${profileLabel} took ${metrics.duration.toFixed(2)}ms`);
      }
    });

    next();
  };
};

// Utility for load testing
export class LoadTester {
  static async benchmark(
    fn: () => Promise<any>,
    options: {
      iterations?: number;
      concurrency?: number;
      warmup?: number;
    } = {}
  ): Promise<{
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
    rps: number;
    errors: number;
  }> {
    const { iterations = 100, concurrency = 10, warmup = 5 } = options;

    // Warmup
    for (let i = 0; i < warmup; i++) {
      try {
        await fn();
      } catch (e) {
        // Ignore warmup errors
      }
    }

    const results: number[] = [];
    const errors: number[] = [];
    const startTime = performance.now();

    // Run concurrent batches
    const batchSize = Math.ceil(iterations / concurrency);
    const batches: Promise<void>[] = [];

    for (let batch = 0; batch < concurrency; batch++) {
      const batchPromise = (async () => {
        for (let i = 0; i < batchSize && batch * batchSize + i < iterations; i++) {
          const iterStart = performance.now();
          try {
            await fn();
            results.push(performance.now() - iterStart);
          } catch (e) {
            errors.push(1);
          }
        }
      })();
      batches.push(batchPromise);
    }

    await Promise.all(batches);

    const totalTime = performance.now() - startTime;
    const sortedResults = results.sort((a, b) => a - b);

    return {
      totalTime,
      avgTime: results.reduce((a, b) => a + b, 0) / results.length,
      minTime: sortedResults[0] || 0,
      maxTime: sortedResults[sortedResults.length - 1] || 0,
      rps: (results.length / totalTime) * 1000,
      errors: errors.length,
    };
  }
}

// Memory leak detector
export class MemoryLeakDetector {
  private static snapshots: NodeJS.MemoryUsage[] = [];
  private static interval: NodeJS.Timeout | null = null;

  static start(intervalMs: number = 30000): void {
    if (this.interval) return;

    this.interval = setInterval(() => {
      const usage = process.memoryUsage();
      this.snapshots.push(usage);

      // Keep only last 20 snapshots
      if (this.snapshots.length > 20) {
        this.snapshots.shift();
      }

      // Check for memory leaks
      this.checkForLeaks();
    }, intervalMs);
  }

  static stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private static checkForLeaks(): void {
    if (this.snapshots.length < 5) return;

    const recent = this.snapshots.slice(-5);
    const trend = this.calculateTrend(recent.map(s => s.heapUsed));

    // If heap usage is consistently increasing over 50MB
    if (trend > 50 * 1024 * 1024) {
      console.warn('🚨 Potential memory leak detected! Heap usage trending upward:', {
        currentHeap: (recent[recent.length - 1].heapUsed / 1024 / 1024).toFixed(2) + 'MB',
        trend: (trend / 1024 / 1024).toFixed(2) + 'MB increase',
      });
    }
  }

  private static calculateTrend(values: number[]): number {
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = values.reduce((sum, _, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope * (n - 1); // Trend over the period
  }

  static getMemoryStats(): {
    current: NodeJS.MemoryUsage;
    trend: number;
    snapshots: number;
  } {
    const current = process.memoryUsage();
    const trend = this.snapshots.length >= 2
      ? this.calculateTrend(this.snapshots.slice(-5).map(s => s.heapUsed))
      : 0;

    return {
      current,
      trend,
      snapshots: this.snapshots.length,
    };
  }
} 