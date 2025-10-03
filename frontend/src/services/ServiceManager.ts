// Central Service Manager - Orchestrates all advanced services
import { ServiceWorkerManager } from './ServiceWorkerManager';
import { PushNotificationHandler } from './PushNotificationHandler';

export interface ServiceStatus {
  serviceWorker: {
    isRegistered: boolean;
    updateAvailable: boolean;
    isOnline: boolean;
  };
  pushNotifications: {
    isSupported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
  };
}

export interface ServiceManagerCallbacks {
  onServiceWorkerUpdate?: () => void;
  onNotificationPermissionChange?: (permission: NotificationPermission) => void;
  onServiceError?: (service: string, error: Error) => void;
}

export class ServiceManager {
  private serviceWorker: ServiceWorkerManager;
  private pushNotifications: PushNotificationHandler;
  private initialized: boolean = false;
  private callbacks: ServiceManagerCallbacks = {};

  // Configuration
  private readonly VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE'; // Replace with actual key

  constructor() {
    this.serviceWorker = new ServiceWorkerManager();
    this.pushNotifications = new PushNotificationHandler(this.VAPID_PUBLIC_KEY);
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      console.log('Initializing Service Manager...');

      // Set up service callbacks
      this.setupServiceCallbacks();

      // Initialize services in order
      await this.initializeServices();

      this.initialized = true;
      console.log('Service Manager initialized successfully');

      // Perform initial health check
      await this.performHealthCheck();

    } catch (error) {
      console.error('Service Manager initialization failed:', error);
      this.callbacks.onServiceError?.('ServiceManager', error as Error);
      throw error;
    }
  }

  /**
   * Set up callbacks for all services
   */
  private setupServiceCallbacks(): void {
    // Service Worker callbacks
    this.serviceWorker.setCallbacks({
      onUpdateAvailable: () => {
        console.log('Service Worker update available');
        this.callbacks.onServiceWorkerUpdate?.();
      },
      onUpdateActivated: () => {
        console.log('Service Worker updated and activated');
      },
      onOfflineReady: () => {
        console.log('App ready for offline use');
      },
      onError: (error) => {
        this.callbacks.onServiceError?.('ServiceWorker', error);
      }
    });

    // Push Notifications callbacks
    this.pushNotifications.setCallbacks({
      onPermissionGranted: () => {
        console.log('Push notification permission granted');
        this.callbacks.onNotificationPermissionChange?.('granted');
      },
      onPermissionDenied: () => {
        console.log('Push notification permission denied');
        this.callbacks.onNotificationPermissionChange?.('denied');
      },
      onSubscriptionChange: (subscription) => {
        console.log('Push subscription changed:', !!subscription);
      },
      onNotificationReceived: (payload) => {
        console.log('Notification received:', payload.title);
      },
      onError: (error) => {
        this.callbacks.onServiceError?.('PushNotifications', error);
      }
    });
  }

  /**
   * Initialize individual services
   */
  private async initializeServices(): Promise<void> {
    const initPromises = [
      this.serviceWorker.init(),
      // Background sync and push notifications initialize automatically
      // App update manager initializes in constructor
    ];

    await Promise.allSettled(initPromises);
  }

  /**
   * Perform health check on all services
   */
  async performHealthCheck(): Promise<ServiceStatus> {
    const status: ServiceStatus = {
      serviceWorker: this.serviceWorker.getRegistrationStatus(),
      pushNotifications: this.pushNotifications.getSubscriptionStatus()
    };

    console.log('Service Manager Health Check:', status);
    return status;
  }

  /**
   * Handle air quality data updates
   */
  async handleAirQualityUpdate(data: any): Promise<void> {
    // Send push notification if AQI is concerning
    if (data.aqi > 100) {
      const notification = this.pushNotifications.createAirQualityNotification(
        data.aqi,
        data.location,
        data.status
      );
      
      try {
        await this.pushNotifications.showNotification(notification);
      } catch (error) {
        console.error('Failed to show air quality notification:', error);
      }
    }
  }

  /**
   * Handle location updates
   */
  async handleLocationUpdate(location: any): Promise<void> {
    console.log('Location updated:', location);
    // Location handling logic would go here
  }

  /**
   * Handle analytics events
   */
  async trackAnalyticsEvent(event: any): Promise<void> {
    console.log('Analytics event:', event);
    // Analytics tracking logic would go here
  }

  /**
   * Request notification permissions and subscribe
   */
  async enableNotifications(): Promise<boolean> {
    try {
      const permission = await this.pushNotifications.requestPermission();
      if (permission === 'granted') {
        const subscription = await this.pushNotifications.subscribe();
        return !!subscription;
      }
      return false;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  }

  /**
   * Disable notifications
   */
  async disableNotifications(): Promise<boolean> {
    try {
      return await this.pushNotifications.unsubscribe();
    } catch (error) {
      console.error('Failed to disable notifications:', error);
      return false;
    }
  }

  /**
   * Clear all caches
   */
  async clearAllCaches(): Promise<void> {
    try {
      await this.serviceWorker.clearCache();
      console.log('All caches cleared');
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  }

  /**
   * Get comprehensive service statistics
   */
  async getServiceStatistics(): Promise<{
    cacheStats: any;
    notificationStatus: any;
    uptime: number;
  }> {
    const startTime = performance.now();
    
    try {
      const [cacheStats, notificationStatus] = await Promise.all([
        this.serviceWorker.getCacheStats(),
        Promise.resolve(this.pushNotifications.getSubscriptionStatus())
      ]);

      return {
        cacheStats,
        notificationStatus,
        uptime: performance.now() - startTime
      };
    } catch (error) {
      console.error('Failed to get service statistics:', error);
      throw error;
    }
  }

  /**
   * Set callbacks for service events
   */
  setCallbacks(callbacks: ServiceManagerCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get current service status
   */
  async getStatus(): Promise<ServiceStatus> {
    return await this.performHealthCheck();
  }

  /**
   * Test all services
   */
  async testAllServices(): Promise<{
    serviceWorker: boolean;
    pushNotifications: boolean;
  }> {
    const results = {
      serviceWorker: false,
      pushNotifications: false
    };

    try {
      // Test Service Worker
      const swStatus = this.serviceWorker.getRegistrationStatus();
      results.serviceWorker = swStatus.isRegistered;

      // Test Push Notifications
      if (this.pushNotifications.getSubscriptionStatus().isSupported) {
        await this.pushNotifications.testNotification();
        results.pushNotifications = true;
      }

    } catch (error) {
      console.error('Service testing failed:', error);
    }

    return results;
  }

  /**
   * Cleanup all services
   */
  destroy(): void {
    this.initialized = false;
    console.log('Service Manager destroyed');
  }
}