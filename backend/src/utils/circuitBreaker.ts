import { logger } from './logger';

export enum CircuitState {
  CLOSED = 'CLOSED',     
  OPEN = 'OPEN',         
  HALF_OPEN = 'HALF_OPEN' 
}

export interface CircuitBreakerOptions {
  failureThreshold: number;      
  successThreshold: number;      
  timeout: number;               
  resetTimeout: number;          
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  nextAttempt: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private nextAttempt: number = 0;
  private totalRequests: number = 0;
  private totalFailures: number = 0;
  private totalSuccesses: number = 0;

  constructor(
    private name: string,
    private options: CircuitBreakerOptions = {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000,        
      resetTimeout: 300000,  
    }
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    if (this.state === CircuitState.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker '${this.name}' is OPEN. Next attempt in ${this.nextAttempt - Date.now()}ms`);
      }
      
      
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
      logger.info(`Circuit breaker '${this.name}' transitioning to HALF_OPEN`);
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.totalSuccesses++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      
      if (this.successCount >= this.options.successThreshold) {
        this.close();
      }
    } else if (this.state === CircuitState.CLOSED) {
      
      this.failureCount = 0;
    }
  }

  private onFailure(): void {
    this.totalFailures++;
    this.failureCount++;

    if (this.state === CircuitState.HALF_OPEN) {
      this.open();
    } else if (this.state === CircuitState.CLOSED && this.failureCount >= this.options.failureThreshold) {
      this.open();
    }

    logger.warn(`Circuit breaker '${this.name}' failure`, {
      state: this.state,
      failureCount: this.failureCount,
      threshold: this.options.failureThreshold,
    });
  }

  private open(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.options.timeout;
    
    logger.error(`Circuit breaker '${this.name}' opened due to failures`, {
      failureCount: this.failureCount,
      nextAttempt: new Date(this.nextAttempt).toISOString(),
    });

    
    setTimeout(() => {
      if (this.state === CircuitState.OPEN) {
        this.failureCount = 0;
        logger.info(`Circuit breaker '${this.name}' failure count reset`);
      }
    }, this.options.resetTimeout);
  }

  private close(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    
    logger.info(`Circuit breaker '${this.name}' closed - service recovered`);
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      nextAttempt: this.nextAttempt,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  
  forceOpen(): void {
    this.state = CircuitState.OPEN;
    this.nextAttempt = Date.now() + this.options.timeout;
    logger.warn(`Circuit breaker '${this.name}' manually opened`);
  }

  forceClose(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    logger.info(`Circuit breaker '${this.name}' manually closed`);
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.totalRequests = 0;
    this.totalFailures = 0;
    this.totalSuccesses = 0;
    logger.info(`Circuit breaker '${this.name}' reset`);
  }
}


export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private breakers: Map<string, CircuitBreaker> = new Map();

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  getOrCreate(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    return this.breakers.get(name)!;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
    logger.info('All circuit breakers reset');
  }
}


export const circuitBreakerRegistry = CircuitBreakerRegistry.getInstance();


export function withCircuitBreaker(name: string, options?: CircuitBreakerOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const breaker = circuitBreakerRegistry.getOrCreate(name, options);
      return breaker.execute(() => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}


export async function protectedCall<T>(
  name: string,
  operation: () => Promise<T>,
  options?: CircuitBreakerOptions
): Promise<T> {
  const breaker = circuitBreakerRegistry.getOrCreate(name, options);
  return breaker.execute(operation);
} 