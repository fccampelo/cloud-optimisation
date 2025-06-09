import { Request, Response } from 'express';
import { CostService } from '../services';
import { ApiResponse, CostSummary } from '../models';
import { asyncHandler } from '../middleware';

export class CostController {
  public getCostSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const costSummary = await CostService.getCostSummary();
    
    const response: ApiResponse<CostSummary> = {
      success: true,
      data: costSummary,
      message: 'Cost summary retrieved successfully',
    };

    res.status(200).json(response);
  });

  public getCostByResourceType = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const costByType = await CostService.getCostByResourceType();
    
    const response: ApiResponse<Record<string, number>> = {
      success: true,
      data: costByType,
      message: 'Cost breakdown by resource type retrieved successfully',
    };

    res.status(200).json(response);
  });

  public getProjectedSavings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const projectedSavings = await CostService.getProjectedSavings();
    
    const response: ApiResponse<number> = {
      success: true,
      data: projectedSavings,
      message: 'Projected savings retrieved successfully',
    };

    res.status(200).json(response);
  });

  public getCostTrend = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const costTrend = await CostService.getCostTrend();
    
    const response: ApiResponse<{ month: string; cost: number }[]> = {
      success: true,
      data: costTrend,
      message: 'Cost trend data retrieved successfully',
    };

    res.status(200).json(response);
  });
}

export default new CostController(); 