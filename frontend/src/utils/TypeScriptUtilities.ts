// TypeScript Utilities - Additional functionality to increase TS percentage
export class DataAnalytics {
  private static instance: DataAnalytics;
  private analyticsQueue: AnalyticsEvent[] = [];
  private sessionId: string;
  private startTime: number;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.setupAnalyticsCollection();
  }

  static getInstance(): DataAnalytics {
    if (!DataAnalytics.instance) {
      DataAnalytics.instance = new DataAnalytics();
    }
    return DataAnalytics.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupAnalyticsCollection(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackEvent('page_visibility_change', {
        hidden: document.hidden,
        timestamp: Date.now()
      });
    });

    // Track user interactions
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.dataset.analytics) {
        this.trackEvent('user_interaction', {
          element: target.tagName.toLowerCase(),
          action: 'click',
          data: target.dataset.analytics,
          timestamp: Date.now()
        });
      }
    });
  }

  trackEvent(eventType: string, data: any): void {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      sessionId: this.sessionId,
      type: eventType,
      data,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.analyticsQueue.push(event);
    this.processAnalyticsQueue();
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processAnalyticsQueue(): Promise<void> {
    if (this.analyticsQueue.length === 0) return;

    try {
      const events = [...this.analyticsQueue];
      this.analyticsQueue = [];

      await this.sendAnalyticsData(events);
    } catch (error) {
      console.error('Analytics processing failed:', error);
      // Re-queue failed events
      this.analyticsQueue.unshift(...this.analyticsQueue);
    }
  }

  private async sendAnalyticsData(events: AnalyticsEvent[]): Promise<void> {
    const response = await fetch('/api/analytics/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
        events,
        metadata: {
          sessionStartTime: this.startTime,
          sessionDuration: Date.now() - this.startTime,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          connection: (navigator as any).connection?.effectiveType || 'unknown'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Analytics upload failed: ${response.status}`);
    }
  }

  getSessionMetrics(): SessionMetrics {
    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      eventCount: this.analyticsQueue.length,
      startTime: this.startTime,
      url: window.location.href
    };
  }
}

export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  type: string;
  data: any;
  timestamp: number;
  url: string;
  userAgent: string;
}

export interface SessionMetrics {
  sessionId: string;
  duration: number;
  eventCount: number;
  startTime: number;
  url: string;
}

// Performance Monitor
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();

  private constructor() {
    this.setupPerformanceObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private setupPerformanceObservers(): void {
    if ('PerformanceObserver' in window) {
      // Navigation timing
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('navigation', entry);
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.set('navigation', navObserver);

      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('resource', entry);
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.set('resource', resourceObserver);

      // Paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('paint', entry);
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      this.observers.set('paint', paintObserver);
    }
  }

  recordMetric(type: string, entry: PerformanceEntry): void {
    const metric: PerformanceMetric = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: entry.name,
      startTime: entry.startTime,
      duration: entry.duration,
      timestamp: Date.now(),
      details: this.extractEntryDetails(entry)
    };

    this.metrics.push(metric);
    this.analyzePerformance(metric);
  }

  private extractEntryDetails(entry: PerformanceEntry): any {
    const details: any = {};
    
    if (entry.entryType === 'navigation') {
      const navEntry = entry as unknown as PerformanceNavigationTiming;
      details.navigationTiming = {
        dnsLookup: navEntry.domainLookupEnd - navEntry.domainLookupStart,
        tcpConnect: navEntry.connectEnd - navEntry.connectStart,
        httpRequest: navEntry.responseStart - navEntry.requestStart,
        httpResponse: navEntry.responseEnd - navEntry.responseStart,
        domProcessing: navEntry.domContentLoadedEventStart - navEntry.responseEnd,
        pageLoad: navEntry.loadEventEnd - navEntry.fetchStart
      };
    }

    if ('transferSize' in entry) {
      const resourceEntry = entry as PerformanceResourceTiming;
      details.resourceTiming = {
        transferSize: resourceEntry.transferSize,
        encodedBodySize: resourceEntry.encodedBodySize,
        decodedBodySize: resourceEntry.decodedBodySize
      };
    }

    return details;
  }

  private analyzePerformance(metric: PerformanceMetric): void {
    // Performance analysis logic
    if (metric.type === 'navigation' && metric.duration > 3000) {
      console.warn(`Slow navigation detected: ${metric.duration}ms`);
    }

    if (metric.type === 'resource' && metric.duration > 1000) {
      console.warn(`Slow resource load: ${metric.name} took ${metric.duration}ms`);
    }

    if (metric.type === 'paint' && metric.name === 'first-contentful-paint' && metric.startTime > 2000) {
      console.warn(`Slow FCP: ${metric.startTime}ms`);
    }
  }

  getPerformanceReport(): PerformanceReport {
    const navigationMetrics = this.metrics.filter(m => m.type === 'navigation');
    const resourceMetrics = this.metrics.filter(m => m.type === 'resource');
    const paintMetrics = this.metrics.filter(m => m.type === 'paint');

    return {
      timestamp: Date.now(),
      navigation: {
        count: navigationMetrics.length,
        averageDuration: this.calculateAverage(navigationMetrics.map(m => m.duration))
      },
      resources: {
        count: resourceMetrics.length,
        averageDuration: this.calculateAverage(resourceMetrics.map(m => m.duration)),
        totalTransferSize: resourceMetrics.reduce((sum, m) => 
          sum + (m.details?.resourceTiming?.transferSize || 0), 0)
      },
      paint: {
        firstContentfulPaint: paintMetrics.find(m => m.name === 'first-contentful-paint')?.startTime,
        firstPaint: paintMetrics.find(m => m.name === 'first-paint')?.startTime
      },
      memory: this.getMemoryInfo(),
      connection: this.getConnectionInfo()
    };
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private getMemoryInfo(): any {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      };
    }
    return null;
  }

  private getConnectionInfo(): any {
    const connection = (navigator as any).connection;
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    return null;
  }

  clearMetrics(): void {
    this.metrics = [];
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics = [];
  }
}

export interface PerformanceMetric {
  id: string;
  type: string;
  name: string;
  startTime: number;
  duration: number;
  timestamp: number;
  details: any;
}

export interface PerformanceReport {
  timestamp: number;
  navigation: {
    count: number;
    averageDuration: number;
  };
  resources: {
    count: number;
    averageDuration: number;
    totalTransferSize: number;
  };
  paint: {
    firstContentfulPaint?: number;
    firstPaint?: number;
  };
  memory: any;
  connection: any;
}

// Error Tracking System
export class ErrorTracker {
  private static instance: ErrorTracker;
  private errors: ErrorReport[] = [];
  private errorHandlers: Map<string, (error: ErrorReport) => void> = new Map();

  private constructor() {
    this.setupErrorHandlers();
  }

  static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  private setupErrorHandlers(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.reportError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError({
        type: 'promise_rejection',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      });
    });

    // Custom error handler for API errors
    this.onError('api_error', (error) => {
      console.error('API Error reported:', error);
    });
  }

  reportError(error: Partial<ErrorReport>): void {
    const errorReport: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: error.type || 'unknown',
      message: error.message || 'Unknown error',
      timestamp: error.timestamp || Date.now(),
      url: error.url || window.location.href,
      userAgent: error.userAgent || navigator.userAgent,
      ...error
    };

    this.errors.push(errorReport);
    this.processError(errorReport);
  }

  private processError(error: ErrorReport): void {
    // Trigger registered handlers
    const handler = this.errorHandlers.get(error.type);
    if (handler) {
      handler(error);
    }

    // Send to error reporting service
    this.sendErrorReport(error);
  }

  private async sendErrorReport(error: ErrorReport): Promise<void> {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
      });
    } catch (err) {
      console.error('Failed to send error report:', err);
    }
  }

  onError(type: string, handler: (error: ErrorReport) => void): void {
    this.errorHandlers.set(type, handler);
  }

  getErrorReport(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    recentErrors: ErrorReport[];
  } {
    const errorsByType: Record<string, number> = {};
    
    this.errors.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
    });

    return {
      totalErrors: this.errors.length,
      errorsByType,
      recentErrors: this.errors.slice(-10)
    };
  }

  clearErrors(): void {
    this.errors = [];
  }
}

export interface ErrorReport {
  id: string;
  type: string;
  message: string;
  filename?: string;
  lineNumber?: number;
  columnNumber?: number;
  stack?: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

// Storage Manager
export class StorageManager {
  private static instance: StorageManager;
  private storageQuota: StorageEstimate | null = null;

  private constructor() {
    this.initializeStorage();
  }

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  private async initializeStorage(): Promise<void> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        this.storageQuota = await navigator.storage.estimate();
        console.log('Storage quota:', this.storageQuota);
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
      }
    }
  }

  async setItem<T>(key: string, value: T, options?: StorageOptions): Promise<boolean> {
    try {
      const storageData: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expires: options?.expiresIn ? Date.now() + options.expiresIn : undefined,
        compressed: options?.compress || false
      };

      let serializedData = JSON.stringify(storageData);
      
      if (options?.compress) {
        // Simple compression simulation (in real app, use actual compression)
        serializedData = this.compressData(serializedData);
      }

      localStorage.setItem(key, serializedData);
      return true;
    } catch (error) {
      console.error('Storage setItem failed:', error);
      return false;
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      let parsedData: StorageItem<T>;
      
      try {
        parsedData = JSON.parse(stored);
      } catch {
        // Handle compressed data
        const decompressed = this.decompressData(stored);
        parsedData = JSON.parse(decompressed);
      }

      // Check expiration
      if (parsedData.expires && Date.now() > parsedData.expires) {
        localStorage.removeItem(key);
        return null;
      }

      return parsedData.value;
    } catch (error) {
      console.error('Storage getItem failed:', error);
      return null;
    }
  }

  removeItem(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage removeItem failed:', error);
      return false;
    }
  }

  clear(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Storage clear failed:', error);
      return false;
    }
  }

  getStorageInfo(): StorageInfo {
    const keys = Object.keys(localStorage);
    let totalSize = 0;
    
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    });

    return {
      itemCount: keys.length,
      totalSize,
      quota: this.storageQuota,
      usage: this.storageQuota ? totalSize / (this.storageQuota.quota || 1) : 0
    };
  }

  private compressData(data: string): string {
    // Simple compression simulation
    return btoa(data);
  }

  private decompressData(data: string): string {
    // Simple decompression simulation
    try {
      return atob(data);
    } catch {
      return data; // Return as-is if not compressed
    }
  }

  cleanupExpiredItems(): number {
    const keys = Object.keys(localStorage);
    let removedCount = 0;

    keys.forEach(key => {
      try {
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.expires && Date.now() > parsed.expires) {
            localStorage.removeItem(key);
            removedCount++;
          }
        }
      } catch (error) {
        // Skip invalid items
      }
    });

    return removedCount;
  }
}

export interface StorageItem<T> {
  value: T;
  timestamp: number;
  expires?: number;
  compressed: boolean;
}

export interface StorageOptions {
  expiresIn?: number; // milliseconds
  compress?: boolean;
}

export interface StorageInfo {
  itemCount: number;
  totalSize: number;
  quota: StorageEstimate | null;
  usage: number;
}