// Central Service Manager - Orchestrates all advanced services
import { ServiceWorkerManager } from './ServiceWorkerManager';
import { BackgroundSyncManager } from './BackgroundSyncManager';
import { PushNotificationHandler } from './PushNotificationHandler';
import { AppUpdateManager, type AppVersion } from './AppUpdateManager';

export interface ServiceStatus {
  serviceWorker: {
    isRegistered: boolean;
    updateAvailable: boolean;
    isOnline: boolean;
  };
  backgroundSync: {
    totalItems: number;
    isOnline: boolean;
    syncInProgress: boolean;
  };
  pushNotifications: {
    isSupported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
  };
  appUpdate: {
    updateAvailable: boolean;
    updateInProgress: boolean;
    currentVersion: string;
  };
}

export interface ServiceManagerCallbacks {
  onServiceWorkerUpdate?: () => void;
  onBackgroundSyncComplete?: (queueSize: number) => void;
  onNotificationPermissionChange?: (permission: NotificationPermission) => void;
  onAppUpdateAvailable?: (version: string) => void;
  onServiceError?: (service: string, error: Error) => void;
}

export class ServiceManager {
  private serviceWorker: ServiceWorkerManager;
  private backgroundSync: BackgroundSyncManager;
  private pushNotifications: PushNotificationHandler;
  private appUpdate: AppUpdateManager;
  private initialized: boolean = false;
  private callbacks: ServiceManagerCallbacks = {};

  // Configuration
  private readonly VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE'; // Replace with actual key
  private readonly CURRENT_APP_VERSION: AppVersion = {
    version: '1.0.0',
    buildNumber: '1001',
    releaseDate: '2025-10-02',
    features: [
      'Real-time air quality monitoring',
      'PWA support with offline functionality',
      'Push notifications for air quality alerts',
      'Background data synchronization',
      'Automatic app updates'
    ],
    bugFixes: [
      'Fixed mobile navigation expansion',
      'Improved animation smoothness',
      'Enhanced offline mode stability'
    ]
  };

  constructor() {
    this.serviceWorker = new ServiceWorkerManager();
    this.backgroundSync = new BackgroundSyncManager();
    this.pushNotifications = new PushNotificationHandler(this.VAPID_PUBLIC_KEY);
    this.appUpdate = new AppUpdateManager(this.CURRENT_APP_VERSION);
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

    // Background Sync callbacks
    this.backgroundSync.setCallbacks({
      onSyncComplete: (item) => {
        console.log(`Background sync completed: ${item.type}`);
      },
      onSyncError: (item, error) => {
        console.error(`Background sync failed for ${item.type}:`, error);
        this.callbacks.onServiceError?.('BackgroundSync', error);
      },
      onQueueUpdate: (queueSize) => {
        this.callbacks.onBackgroundSyncComplete?.(queueSize);
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

    // App Update callbacks
    this.appUpdate.setCallbacks({
      onUpdateAvailable: (updateInfo) => {
        console.log(`App update available: ${updateInfo.version.version}`);
        this.callbacks.onAppUpdateAvailable?.(updateInfo.version.version);
      },
      onUpdateComplete: (version) => {
        console.log(`App updated to version: ${version.version}`);
      },
      onUpdateError: (error) => {
        this.callbacks.onServiceError?.('AppUpdate', error);
      },
      onVersionChange: (oldVersion, newVersion) => {
        console.log(`Version changed: ${oldVersion.version} → ${newVersion.version}`);
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
      backgroundSync: this.backgroundSync.getQueueStatus(),
      pushNotifications: this.pushNotifications.getSubscriptionStatus(),
      appUpdate: this.appUpdate.getUpdateStatus()
    };

    console.log('Service Manager Health Check:', status);
    return status;
  }

  /**
   * Handle air quality data updates
   */
  async handleAirQualityUpdate(data: any): Promise<void> {
    // Queue for background sync if offline
    if (!navigator.onLine) {
      await this.backgroundSync.addToQueue(
        'AIR_QUALITY_REQUEST',
        data,
        'HIGH'
      );
    }

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
   * Handle user preference updates
   */
  async handleUserPreferenceUpdate(preferences: any): Promise<void> {
    if (!navigator.onLine) {
      await this.backgroundSync.addToQueue(
        'USER_PREFERENCE',
        preferences,
        'MEDIUM'
      );
      return;
    }

    // Sync immediately if online
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      // Queue for later if request fails
      await this.backgroundSync.addToQueue(
        'USER_PREFERENCE',
        preferences,
        'MEDIUM'
      );
    }
  }

  /**
   * Handle location updates
   */
  async handleLocationUpdate(location: any): Promise<void> {
    await this.backgroundSync.addToQueue(
      'LOCATION_UPDATE',
      location,
      'MEDIUM',
      { expiresIn: 3600000 } // Expire in 1 hour
    );
  }

  /**
   * Handle analytics events
   */
  async trackAnalyticsEvent(event: any): Promise<void> {
    await this.backgroundSync.addToQueue(
      'ANALYTICS_EVENT',
      event,
      'LOW',
      { expiresIn: 86400000 } // Expire in 24 hours
    );
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
   * Force app update check
   */
  async checkForAppUpdates(): Promise<boolean> {
    try {
      const updateInfo = await this.appUpdate.forceUpdateCheck();
      return !!updateInfo?.available;
    } catch (error) {
      console.error('Update check failed:', error);
      return false;
    }
  }

  /**
   * Install available app update
   */
  async installAppUpdate(): Promise<boolean> {
    try {
      return await this.appUpdate.installUpdate();
    } catch (error) {
      console.error('Update installation failed:', error);
      return false;
    }
  }

  /**
   * Force background sync
   */
  async forceSyncAll(): Promise<void> {
    try {
      await this.backgroundSync.forcSync();
    } catch (error) {
      console.error('Force sync failed:', error);
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
    syncQueueSize: number;
    notificationStatus: any;
    appVersion: string;
    uptime: number;
  }> {
    const startTime = performance.now();
    
    try {
      const [cacheStats, syncStatus, notificationStatus] = await Promise.all([
        this.serviceWorker.getCacheStats(),
        this.backgroundSync.getQueueStatus(),
        Promise.resolve(this.pushNotifications.getSubscriptionStatus())
      ]);

      return {
        cacheStats,
        syncQueueSize: syncStatus.totalItems,
        notificationStatus,
        appVersion: this.CURRENT_APP_VERSION.version,
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
    backgroundSync: boolean;
    pushNotifications: boolean;
    appUpdate: boolean;
  }> {
    const results = {
      serviceWorker: false,
      backgroundSync: false,
      pushNotifications: false,
      appUpdate: false
    };

    try {
      // Test Service Worker
      const swStatus = this.serviceWorker.getRegistrationStatus();
      results.serviceWorker = swStatus.isRegistered;

      // Test Background Sync
      await this.backgroundSync.addToQueue('ANALYTICS_EVENT', { test: true }, 'LOW');
      results.backgroundSync = true;

      // Test Push Notifications
      if (this.pushNotifications.getSubscriptionStatus().isSupported) {
        await this.pushNotifications.testNotification();
        results.pushNotifications = true;
      }

      // Test App Update
      const updateStatus = this.appUpdate.getUpdateStatus();
      results.appUpdate = !!updateStatus.currentVersion;

    } catch (error) {
      console.error('Service testing failed:', error);
    }

    return results;
  }

  /**
   * Cleanup all services
   */
  destroy(): void {
    if (this.appUpdate) {
      this.appUpdate.destroy();
    }
    
    this.initialized = false;
    console.log('Service Manager destroyed');
  }
}