// Service Worker for Rift Sky Weather Notifications

const CACHE_NAME = 'rift-sky-v1';

// Install event
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Store coordinates from main app
let userCoordinates = null;

// Message event - receive coordinates or manual triggers from main app
self.addEventListener('message', async (event) => {
    if (event.data && event.data.type === 'SET_COORDINATES') {
        userCoordinates = {
            lat: event.data.lat,
            lon: event.data.lon,
        };
        console.log('Service Worker: Coordinates received', userCoordinates);
    } else if (event.data && event.data.type === 'MANUAL_WEATHER_UPDATE') {
        console.log('Service Worker: Manual weather update triggered');
        const lat = event.data.lat || userCoordinates?.lat;
        const lon = event.data.lon || userCoordinates?.lon;

        if (lat && lon) {
            try {
                const weatherData = await fetchWeatherData(lat, lon);
                const temp = Math.round(weatherData.current_weather.temperature);
                const weatherDesc = getWeatherDescription(weatherData.current_weather.weathercode);
                const rainProb = getRainProbability(weatherData.hourly);

                await self.registration.showNotification(`${temp}°C - ${weatherDesc}`, {
                    body: rainProb > 30
                        ? `⚠️ ${rainProb}% chance of rain in the next 4 hours`
                        : `Rain probability: ${rainProb}% in next 4 hours`,
                    icon: '/vite.svg',
                    badge: '/vite.svg',
                    vibrate: [200, 100, 200],
                    tag: 'weather-update',
                    requireInteraction: false,
                });
            } catch (error) {
                console.error('Service Worker: Manual update error', error);
            }
        }
    }
});

// Helper: Fetch weather data
async function fetchWeatherData(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        hourly: 'temperature_2m,precipitation_probability',
        current_weather: 'true',
        timezone: 'auto',
    });

    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch weather data');
    }
    return response.json();
}

// Helper: Get weather description from code
function getWeatherDescription(code) {
    const weatherCodes = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail',
    };
    return weatherCodes[code] || 'Unknown';
}

// Helper: Get rain probability in next 4 hours
function getRainProbability(hourly) {
    const now = new Date();
    const currentHourIndex = hourly.time.findIndex(t => new Date(t).getTime() > now.getTime());

    if (currentHourIndex === -1) return 0;

    let maxProb = 0;
    for (let i = 0; i < 4; i++) {
        const idx = currentHourIndex + i;
        if (idx >= hourly.precipitation_probability.length) break;
        maxProb = Math.max(maxProb, hourly.precipitation_probability[idx]);
    }
    return maxProb;
}

// Push event - handle incoming push notifications
self.addEventListener('push', async (event) => {
    console.log('Service Worker: Push event received');

    let notificationData = {
        title: 'Rift Sky Weather',
        body: 'Weather update available',
        icon: '/vite.svg',
        badge: '/vite.svg',
    };

    try {
        // If push has data, use it
        if (event.data) {
            const pushData = event.data.json();
            notificationData.title = pushData.title || notificationData.title;
            notificationData.body = pushData.body || notificationData.body;
        }
        // Otherwise, fetch fresh weather data if we have coordinates
        else if (userCoordinates) {
            const weatherData = await fetchWeatherData(userCoordinates.lat, userCoordinates.lon);
            const temp = Math.round(weatherData.current_weather.temperature);
            const weatherDesc = getWeatherDescription(weatherData.current_weather.weathercode);
            const rainProb = getRainProbability(weatherData.hourly);

            notificationData.title = `${temp}°C - ${weatherDesc}`;
            notificationData.body = rainProb > 30
                ? `⚠️ ${rainProb}% chance of rain in the next 4 hours`
                : `Rain probability: ${rainProb}% in next 4 hours`;
        }
    } catch (error) {
        console.error('Service Worker: Error processing push event', error);
    }

    event.waitUntil(
        self.registration.showNotification(notificationData.title, {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            vibrate: [200, 100, 200],
            tag: 'weather-update',
            requireInteraction: false,
        })
    );
});

// Periodic Sync event (if supported)
self.addEventListener('periodicsync', async (event) => {
    if (event.tag === 'weather-sync') {
        console.log('Service Worker: Periodic sync triggered');

        event.waitUntil(
            (async () => {
                if (!userCoordinates) return;

                try {
                    const weatherData = await fetchWeatherData(userCoordinates.lat, userCoordinates.lon);
                    const temp = Math.round(weatherData.current_weather.temperature);
                    const weatherDesc = getWeatherDescription(weatherData.current_weather.weathercode);
                    const rainProb = getRainProbability(weatherData.hourly);

                    await self.registration.showNotification(`${temp}°C - ${weatherDesc}`, {
                        body: rainProb > 30
                            ? `⚠️ ${rainProb}% chance of rain in the next 4 hours`
                            : `Rain probability: ${rainProb}% in next 4 hours`,
                        icon: '/vite.svg',
                        badge: '/vite.svg',
                        vibrate: [200, 100, 200],
                        tag: 'weather-update',
                        requireInteraction: false,
                    });
                } catch (error) {
                    console.error('Service Worker: Periodic sync error', error);
                }
            })()
        );
    }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // If a window is already open, focus it
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
