// App Update Manager - Handle app updates and versioning
export interface AppVersion {
  version: string;
  buildNumber: string;
  releaseDate: string;
  features: string[];
  bugFixes: string[];
  breakingChanges?: string[];
}

export interface UpdateInfo {
  available: boolean;
  version: AppVersion;
  mandatory: boolean;
  size?: number;
  downloadUrl?: string;
  releaseNotes: string;
}

export interface UpdateProgress {
  phase: 'CHECKING' | 'DOWNLOADING' | 'INSTALLING' | 'COMPLETE' | 'ERROR';
  progress: number; // 0-100
  message: string;
  error?: Error;
}

export class AppUpdateManager {
  private currentVersion: AppVersion;
  private updateInfo: UpdateInfo | null = null;
  private updateInProgress: boolean = false;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private checkInterval: number | null = null;
  private readonly VERSION_STORAGE_KEY = 'zephra_app_version';
  private readonly UPDATE_CHECK_INTERVAL = 300000; // 5 minutes
  private callbacks: {
    onUpdateAvailable?: (updateInfo: UpdateInfo) => void;
    onUpdateProgress?: (progress: UpdateProgress) => void;
    onUpdateComplete?: (version: AppVersion) => void;
    onUpdateError?: (error: Error) => void;
    onVersionChange?: (oldVersion: AppVersion, newVersion: AppVersion) => void;
  } = {};

  constructor(currentVersion: AppVersion) {
    this.currentVersion = currentVersion;
    this.init();
  }

  /**
   * Initialize app update manager
   */
  private async init(): Promise<void> {
    try {
      // Load stored version info
      this.loadVersionInfo();
      
      // Register service worker for updates
      if ('serviceWorker' in navigator) {
        this.swRegistration = await navigator.serviceWorker.ready;
        this.setupServiceWorkerUpdateHandlers();
      }

      // Start periodic update checks
      this.startUpdateChecker();
      
      // Initial update check
      await this.checkForUpdates();
      
      console.log(`App Update Manager initialized - Current version: ${this.currentVersion.version}`);
    } catch (error) {
      console.error('Failed to initialize App Update Manager:', error);
      this.callbacks.onUpdateError?.(error as Error);
    }
  }

  /**
   * Set up service worker update handlers
   */
  private setupServiceWorkerUpdateHandlers(): void {
    if (!this.swRegistration) return;

    // Handle service worker updates
    this.swRegistration.addEventListener('updatefound', () => {
      const newWorker = this.swRegistration!.installing;
      if (newWorker) {
        this.handleServiceWorkerUpdate(newWorker);
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'APP_UPDATE_AVAILABLE':
          this.handleAppUpdateMessage(payload);
          break;
        case 'UPDATE_PROGRESS':
          this.callbacks.onUpdateProgress?.(payload);
          break;
        case 'UPDATE_ERROR':
          this.callbacks.onUpdateError?.(new Error(payload.message));
          break;
      }
    });
  }

