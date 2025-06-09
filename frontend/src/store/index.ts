import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Resource, AlertData, Cost } from '../types';

// Resource Store
interface ResourceState {
  resources: Resource[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  searchTerm: string;
  statusFilter: string;
  setResources: (resources: Resource[]) => void;
  addResource: (resource: Resource) => void;
  updateResource: (id: string, updates: Partial<Resource>) => void;
  deleteResource: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  clearFilters: () => void;
}

export const useResourceStore = create<ResourceState>()(
  subscribeWithSelector((set, get) => ({
    resources: [],
    loading: false,
    error: null,
    lastUpdated: 0,
    searchTerm: '',
    statusFilter: '',
    
    setResources: (resources) => set({ 
      resources, 
      lastUpdated: Date.now(),
      error: null 
    }),
    
    addResource: (resource) => set((state) => ({
      resources: [...state.resources, resource],
      lastUpdated: Date.now(),
    })),
    
    updateResource: (id, updates) => set((state) => ({
      resources: state.resources.map(r => 
        r.id === id ? { ...r, ...updates } : r
      ),
      lastUpdated: Date.now(),
    })),
    
    deleteResource: (id) => set((state) => ({
      resources: state.resources.filter(r => r.id !== id),
      lastUpdated: Date.now(),
    })),
    
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setSearchTerm: (searchTerm) => set({ searchTerm }),
    setStatusFilter: (statusFilter) => set({ statusFilter }),
    clearFilters: () => set({ searchTerm: '', statusFilter: '' }),
  }))
);

// Alert Store
interface AlertState {
  alerts: AlertData[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  severityFilter: string;
  setAlerts: (alerts: AlertData[]) => void;
  addAlert: (alert: AlertData) => void;
  markAsRead: (id: string) => void;
  setSeverityFilter: (severity: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAlertStore = create<AlertState>()(
  subscribeWithSelector((set, get) => ({
    alerts: [],
    unreadCount: 0,
    loading: false,
    error: null,
    severityFilter: '',
    
    setAlerts: (alerts) => set({ 
      alerts,
      unreadCount: alerts.length, // Simplified - treat all as unread initially
      error: null 
    }),
    
    addAlert: (alert) => set((state) => ({
      alerts: [alert, ...state.alerts],
      unreadCount: state.unreadCount + 1,
    })),
    
    markAsRead: (id) => set((state) => {
      // For now, just decrease unread count since we don't have read property
      return {
        alerts: state.alerts,
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    }),
    
    setSeverityFilter: (severityFilter) => set({ severityFilter }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  }))
);

// Application Store
interface AppState {
  theme: 'light' | 'dark';
  notifications: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
  connected: boolean;
  toggleTheme: () => void;
  setNotifications: (enabled: boolean) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (interval: number) => void;
  setConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    theme: 'light',
    notifications: true,
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
    connected: true,
    
    toggleTheme: () => set((state) => ({
      theme: state.theme === 'light' ? 'dark' : 'light'
    })),
    
    setNotifications: (notifications) => set({ notifications }),
    setAutoRefresh: (autoRefresh) => set({ autoRefresh }),
    setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
    setConnected: (connected) => set({ connected }),
  }))
);

// Cost Store
interface CostState {
  costs: Cost | null;
  trend: { month: string; cost: number }[];
  loading: boolean;
  error: string | null;
  setCosts: (costs: Cost) => void;
  setTrend: (trend: { month: string; cost: number }[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCostStore = create<CostState>()(
  subscribeWithSelector((set, get) => ({
    costs: null,
    trend: [],
    loading: false,
    error: null,
    
    setCosts: (costs) => set({ costs, error: null }),
    setTrend: (trend) => set({ trend }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
  }))
);

// Selectors for computed values
export const getFilteredResources = () => {
  const { resources, searchTerm, statusFilter } = useResourceStore.getState();
  
  return resources.filter(resource => {
    const matchesSearch = !searchTerm || 
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || resource.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });
};

export const getFilteredAlerts = () => {
  const { alerts, severityFilter } = useAlertStore.getState();
  
  return alerts.filter(alert => {
    const matchesSeverity = !severityFilter || alert.severity === severityFilter;
    return matchesSeverity;
  });
}; 