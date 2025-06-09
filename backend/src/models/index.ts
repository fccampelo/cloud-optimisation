export interface Resource {
  id: string;
  name: string;
  type: string;
  status: string;
  region: string;
  hourlyRate: number;
  tags: Record<string, string>;
  metrics: {
    cpu: number;
    memory: number;
    network: number;
  };
}

export interface Alert {
  id: string;
  resourceId: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  status: 'active' | 'resolved';
  metrics?: Record<string, number>;
}

export interface Cost {
  resourceId: string;
  amount: number;
  currency: string;
  period: string;
  breakdown: Record<string, number>;
  timestamp: string;
}

export interface Optimization {
  resourceId: string;
  type: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
  potentialSavings: number;
  implementation: string;
  risks: string[];
  timestamp: string;
}

export interface CostSummary {
  totalHourly: number;
  projectedMonthly: number;
}

export interface Recommendation {
  resourceId: number;
  action: string;
  reason: string;
}

export interface OptimizationResult {
  recommendations: Recommendation[];
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
} 