  /**
   * Handle service worker update detection
   */
  private handleServiceWorkerUpdate(newWorker: ServiceWorker): void {
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker installed, trigger app update check
        this.checkForUpdates();
      }
    });
  }

  /**
   * Start periodic update checking
   */
  private startUpdateChecker(): void {
    this.checkInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    }, this.UPDATE_CHECK_INTERVAL);
  }

  /**
   * Stop periodic update checking
   */
  private stopUpdateChecker(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check for app updates
   */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    if (this.updateInProgress) {
      return this.updateInfo;
    }

    try {
      this.callbacks.onUpdateProgress?.({
        phase: 'CHECKING',
        progress: 0,
        message: 'Checking for updates...'
      });

      const response = await fetch('/api/version/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          currentVersion: this.currentVersion.version,
          buildNumber: this.currentVersion.buildNumber,
          platform: this.getPlatformInfo()
        })
      });

      if (!response.ok) {
        throw new Error(`Update check failed: ${response.status}`);
      }

      const updateData = await response.json();
      
      if (updateData.updateAvailable) {
        this.updateInfo = {
          available: true,
          version: updateData.version,
          mandatory: updateData.mandatory || false,
          size: updateData.size,
          downloadUrl: updateData.downloadUrl,
          releaseNotes: updateData.releaseNotes || ''
        };

        this.callbacks.onUpdateAvailable?.(this.updateInfo);
        console.log(`Update available: ${updateData.version.version}`);
      } else {
        this.updateInfo = null;
        console.log('App is up to date');
      }

      this.callbacks.onUpdateProgress?.({
        phase: 'COMPLETE',
        progress: 100,
        message: this.updateInfo ? 'Update available' : 'App is up to date'
      });

      return this.updateInfo;
    } catch (error) {
      console.error('Update check failed:', error);
      this.callbacks.onUpdateError?.(error as Error);
      this.callbacks.onUpdateProgress?.({
        phase: 'ERROR',
        progress: 0,
        message: 'Update check failed',
        error: error as Error
      });
      return null;
    }
  }

  /**
   * Download and install app update
   */
  async installUpdate(): Promise<boolean> {
    if (!this.updateInfo || this.updateInProgress) {
      return false;
    }

    this.updateInProgress = true;

    try {
      this.callbacks.onUpdateProgress?.({
        phase: 'DOWNLOADING',
        progress: 0,
        message: 'Downloading update...'
      });

      // For PWA, this primarily involves service worker update
      if (this.swRegistration && this.swRegistration.waiting) {
        // Skip waiting and activate new service worker
        this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        
        this.callbacks.onUpdateProgress?.({
          phase: 'INSTALLING',
          progress: 50,
          message: 'Installing update...'
        });

        // Wait for the new service worker to take control
        await this.waitForServiceWorkerActivation();
      }

      // Update version info
      const oldVersion = { ...this.currentVersion };
      this.currentVersion = { ...this.updateInfo.version };
      this.saveVersionInfo();
      this.addToVersionHistory(this.currentVersion);

      this.callbacks.onUpdateProgress?.({
        phase: 'COMPLETE',
        progress: 100,
        message: 'Update installed successfully'
      });

      this.callbacks.onUpdateComplete?.(this.currentVersion);
      this.callbacks.onVersionChange?.(oldVersion, this.currentVersion);

      this.updateInfo = null;
      this.updateInProgress = false;

      console.log(`App updated to version ${this.currentVersion.version}`);
      return true;

    } catch (error) {
      console.error('Update installation failed:', error);
      this.callbacks.onUpdateError?.(error as Error);
      this.callbacks.onUpdateProgress?.({
        phase: 'ERROR',
        progress: 0,
        message: 'Update installation failed',
        error: error as Error
      });
      this.updateInProgress = false;
      return false;
    }
  }

  /**
   * Wait for service worker activation
   */
  private waitForServiceWorkerActivation(): Promise<void> {
    return new Promise((resolve) => {
      const handleControllerChange = () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        resolve();
      };
      
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      
      // Fallback timeout
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
        resolve();
      }, 5000);
    });
  }

  /**
   * Handle app update messages from service worker
   */
  private handleAppUpdateMessage(payload: any): void {
    if (payload.updateInfo) {
      this.updateInfo = payload.updateInfo;
      if (this.updateInfo) {
        this.callbacks.onUpdateAvailable?.(this.updateInfo);
      }
    }
  }

  /**
   * Get platform information for update checks
   */
  private getPlatformInfo(): any {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      timestamp: Date.now()
    };
  }

  /**
   * Load version info from storage
   */
  private loadVersionInfo(): void {
    try {
      const stored = localStorage.getItem(this.VERSION_STORAGE_KEY);
      if (stored) {
        const storedVersion = JSON.parse(stored);
        
        // Check if version has changed since last run
        if (storedVersion.version !== this.currentVersion.version) {
          this.callbacks.onVersionChange?.(storedVersion, this.currentVersion);
        }
      }
    } catch (error) {
      console.error('Failed to load version info:', error);
    }
  }

  /**
   * Save version info to storage
   */
  private saveVersionInfo(): void {
    try {
      localStorage.setItem(this.VERSION_STORAGE_KEY, JSON.stringify(this.currentVersion));
    } catch (error) {
      console.error('Failed to save version info:', error);
    }
  }

  /**
   * Get current app version info
   */
  getCurrentVersion(): AppVersion {
    return { ...this.currentVersion };
  }

  /**
   * Get available update info
   */
  getUpdateInfo(): UpdateInfo | null {
    return this.updateInfo ? { ...this.updateInfo } : null;
  }

  /**
   * Get update status
   */
  getUpdateStatus(): {
    updateAvailable: boolean;
    updateInProgress: boolean;
    currentVersion: string;
    availableVersion?: string;
    mandatory?: boolean;
  } {
    return {
      updateAvailable: !!this.updateInfo,
      updateInProgress: this.updateInProgress,
      currentVersion: this.currentVersion.version,
      availableVersion: this.updateInfo?.version.version,
      mandatory: this.updateInfo?.mandatory
    };
  }

  /**
   * Set callback functions for update events
   */
  setCallbacks(callbacks: {
    onUpdateAvailable?: (updateInfo: UpdateInfo) => void;
    onUpdateProgress?: (progress: UpdateProgress) => void;
    onUpdateComplete?: (version: AppVersion) => void;
    onUpdateError?: (error: Error) => void;
    onVersionChange?: (oldVersion: AppVersion, newVersion: AppVersion) => void;
  }): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Force immediate update check
   */
  async forceUpdateCheck(): Promise<UpdateInfo | null> {
    return await this.checkForUpdates();
  }

  /**
   * Postpone update (for non-mandatory updates)
   */
  postponeUpdate(): void {
    if (this.updateInfo && !this.updateInfo.mandatory) {
      this.updateInfo = null;
      console.log('Update postponed by user');
    }
  }

  /**
   * Get version history from storage
   */
  getVersionHistory(): AppVersion[] {
    try {
      const history = localStorage.getItem('zephra_version_history');
      return history ? JSON.parse(history) : [this.currentVersion];
    } catch (error) {
      console.error('Failed to load version history:', error);
      return [this.currentVersion];
    }
  }

  /**
   * Add current version to history
   */
  private addToVersionHistory(version: AppVersion): void {
    try {
      const history = this.getVersionHistory();
      
      // Check if version already exists
      const exists = history.some(v => v.version === version.version);
      if (!exists) {
        history.push(version);
        
        // Keep only last 10 versions
        if (history.length > 10) {
          history.splice(0, history.length - 10);
        }
        
        localStorage.setItem('zephra_version_history', JSON.stringify(history));
      }
    } catch (error) {
      console.error('Failed to save version history:', error);
    }
  }

  /**
   * Compare two versions
   */
  compareVersions(version1: string, version2: string): number {
    const v1Parts = version1.split('.').map(Number);
    const v2Parts = version2.split('.').map(Number);
    
    const maxLength = Math.max(v1Parts.length, v2Parts.length);
    
    for (let i = 0; i < maxLength; i++) {
      const v1Part = v1Parts[i] || 0;
      const v2Part = v2Parts[i] || 0;
      
      if (v1Part > v2Part) return 1;
      if (v1Part < v2Part) return -1;
    }
    
    return 0;
  }

  /**
   * Check if app restart is required
   */
  isRestartRequired(): boolean {
    return !!this.updateInfo?.mandatory || this.updateInProgress;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.stopUpdateChecker();
    this.updateInProgress = false;
    this.updateInfo = null;
    console.log('App Update Manager destroyed');
  }
}