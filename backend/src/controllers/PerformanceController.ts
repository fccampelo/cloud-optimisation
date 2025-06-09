import { Request, Response } from 'express';
import { ApiResponse } from '../models';
import { asyncHandler } from '../middleware';
import { PerformanceProfiler, LoadTester, MemoryLeakDetector } from '../utils/performance';
import { ResourceService } from '../services';

export class PerformanceController {
  public getPerformanceStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stats = PerformanceProfiler.getAllStats();
    const memoryStats = MemoryLeakDetector.getMemoryStats();

    const response: ApiResponse = {
      success: true,
      data: {
        performance: stats,
        memory: memoryStats,
        uptime: process.uptime(),
        version: process.version,
      },
      message: 'Performance statistics retrieved successfully',
    };

    res.status(200).json(response);
  });

  public runLoadTest = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { iterations = 50, concurrency = 5 } = req.body;

    const results = await LoadTester.benchmark(
      async () => {
        await ResourceService.getAllResources();
      },
      { iterations, concurrency }
    );

    const response: ApiResponse = {
      success: true,
      data: {
        loadTest: results,
        testConfig: { iterations, concurrency },
        timestamp: new Date().toISOString(),
      },
      message: 'Load test completed successfully',
    };

    res.status(200).json(response);
  });

  public getSystemHealth = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    const memoryInMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100,
    };

    const health = {
      status: 'healthy',
      uptime: process.uptime(),
      memory: memoryInMB,
      cpu: cpuUsage,
      pid: process.pid,
      environment: process.env.NODE_ENV,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    };

    if (memoryInMB.heapUsed > 400) {
      health.status = 'warning - high memory usage';
    }

    const response: ApiResponse = {
      success: true,
      data: health,
      message: 'System health check completed',
    };

    res.status(200).json(response);
  });

  public triggerGarbageCollection = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const beforeGC = process.memoryUsage();
    
    if (global.gc) {
      global.gc();
    }
    
    const afterGC = process.memoryUsage();
    
    const freed = {
      rss: beforeGC.rss - afterGC.rss,
      heapUsed: beforeGC.heapUsed - afterGC.heapUsed,
      heapTotal: beforeGC.heapTotal - afterGC.heapTotal,
      external: beforeGC.external - afterGC.external,
    };

    const response: ApiResponse = {
      success: true,
      data: {
        gcAvailable: !!global.gc,
        before: beforeGC,
        after: afterGC,
        freed: freed,
        freedMB: {
          rss: Math.round(freed.rss / 1024 / 1024 * 100) / 100,
          heapUsed: Math.round(freed.heapUsed / 1024 / 1024 * 100) / 100,
        },
      },
      message: global.gc ? 'Garbage collection triggered' : 'Garbage collection not available (use --expose-gc flag)',
    };

    res.status(200).json(response);
  });
}

export default new PerformanceController(); 