import * as client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'cloudops_',
});

const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'code'],
});

const activeConnections = new client.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
});

const cacheHitsTotal = new client.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache'],
});

const cacheMissesTotal = new client.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache'],
});

const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

const applicationErrorsTotal = new client.Counter({
  name: 'application_errors_total',
  help: 'Total number of application errors',
  labelNames: ['type', 'code'],
});

const resourcesTotal = new client.Gauge({
  name: 'resources_total',
  help: 'Total number of resources',
  labelNames: ['status', 'type'],
});

const alertsTotal = new client.Counter({
  name: 'alerts_total',
  help: 'Total number of alerts',
  labelNames: ['severity'],
});

const memoryUsage = new client.Gauge({
  name: 'memory_usage_bytes',
  help: 'Process memory usage',
  labelNames: ['type'],
});

const cpuUsage = new client.Gauge({
  name: 'cpu_usage_percentage',
  help: 'Process CPU usage',
});

const circuitBreakerState = new client.Gauge({
  name: 'circuit_breaker_state',
  help: 'Circuit breaker state (0=open, 1=half-open, 2=closed)',
  labelNames: ['name'],
});

const circuitBreakerFailures = new client.Counter({
  name: 'circuit_breaker_failures_total',
  help: 'Total number of circuit breaker failures',
  labelNames: ['name'],
});

const circuitBreakerSuccesses = new client.Counter({
  name: 'circuit_breaker_successes_total',
  help: 'Total number of circuit breaker successes',
  labelNames: ['name'],
});

register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeConnections);
register.registerMetric(cacheHitsTotal);
register.registerMetric(cacheMissesTotal);
register.registerMetric(dbQueryDuration);
register.registerMetric(applicationErrorsTotal);
register.registerMetric(resourcesTotal);
register.registerMetric(alertsTotal);
register.registerMetric(memoryUsage);
register.registerMetric(cpuUsage);
register.registerMetric(circuitBreakerState);
register.registerMetric(circuitBreakerFailures);
register.registerMetric(circuitBreakerSuccesses);

export const recordHttpRequest = (method: string, route: string, statusCode: number, duration: number) => {
  httpRequestDurationMicroseconds.labels(method, route, statusCode.toString()).observe(duration);
  httpRequestsTotal.labels(method, route, statusCode.toString()).inc();
};

export const recordCacheHit = (cacheType: string) => {
  cacheHitsTotal.labels(cacheType).inc();
};

export const recordCacheMiss = (cacheType: string) => {
  cacheMissesTotal.labels(cacheType).inc();
};

export const recordDbQuery = (operation: string, table: string, duration: number) => {
  dbQueryDuration.labels(operation, table).observe(duration);
};

export const recordError = (errorType: string, route: string) => {
  applicationErrorsTotal.labels(errorType, route).inc();
};

export const updateResourceMetrics = (resources: any[]) => {

  resourcesTotal.reset();
  

  const byStatus: Record<string, Record<string, number>> = {};
  
  resources.forEach(resource => {
    if (!byStatus[resource.status]) {
      byStatus[resource.status] = {};
    }
    if (!byStatus[resource.status][resource.type]) {
      byStatus[resource.status][resource.type] = 0;
    }
    byStatus[resource.status][resource.type]++;
  });


  Object.entries(byStatus).forEach(([status, types]) => {
    Object.entries(types).forEach(([type, count]) => {
      resourcesTotal.labels(status, type).set(count);
    });
  });
};

export const updateAlertMetrics = (alerts: any[]) => {

  alertsTotal.reset();
  

  const bySeverity: Record<string, number> = {};
  
  alerts.forEach(alert => {
    if (!bySeverity[alert.severity]) {
      bySeverity[alert.severity] = 0;
    }
    bySeverity[alert.severity]++;
  });


  Object.entries(bySeverity).forEach(([severity, count]) => {
    alertsTotal.labels(severity).set(count);
  });
};

function updateMetrics() {
  const usage = process.memoryUsage();
  memoryUsage.labels({ type: 'rss' }).set(usage.rss);
  memoryUsage.labels({ type: 'heapTotal' }).set(usage.heapTotal);
  memoryUsage.labels({ type: 'heapUsed' }).set(usage.heapUsed);
  memoryUsage.labels({ type: 'external' }).set(usage.external);

  const startUsage = process.cpuUsage();
  setTimeout(() => {
    const endUsage = process.cpuUsage(startUsage);
    const userPercent = (endUsage.user / 1000000) * 100;
    const systemPercent = (endUsage.system / 1000000) * 100;
    cpuUsage.set(userPercent + systemPercent);
  }, 1000);
}

setInterval(updateMetrics, 10000);
updateMetrics();

export {
  register,
  httpRequestDurationMicroseconds,
  httpRequestsTotal,
  activeConnections,
  cacheHitsTotal,
  cacheMissesTotal,
  applicationErrorsTotal,
  resourcesTotal,
  alertsTotal,
  memoryUsage,
  cpuUsage,
  circuitBreakerState,
  circuitBreakerFailures,
  circuitBreakerSuccesses,
}; 