import { useState, useEffect } from 'react';

interface NotificationPermissionModalProps {
  onClose: () => void;
}

export function NotificationPermissionModal({ onClose }: NotificationPermissionModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if notification permission is default (not asked yet)
    if ('Notification' in window && Notification.permission === 'default') {
      setShow(true);
    }
  }, []);

  const handleAllow = async () => {
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Register service worker
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
          
          // Send a test notification
          new Notification('Rift Sky Weather', {
            body: 'Notifications enabled! You\'ll receive weather updates every 2 hours.',
            icon: '/vite.svg',
            badge: '/vite.svg',
          });
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    } finally {
      setShow(false);
      onClose();
    }
  };

  const handleDeny = () => {
    setShow(false);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        
        <div className="relative p-8 space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30">
              <svg 
                className="w-12 h-12 text-cyan-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">
              Stay Updated
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Enable notifications to receive weather alerts and rain updates every 2 hours. 
              Never miss a weather change again.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDeny}
              className="flex-1 px-6 py-3 rounded-xl font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 transition-all duration-200 hover:scale-105"
            >
              Not Now
            </button>
            <button
              onClick={handleAllow}
              className="flex-1 px-6 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:scale-105 hover:shadow-cyan-500/40"
            >
              Allow
            </button>
          </div>

          {/* Small print */}
          <p className="text-xs text-slate-400 text-center">
            You can change this preference anytime in your browser settings
          </p>
        </div>
      </div>
    </div>
  );
}
