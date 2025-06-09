import { Request, Response } from 'express';
import { ResourceService } from '../services';
import { ApiResponse, Resource } from '../models';
import { asyncHandler, createError } from '../middleware';

export class ResourceController {
  public getAllResources = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const resources = await ResourceService.getAllResources();
    
    const response: ApiResponse<Resource[]> = {
      success: true,
      data: resources,
      message: 'Resources retrieved successfully',
    };

    res.status(200).json(response);
  });

  public getResourceById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const resourceId = parseInt(id, 10);

    if (isNaN(resourceId)) {
      throw createError('Invalid resource ID', 400);
    }

    const resource = await ResourceService.getResourceById(resourceId);

    if (!resource) {
      throw createError('Resource not found', 404);
    }

    const response: ApiResponse<Resource> = {
      success: true,
      data: resource,
      message: 'Resource retrieved successfully',
    };

    res.status(200).json(response);
  });

  public getResourcesByStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { status } = req.query;

    if (!status || typeof status !== 'string') {
      throw createError('Status parameter is required', 400);
    }

    const resources = await ResourceService.getResourcesByStatus(status);

    const response: ApiResponse<Resource[]> = {
      success: true,
      data: resources,
      message: `Resources with status '${status}' retrieved successfully`,
    };

    res.status(200).json(response);
  });

  public createResource = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, type, status, hourlyRate, region } = req.body;

    if (!name || !type || !status || !hourlyRate) {
      throw createError('Missing required fields: name, type, status, hourlyRate', 400);
    }

    const newResource = await ResourceService.addResource({
      name,
      type,
      status,
      hourlyRate: parseFloat(hourlyRate),
      region,
    });

    const response: ApiResponse<Resource> = {
      success: true,
      data: newResource,
      message: 'Resource created successfully',
    };

    res.status(201).json(response);
  });

  public updateResource = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const resourceId = parseInt(id, 10);

    if (isNaN(resourceId)) {
      throw createError('Invalid resource ID', 400);
    }

    const updates = req.body;
    const updatedResource = await ResourceService.updateResource(resourceId, updates);

    if (!updatedResource) {
      throw createError('Resource not found', 404);
    }

    const response: ApiResponse<Resource> = {
      success: true,
      data: updatedResource,
      message: 'Resource updated successfully',
    };

    res.status(200).json(response);
  });

  public deleteResource = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const resourceId = parseInt(id, 10);

    if (isNaN(resourceId)) {
      throw createError('Invalid resource ID', 400);
    }

    const deleted = await ResourceService.deleteResource(resourceId);

    if (!deleted) {
      throw createError('Resource not found', 404);
    }

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: 'Resource deleted successfully',
    };

    res.status(200).json(response);
  });

  public getCacheStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const stats = await ResourceService.getCacheStats();

    const response: ApiResponse<any> = {
      success: true,
      data: stats,
      message: 'Cache statistics retrieved successfully',
    };

    res.status(200).json(response);
  });
}

export default new ResourceController(); 