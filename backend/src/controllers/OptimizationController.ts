import { Request, Response } from 'express';
import { OptimizationService } from '../services';
import { ApiResponse, OptimizationResult } from '../models';
import { asyncHandler } from '../middleware';

export class OptimizationController {
  public generateRecommendations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const optimizationResult = await OptimizationService.generateRecommendations();
    
    const response: ApiResponse<OptimizationResult> = {
      success: true,
      data: optimizationResult,
      message: 'Optimization recommendations generated successfully',
    };

    res.status(200).json(response);
  });

  public getPotentialSavings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const potentialSavings = await OptimizationService.getPotentialSavings();
    
    const response: ApiResponse<{ totalSavings: number; savingsByAction: Record<string, number> }> = {
      success: true,
      data: potentialSavings,
      message: 'Potential savings calculated successfully',
    };

    res.status(200).json(response);
  });
}

export default new OptimizationController(); 