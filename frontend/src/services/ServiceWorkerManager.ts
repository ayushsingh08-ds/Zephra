// Service Worker Manager - Advanced SW lifecycle management
export class ServiceWorkerManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private updateAvailable: boolean = false;
  private callbacks: {
    onUpdateAvailable?: () => void;
    onUpdateActivated?: () => void;
    onOfflineReady?: () => void;
    onError?: (error: Error) => void;
  } = {};

  constructor() {
    this.init();
  }

  /**
   * Initialize service worker registration
   */
  async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.swRegistration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        this.setupUpdateHandlers();
        this.setupMessageHandlers();
        
        // Check for updates every 30 seconds when page is visible
        this.startUpdateChecker();

        console.log('ServiceWorker registered successfully');
        this.callbacks.onOfflineReady?.();
      } catch (error) {
        console.error('ServiceWorker registration failed:', error);
        this.callbacks.onError?.(error as Error);
      }
    }
  }

  /**
   * Set up update detection and handling
   */
  private setupUpdateHandlers(): void {
    if (!this.swRegistration) return;

    this.swRegistration.addEventListener('updatefound', () => {
      const newWorker = this.swRegistration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.updateAvailable = true;
            this.callbacks.onUpdateAvailable?.();
          }
        });
      }
    });

    // Handle controlling service worker change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      this.callbacks.onUpdateActivated?.();
      window.location.reload();
    });
  }

  /**
   * Set up message handlers for communication with SW
   */
  private setupMessageHandlers(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'SW_UPDATE_AVAILABLE':
          this.updateAvailable = true;
          this.callbacks.onUpdateAvailable?.();
          break;
        case 'SW_OFFLINE_READY':
          this.callbacks.onOfflineReady?.();
          break;
        case 'SW_ERROR':
          this.callbacks.onError?.(new Error(payload.message));
          break;
      }
    });
  }

  /**
   * Start periodic update checking
   */
  private startUpdateChecker(): void {
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Manually check for service worker updates
   */
  async checkForUpdates(): Promise<void> {
    if (this.swRegistration) {
      try {
        await this.swRegistration.update();
      } catch (error) {
        console.error('Update check failed:', error);
      }
    }
  }

  /**
   * Apply pending service worker update
   */
  async applyUpdate(): Promise<void> {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  /**
   * Get service worker registration status
   */
  getRegistrationStatus(): {
    isRegistered: boolean;
    updateAvailable: boolean;
    isOnline: boolean;
  } {
    return {
      isRegistered: !!this.swRegistration,
      updateAvailable: this.updateAvailable,
      isOnline: navigator.onLine
    };
  }

  /**
   * Set callback functions for SW events
   */
  setCallbacks(callbacks: {
    onUpdateAvailable?: () => void;
    onUpdateActivated?: () => void;
    onOfflineReady?: () => void;
    onError?: (error: Error) => void;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Send message to service worker
   */
  async sendMessage(message: any): Promise<any> {
    if (!this.swRegistration || !this.swRegistration.active) {
      throw new Error('Service Worker not active');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data);
        }
      };

      this.swRegistration!.active!.postMessage(message, [messageChannel.port2]);
    });
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalSize: number;
    cacheCount: number;
    caches: Array<{ name: string; size: number }>;
  }> {
    try {
      const response = await this.sendMessage({ type: 'GET_CACHE_STATS' });
      return response;
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return { totalSize: 0, cacheCount: 0, caches: [] };
    }
  }

  /**
   * Clear specific cache or all caches
   */
  async clearCache(cacheName?: string): Promise<void> {
    try {
      await this.sendMessage({ 
        type: 'CLEAR_CACHE', 
        cacheName 
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}