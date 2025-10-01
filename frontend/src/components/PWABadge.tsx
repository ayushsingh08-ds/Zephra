import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface PWABadgeProps {
  onUpdate?: () => void;
}

const PWABadge: React.FC<PWABadgeProps> = ({ onUpdate }) => {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  const handleUpdate = () => {
    updateServiceWorker(true);
    if (onUpdate) onUpdate();
  };

  useEffect(() => {
    if (needRefresh) {
      // Show update notification
      const shouldUpdate = window.confirm(
        'A new version of Zephra is available! Would you like to update now?'
      );
      if (shouldUpdate) {
        handleUpdate();
      }
    }
  }, [needRefresh]);

  return (
    <>
      {(offlineReady || needRefresh) && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 10000,
            background: 'rgba(77, 160, 219, 0.15)',
            backdropFilter: 'blur(25px)',
            WebkitBackdropFilter: 'blur(25px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '15px',
            padding: '15px 20px',
            color: 'white',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1), 0 8px 25px rgba(77, 160, 219, 0.15)',
            fontSize: '14px',
            maxWidth: '300px',
          }}
        >
          <div style={{ marginBottom: '10px' }}>
            {offlineReady
              ? 'Zephra is ready to work offline!'
              : 'New version available!'}
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {needRefresh && (
              <button
                onClick={handleUpdate}
                style={{
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                }}
              >
                Update
              </button>
            )}
            <button
              onClick={close}
              style={{
                background: 'transparent',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWABadge;