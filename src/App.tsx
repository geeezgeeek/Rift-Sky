import { useState, useEffect } from 'react';
import { useWeather } from './hooks/useWeather';
import WeatherHero from './components/WeatherHero';
import MetricsGrid from './components/MetricsGrid';
import SearchBar from './components/SearchBar';
import { NotificationPermissionModal } from './components/NotificationPermissionModal';
import {
  registerServiceWorker,
  sendCoordinatesToSW,
  registerPeriodicSync,
  exposeTriggerToWindow
} from './utils/sw-register';

function App() {
  const { weather, aqi, loading, error, locationName, rainMinutes, isMonsoon, updateLocation } = useWeather();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showNotificationModal, setShowNotificationModal] = useState(true);

  useEffect(() => {
    // PWA Install Prompt Logic
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Expose window.triggerWeatherUpdate for Android/Cron
    exposeTriggerToWindow();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Service Worker & Notification Setup
  useEffect(() => {
    const setupNotifications = async () => {
      // Only register SW if notification permission is granted
      if (Notification.permission === 'granted') {
        const registration = await registerServiceWorker();

        if (registration) {
          // Try to register periodic sync (might not be supported)
          await registerPeriodicSync(registration);
        }
      }
    };

    setupNotifications();
  }, []);

  // Send coordinates to Service Worker whenever weather data updates
  useEffect(() => {
    if (weather && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // Extract coordinates from the weather hook's current location
      // Since useWeather uses geolocation, we need to get the coords
      navigator.geolocation.getCurrentPosition((position) => {
        sendCoordinatesToSW(position.coords.latitude, position.coords.longitude);
      });
    }
  }, [weather]);

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-primary animate-pulse">Initializing Rift Sky...</div>;
  }

  if (error || !weather) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4 text-center p-4">
        <div className="text-red-500">{error || 'Unable to connect to Rift Network.'}</div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-white/10 rounded-xl text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center relative overflow-hidden">
      {/* Notification Permission Modal */}
      {showNotificationModal && (
        <NotificationPermissionModal onClose={() => setShowNotificationModal(false)} />
      )}
      {/* Monsoon Inner Glow Effect */}
      {isMonsoon && (
        <div className="fixed inset-0 pointer-events-none z-10 animate-pulse shadow-[inset_0_0_100px_30px_rgba(160,86,255,0.3)] transition-opacity duration-1000"></div>
      )}

      {/* Mobile Layout (Default) & Laptop Grid */}
      <div className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-12 gap-8 relative z-20">

        {/* Main Weather Section (Mobile: Stacked, Laptop: Col 1-7) */}
        <div className="md:col-span-7 flex flex-col justify-center">
          <SearchBar onLocationSelect={updateLocation} />
          <WeatherHero weather={weather} locationName={locationName} />
        </div>

        {/* Metrics Section (Mobile: Stacked, Laptop: Col 8-12) */}
        <div className="md:col-span-5 flex flex-col justify-center">
          <MetricsGrid
            weather={weather}
            aqi={aqi}
            rainMinutes={rainMinutes}
            isMonsoon={isMonsoon}
            showInstall={!!deferredPrompt}
            onInstall={handleInstall}
          />
        </div>

      </div>
    </div>
  );
}

export default App;
