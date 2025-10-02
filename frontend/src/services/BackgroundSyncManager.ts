// Background Sync Manager - Handle offline data synchronization
export interface SyncData {
  id: string;
  type: 'AIR_QUALITY_REQUEST' | 'USER_PREFERENCE' | 'LOCATION_UPDATE' | 'ANALYTICS_EVENT';
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface SyncQueueItem extends SyncData {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  expiresAt?: number;
}

export class BackgroundSyncManager {
  private syncQueue: SyncQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private readonly STORAGE_KEY = 'zephra_sync_queue';
  private readonly MAX_RETRY_DELAY = 300000; // 5 minutes
  private callbacks: {
    onSyncComplete?: (item: SyncQueueItem) => void;
    onSyncError?: (item: SyncQueueItem, error: Error) => void;
    onQueueUpdate?: (queueSize: number) => void;
  } = {};

  constructor() {
    this.init();
  }

  /**
   * Initialize background sync manager
   */
  private init(): void {
    this.loadQueueFromStorage();
    this.setupNetworkListeners();
    this.startPeriodicSync();
    
    // Register background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      this.registerBackgroundSync();
    }
  }

  /**
   * Set up network status listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Network: Online - Starting sync process');
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Network: Offline - Queuing operations');
    });
  }

  /**
   * Register background sync with service worker
   */
  private async registerBackgroundSync(): Promise<void> {
    try {
      await navigator.serviceWorker.ready;
      // Background sync registration would be handled by service worker
      // await registration.sync.register('background-sync-zephra');
      console.log('Background sync would be registered if supported');
    } catch (error) {
      console.error('Background sync registration failed:', error);
    }
  }

  /**
   * Start periodic sync for fallback when background sync is not available
   */
  private startPeriodicSync(): void {
    setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0 && !this.syncInProgress) {
        this.processSyncQueue();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Add item to sync queue
   */
  async addToQueue(
    type: SyncData['type'],
    payload: any,
    priority: SyncQueueItem['priority'] = 'MEDIUM',
    options?: {
      maxRetries?: number;
      expiresIn?: number; // milliseconds
    }
  ): Promise<string> {
    const id = this.generateId();
    const now = Date.now();
    
    const syncItem: SyncQueueItem = {
      id,
      type,
      payload,
      timestamp: now,
      retryCount: 0,
      maxRetries: options?.maxRetries || 3,
      priority,
      expiresAt: options?.expiresIn ? now + options.expiresIn : undefined
    };

    // Insert with priority ordering
    this.insertWithPriority(syncItem);
    await this.saveQueueToStorage();
    
    this.callbacks.onQueueUpdate?.(this.syncQueue.length);

    // Try to sync immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }

    return id;
  }

  /**
   * Insert item into queue based on priority
   */
  private insertWithPriority(item: SyncQueueItem): void {
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    const itemPriority = priorityOrder[item.priority];

    let insertIndex = this.syncQueue.length;
    for (let i = 0; i < this.syncQueue.length; i++) {
      const queuePriority = priorityOrder[this.syncQueue[i].priority];
      if (itemPriority < queuePriority) {
        insertIndex = i;
        break;
      }
    }

    this.syncQueue.splice(insertIndex, 0, item);
  }

  /**
   * Process sync queue
   */
  private async processSyncQueue(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`Processing sync queue: ${this.syncQueue.length} items`);

    // Remove expired items
    this.removeExpiredItems();

    while (this.syncQueue.length > 0 && this.isOnline) {
      const item = this.syncQueue[0];
      
      try {
        await this.syncItem(item);
        this.syncQueue.shift(); // Remove successful item
        this.callbacks.onSyncComplete?.(item);
        console.log(`Synced item: ${item.type} (${item.id})`);
      } catch (error) {
        console.error(`Sync failed for item ${item.id}:`, error);
        
        item.retryCount++;
        if (item.retryCount >= item.maxRetries) {
          // Remove failed item after max retries
          this.syncQueue.shift();
          this.callbacks.onSyncError?.(item, error as Error);
          console.log(`Item ${item.id} removed after ${item.maxRetries} retries`);
        } else {
          // Move to end for retry with exponential backoff
          this.syncQueue.shift();
          this.syncQueue.push(item);
          
          const delay = Math.min(
            1000 * Math.pow(2, item.retryCount),
            this.MAX_RETRY_DELAY
          );
          
          setTimeout(() => {
            if (this.isOnline) this.processSyncQueue();
          }, delay);
          
          break; // Stop processing queue for now
        }
      }
    }

    await this.saveQueueToStorage();
    this.callbacks.onQueueUpdate?.(this.syncQueue.length);
    this.syncInProgress = false;
  }

