// Service Worker Registration Utilities

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers are not supported in this browser.');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });

        console.log('Service Worker registered successfully:', registration);

        // Wait for the service worker to be ready
        await navigator.serviceWorker.ready;

        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
}

/**
 * Send coordinates to the service worker
 */
export function sendCoordinatesToSW(lat: number, lon: number): void {
    if (!navigator.serviceWorker.controller) {
        console.warn('No active service worker controller found.');
        return;
    }

    navigator.serviceWorker.controller.postMessage({
        type: 'SET_COORDINATES',
        lat,
        lon,
    });

    console.log('Coordinates sent to Service Worker:', { lat, lon });
}

/**
 * Request periodic background sync (if supported)
 * This registers a periodic sync for weather updates every 2 hours
 */
export async function registerPeriodicSync(
    registration: ServiceWorkerRegistration
): Promise<boolean> {
    // Check if Periodic Background Sync is supported
    if (!('periodicSync' in registration)) {
        console.warn('Periodic Background Sync is not supported in this browser/environment.');
        return false;
    }

    try {
        // @ts-ignore - periodicSync might not be in types yet
        await registration.periodicSync.register('weather-sync', {
            minInterval: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
        });

        console.log('Periodic sync registered successfully (2 hours)');
        return true;
    } catch (error) {
        console.error('Periodic sync registration failed:', error);
        return false;
    }
}

/**
 * Trigger a manual weather notification update
 * This function can be called from Android native code via window.triggerWeatherUpdate()
 */
export async function triggerWeatherUpdate(lat: number, lon: number): Promise<void> {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
        console.warn('Service Worker not available for manual trigger.');
        return;
    }

    try {
        // Send coordinates first
        sendCoordinatesToSW(lat, lon);

        // Wait a bit for the message to be processed
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Simulate a push event by directly calling the SW
        // In production, this would be triggered by your backend/FCM
        const registration = await navigator.serviceWorker.ready;

        // For testing: we can't actually trigger a push event from the client,
        // but we can send a message that the SW can handle similarly
        if (registration.active) {
            registration.active.postMessage({
                type: 'MANUAL_WEATHER_UPDATE',
                lat,
                lon,
            });
        }

        console.log('Manual weather update triggered');
    } catch (error) {
        console.error('Failed to trigger weather update:', error);
    }
}

/**
 * Expose triggerWeatherUpdate globally for Android WebView
 */
export function exposeTriggerToWindow(): void {
    if (typeof window !== 'undefined') {
        // @ts-ignore
        window.triggerWeatherUpdate = async (lat?: number, lon?: number) => {
            // If no coordinates provided, try to get current location
            if (lat === undefined || lon === undefined) {
                if ('geolocation' in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            triggerWeatherUpdate(position.coords.latitude, position.coords.longitude);
                        },
                        (error) => {
                            console.error('Failed to get current location:', error);
                        }
                    );
                }
            } else {
                await triggerWeatherUpdate(lat, lon);
            }
        };

        console.log('window.triggerWeatherUpdate() is now available');
    }
}
