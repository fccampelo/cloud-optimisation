import { Request, Response } from 'express';
import { AlertService } from '../services';
import { ApiResponse, Alert } from '../models';
import { asyncHandler, createError } from '../middleware';

export class AlertController {
  public getAllAlerts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const alerts = AlertService.getAllAlerts();
    
    const response: ApiResponse<Alert[]> = {
      success: true,
      data: alerts,
      message: 'Alerts retrieved successfully',
    };

    res.status(200).json(response);
  });

  public getAlertById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const alertId = parseInt(id, 10);

    if (isNaN(alertId)) {
      throw createError('Invalid alert ID', 400);
    }

    const alert = AlertService.getAlertById(alertId);

    if (!alert) {
      throw createError('Alert not found', 404);
    }

    const response: ApiResponse<Alert> = {
      success: true,
      data: alert,
      message: 'Alert retrieved successfully',
    };

    res.status(200).json(response);
  });

  public getAlertsBySeverity = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { severity } = req.query;

    if (!severity || typeof severity !== 'string') {
      throw createError('Severity parameter is required', 400);
    }

    if (!['critical', 'warning', 'info'].includes(severity)) {
      throw createError('Invalid severity level. Must be: critical, warning, or info', 400);
    }

    const alerts = AlertService.getAlertsBySeverity(severity as Alert['severity']);

    const response: ApiResponse<Alert[]> = {
      success: true,
      data: alerts,
      message: `Alerts with severity '${severity}' retrieved successfully`,
    };

    res.status(200).json(response);
  });

  public getCriticalAlerts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const alerts = AlertService.getCriticalAlerts();

    const response: ApiResponse<Alert[]> = {
      success: true,
      data: alerts,
      message: 'Critical alerts retrieved successfully',
    };

    res.status(200).json(response);
  });

  public getAlertsByResource = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { resourceId } = req.params;
    const id = parseInt(resourceId, 10);

    if (isNaN(id)) {
      throw createError('Invalid resource ID', 400);
    }

    const alerts = AlertService.getAlertsByResourceId(id);

    const response: ApiResponse<Alert[]> = {
      success: true,
      data: alerts,
      message: `Alerts for resource ${id} retrieved successfully`,
    };

    res.status(200).json(response);
  });
}

export default new AlertController(); 