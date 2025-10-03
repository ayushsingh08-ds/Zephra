// Push Notification Handler - Manage push notifications
export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationHandler {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private pushSubscription: PushSubscription | null = null;
  private permissionStatus: NotificationPermission = 'default';
  private vapidPublicKey: string = '';
  private callbacks: {
    onPermissionGranted?: () => void;
    onPermissionDenied?: () => void;
    onSubscriptionChange?: (subscription: PushSubscriptionData | null) => void;
    onNotificationReceived?: (payload: NotificationPayload) => void;
    onNotificationClick?: (data: any) => void;
    onError?: (error: Error) => void;
  } = {};

  constructor(vapidPublicKey: string) {
    this.vapidPublicKey = vapidPublicKey;
    this.init();
  }

  /**
   * Initialize push notification handler
   */
  private async init(): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.warn('This browser does not support service workers');
      return;
    }

    this.permissionStatus = Notification.permission;
    
    try {
      this.swRegistration = await navigator.serviceWorker.ready;
      this.setupMessageListeners();
      await this.loadExistingSubscription();
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Set up message listeners for push notifications
   */
  private setupMessageListeners(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data;

      switch (type) {
        case 'NOTIFICATION_RECEIVED':
          this.callbacks.onNotificationReceived?.(payload);
          break;
        case 'NOTIFICATION_CLICK':
          this.callbacks.onNotificationClick?.(payload.data);
          break;
        case 'PUSH_SUBSCRIPTION_CHANGE':
          this.handleSubscriptionChange();
          break;
      }
    });
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (this.permissionStatus === 'granted') {
      return 'granted';
    }

    try {
      this.permissionStatus = await Notification.requestPermission();
      
      if (this.permissionStatus === 'granted') {
        this.callbacks.onPermissionGranted?.();
        console.log('Notification permission granted');
      } else {
        this.callbacks.onPermissionDenied?.();
        console.log('Notification permission denied');
      }

      return this.permissionStatus;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      this.callbacks.onError?.(error as Error);
      return 'denied';
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.swRegistration) {
      throw new Error('Service Worker not registered');
    }

    if (this.permissionStatus !== 'granted') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        return null;
      }
    }

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
      });

      this.pushSubscription = subscription;
      const subscriptionData = this.extractSubscriptionData(subscription);
      
      await this.sendSubscriptionToServer(subscriptionData);
      this.callbacks.onSubscriptionChange?.(subscriptionData);
      
      console.log('Push notification subscription successful');
      return subscriptionData;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      this.callbacks.onError?.(error as Error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.pushSubscription) {
      return true;
    }

    try {
      const success = await this.pushSubscription.unsubscribe();
      
      if (success) {
        this.pushSubscription = null;
        await this.removeSubscriptionFromServer();
        this.callbacks.onSubscriptionChange?.(null);
        console.log('Push notification unsubscription successful');
      }

      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      this.callbacks.onError?.(error as Error);
      return false;
    }
  }

  /**
   * Load existing subscription
   */
  private async loadExistingSubscription(): Promise<void> {
    if (!this.swRegistration) return;

    try {
      this.pushSubscription = await this.swRegistration.pushManager.getSubscription();
      
      if (this.pushSubscription) {
        const subscriptionData = this.extractSubscriptionData(this.pushSubscription);
        this.callbacks.onSubscriptionChange?.(subscriptionData);
      }
    } catch (error) {
      console.error('Failed to load existing subscription:', error);
    }
  }

  /**
   * Handle subscription change events
   */
  private async handleSubscriptionChange(): Promise<void> {
    await this.loadExistingSubscription();
    
    if (!this.pushSubscription && this.permissionStatus === 'granted') {
      // Attempt to resubscribe
      await this.subscribe();
    }
  }

  /**
   * Extract subscription data for server communication
   */
  private extractSubscriptionData(subscription: PushSubscription): PushSubscriptionData {
    const keys = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    return {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: keys ? this.arrayBufferToBase64(keys) : '',
        auth: auth ? this.arrayBufferToBase64(auth) : ''
      }
    };
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscriptionData): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
      throw error;
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: this.pushSubscription?.endpoint
        })
      });

      if (!response.ok) {
        console.warn('Failed to remove subscription from server');
      }
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  /**
   * Show local notification (for testing or fallback)
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.swRegistration) {
      throw new Error('Service Worker not registered');
    }

    if (this.permissionStatus !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    try {
      await this.swRegistration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon.png',
        badge: payload.badge || '/icon.png',
        data: payload.data,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction || false,
        silent: payload.silent || false
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  /**
   * Get current subscription status
   */
  getSubscriptionStatus(): {
    isSupported: boolean;
    permission: NotificationPermission;
    isSubscribed: boolean;
    endpoint?: string;
  } {
    return {
      isSupported: 'Notification' in window && 'serviceWorker' in navigator,
      permission: this.permissionStatus,
      isSubscribed: !!this.pushSubscription,
      endpoint: this.pushSubscription?.endpoint
    };
  }

  /**
   * Set callback functions for push notification events
   */
  setCallbacks(callbacks: {
    onPermissionGranted?: () => void;
    onPermissionDenied?: () => void;
    onSubscriptionChange?: (subscription: PushSubscriptionData | null) => void;
    onNotificationReceived?: (payload: NotificationPayload) => void;
    onNotificationClick?: (data: any) => void;
    onError?: (error: Error) => void;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Test push notification functionality
   */
  async testNotification(): Promise<void> {
    await this.showNotification({
      title: 'Zephra Test Notification',
      body: 'Push notifications are working correctly!',
      icon: '/icon.png',
      data: { test: true }
    });
  }

  /**
   * Utility: Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Utility: Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }

    return window.btoa(binary);
  }

  /**
   * Create notification templates for air quality alerts
   */
  createAirQualityNotification(
    aqi: number, 
    location: string, 
    status: string
  ): NotificationPayload {
    const getAlertLevel = (aqi: number) => {
      if (aqi <= 50) return { 
        level: 'Good', 
        icon: '✅',
        action: 'Great time to be outdoors!'
      };
      if (aqi <= 100) return { 
        level: 'Moderate', 
        icon: '⚠️',
        action: 'Sensitive people should limit outdoor activities'
      };
      if (aqi <= 150) return { 
        level: 'Unhealthy for Sensitive', 
        icon: '🔶',
        action: 'Consider moving indoors if you have respiratory issues'
      };
      if (aqi <= 200) return { 
        level: 'Unhealthy', 
        icon: '🔴',
        action: 'Avoid prolonged outdoor exposure - move indoors'
      };
      if (aqi <= 300) return { 
        level: 'Very Unhealthy', 
        icon: '🚨',
        action: 'Leave this area immediately and seek clean air'
      };
      return { 
        level: 'Hazardous', 
        icon: '☢️',
        action: 'Emergency - evacuate this location now!'
      };
    };

    const alert = getAlertLevel(aqi);

    return {
      title: `${alert.icon} ${alert.level} Air Quality in ${location}`,
      body: `AQI ${aqi} • ${alert.action}`,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      image: aqi > 150 ? '/alert-banner.png' : undefined,
      data: {
        type: 'air_quality_alert',
        aqi,
        location,
        status,
        timestamp: Date.now(),
        actionAdvice: alert.action,
        alertLevel: alert.level
      },
      tag: 'air-quality-alert',
      requireInteraction: aqi > 150,
      silent: false,
      actions: [
        {
          action: 'open_app',
          title: '📱 Open App',
          icon: '/icon-32x32.png'
        },
        {
          action: 'get_directions',
          title: '🗺️ Find Clean Air',
          icon: '/location-icon.png'
        }
      ]
    };
  }
}