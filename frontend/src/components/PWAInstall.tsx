import React, { useState, useEffect } from 'react';
import './PWAInstall.css';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const PWAInstall: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) {
    return null;
  }

  return (
    <div className="pwa-install-container">
      <div className="pwa-install-card">
        <div className="pwa-install-icon">
          <img src="/icon.png" alt="Zephra" />
        </div>
        <div className="pwa-install-content">
          <h3>Install Zephra</h3>
          <p>Get the full Zephra experience with our app!</p>
          <div className="pwa-install-features">
            <span>✓ Works offline</span>
            <span>✓ Fast loading</span>
            <span>✓ Real-time updates</span>
          </div>
        </div>
        <div className="pwa-install-actions">
          <button 
            className="pwa-install-btn primary" 
            onClick={handleInstallClick}
          >
            Install App
          </button>
          <button 
            className="pwa-install-btn secondary" 
            onClick={handleDismiss}
          >
            Not Now
          </button>
        </div>
        <button 
          className="pwa-install-close" 
          onClick={handleDismiss}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default PWAInstall;