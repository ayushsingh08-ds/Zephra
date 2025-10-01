import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if app is already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after 30 seconds
      setTimeout(() => {
        if (!standalone) {
          setShowInstallPrompt(true);
        }
      }, 30000);
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
    // Show again after 24 hours
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Don't show if already installed or dismissed recently
  useEffect(() => {
    const dismissedTime = localStorage.getItem('installPromptDismissed');
    if (dismissedTime) {
      const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
      if (hoursSinceDismissed < 24) {
        setShowInstallPrompt(false);
      }
    }
  }, []);

  if (isStandalone || (!showInstallPrompt && !isIOS)) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        zIndex: 10000,
        background: 'rgba(77, 160, 219, 0.15)',
        backdropFilter: 'blur(25px)',
        WebkitBackdropFilter: 'blur(25px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '20px',
        padding: '20px',
        color: 'white',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 25px rgba(77, 160, 219, 0.15)',
        maxWidth: '400px',
        margin: '0 auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ fontSize: '2rem' }}>📱</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: '600', marginBottom: '5px' }}>
            Install Zephra
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {isIOS 
              ? 'Add to Home Screen for the best experience!'
              : 'Get faster access and offline capabilities!'
            }
          </div>
          {isIOS && (
            <div style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
              Tap the share button <span style={{ fontSize: '16px' }}>⬆️</span> and select "Add to Home Screen"
            </div>
          )}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstallClick}
            style={{
              flex: 1,
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
            }}
          >
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          style={{
            flex: isIOS ? 1 : 'none',
            background: 'transparent',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '10px',
            padding: '10px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            minWidth: '80px',
          }}
        >
          {isIOS ? 'Got it' : 'Later'}
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;