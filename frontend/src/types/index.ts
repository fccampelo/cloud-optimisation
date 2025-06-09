export interface Resource {
  id: string;
  name: string;
  type: string;
  region: string;
  status: string;
  hourlyRate: number;
  projectedMonthlyCost: number;
}

export interface AlertData {
  id:string;
  message: string;
  severity: string;
  resourceId: string;
  timestamp: string;
}

export interface Cost {
  totalHourly: number;
  projectedMonthly: number;
  costByService: { service: string, cost: number }[];
}

export interface Recommendation {
  resourceId: string;
  action: string;
  reason: string;
} 