  /**
   * Sync individual item based on type
   */
  private async syncItem(item: SyncQueueItem): Promise<void> {
    switch (item.type) {
      case 'AIR_QUALITY_REQUEST':
        await this.syncAirQualityRequest(item.payload);
        break;
      case 'USER_PREFERENCE':
        await this.syncUserPreference(item.payload);
        break;
      case 'LOCATION_UPDATE':
        await this.syncLocationUpdate(item.payload);
        break;
      case 'ANALYTICS_EVENT':
        await this.syncAnalyticsEvent(item.payload);
        break;
      default:
        throw new Error(`Unknown sync type: ${item.type}`);
    }
  }

  /**
   * Sync air quality data request
   */
  private async syncAirQualityRequest(payload: any): Promise<void> {
    const response = await fetch('/api/air-quality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Sync user preferences
   */
  private async syncUserPreference(payload: any): Promise<void> {
    const response = await fetch('/api/user/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Sync location updates
   */
  private async syncLocationUpdate(payload: any): Promise<void> {
    const response = await fetch('/api/user/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Sync analytics events
   */
  private async syncAnalyticsEvent(payload: any): Promise<void> {
    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * Remove expired items from queue
   */
  private removeExpiredItems(): void {
    const now = Date.now();
    this.syncQueue = this.syncQueue.filter(item => 
      !item.expiresAt || item.expiresAt > now
    );
  }

  /**
   * Generate unique ID for sync items
   */
  private generateId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Save sync queue to localStorage
   */
  private async saveQueueToStorage(): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Load sync queue from localStorage
   */
  private loadQueueFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.syncQueue = JSON.parse(stored);
        // Remove expired items on load
        this.removeExpiredItems();
      }
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.syncQueue = [];
    }
  }

  /**
   * Get current queue status
   */
  getQueueStatus(): {
    totalItems: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
    isOnline: boolean;
    syncInProgress: boolean;
  } {
    return {
      totalItems: this.syncQueue.length,
      highPriority: this.syncQueue.filter(item => item.priority === 'HIGH').length,
      mediumPriority: this.syncQueue.filter(item => item.priority === 'MEDIUM').length,
      lowPriority: this.syncQueue.filter(item => item.priority === 'LOW').length,
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress
    };
  }

  /**
   * Set callback functions for sync events
   */
  setCallbacks(callbacks: {
    onSyncComplete?: (item: SyncQueueItem) => void;
    onSyncError?: (item: SyncQueueItem, error: Error) => void;
    onQueueUpdate?: (queueSize: number) => void;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Force sync queue processing
   */
  async forcSync(): Promise<void> {
    if (this.isOnline) {
      await this.processSyncQueue();
    }
  }

  /**
   * Clear all items from sync queue
   */
  async clearQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveQueueToStorage();
    this.callbacks.onQueueUpdate?.(0);
  }

  /**
   * Remove specific item from queue
   */
  async removeFromQueue(id: string): Promise<boolean> {
    const index = this.syncQueue.findIndex(item => item.id === id);
    if (index !== -1) {
      this.syncQueue.splice(index, 1);
      await this.saveQueueToStorage();
      this.callbacks.onQueueUpdate?.(this.syncQueue.length);
      return true;
    }
    return false;
  }
}