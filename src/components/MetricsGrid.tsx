import GlassCard from './GlassCard';
import { Droplets, Sun, CloudRain, Wind, Download, Eye, Thermometer, Sunrise, Sunset } from 'lucide-react';
import { type WeatherData } from '../api/weather';

interface MetricsGridProps {
    weather: WeatherData;
    aqi: number | null;
    rainMinutes: number | null;
    isMonsoon: boolean;
    showInstall?: boolean;
    onInstall?: () => void;
}

const MetricsGrid = ({ weather, aqi, rainMinutes, isMonsoon, showInstall, onInstall }: MetricsGridProps) => {
    // Get current hour index (simplified approach)
    const now = new Date();
    let currentHourIndex = weather.hourly.time.findIndex(t => new Date(t).getTime() > now.getTime()) - 1;
    if (currentHourIndex < 0) currentHourIndex = 0;

    const currentHumidity = weather.hourly.relative_humidity_2m[currentHourIndex];
    const feelsLike = weather.hourly.apparent_temperature[currentHourIndex];
    const visibility = weather.hourly.visibility[currentHourIndex]; // meters
    const uvIndex = weather.daily.uv_index_max[0];
    const windSpeed = weather.current_weather.windspeed;
    const sunrise = new Date(weather.daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const sunset = new Date(weather.daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="grid grid-cols-2 gap-4 w-full max-w-[480px] mx-auto p-4">
            {/* Rain Timer */}
            <GlassCard className={`col-span-2 p-6 flex items-center justify-between ${rainMinutes !== null ? 'border-primary/50' : ''}`}>
                <div className="flex items-center gap-3">
                    <CloudRain className="text-secondary" />
                    <span className="text-gray-400">Precipitation</span>
                </div>
                {rainMinutes !== null ? (
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary animate-pulse">
                        Rain in {rainMinutes}m
                    </span>
                ) : (
                    <span className="text-xl font-medium text-white">None</span>
                )}
            </GlassCard>

            {/* Feels Like */}
            <GlassCard className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Thermometer size={18} /> Feels Like
                </div>
                <div className="text-3xl font-bold">{Math.round(feelsLike)}°</div>
                <div className="text-xs text-gray-500">
                    {feelsLike > weather.current_weather.temperature ? 'Humid' : 'Wind Chill'}
                </div>
            </GlassCard>

            {/* Humidity */}
            <GlassCard className={`p-6 flex flex-col gap-4 ${isMonsoon ? 'animate-pulse ring-2 ring-purple-500/20' : ''}`}>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Droplets size={18} /> Humidity
                </div>
                <div className="text-3xl font-bold">{Math.round(currentHumidity)}%</div>
                <div className="text-xs text-gray-500">Dew Point {Math.round(weather.current_weather.temperature - ((100 - currentHumidity) / 5))}°</div>
            </GlassCard>

            {/* Visibility */}
            <GlassCard className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Eye size={18} /> Visibility
                </div>
                <div className="text-3xl font-bold">{(visibility / 1000).toFixed(1)} <span className="text-lg">km</span></div>
                <div className="text-xs text-gray-500">
                    {visibility > 9000 ? 'Clear View' : 'Haze'}
                </div>
            </GlassCard>

            {/* AQI */}
            <GlassCard className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Wind size={18} /> AQI
                </div>
                <div className="text-3xl font-bold">{aqi !== null ? aqi : 'N/A'}</div>
                <div className="text-xs text-gray-500">
                    {aqi && aqi <= 50 ? 'Good' : aqi && aqi <= 100 ? 'Moderate' : 'Unhealthy'}
                </div>
            </GlassCard>

            {/* Sunrise/Sunset */}
            <GlassCard className="col-span-2 p-6 flex justify-around">
                <div className="flex flex-col items-center gap-2">
                    <div className="text-gray-400 text-xs flex items-center gap-1"><Sunrise size={14} /> Sunrise</div>
                    <span className="text-xl font-bold">{sunrise}</span>
                </div>
                <div className="w-px bg-white/10"></div>
                <div className="flex flex-col items-center gap-2">
                    <div className="text-gray-400 text-xs flex items-center gap-1"><Sunset size={14} /> Sunset</div>
                    <span className="text-xl font-bold">{sunset}</span>
                </div>
            </GlassCard>

            {/* UV Index & Wind */}
            <GlassCard className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Sun size={18} /> UV Index
                </div>
                <div className="text-3xl font-bold">{uvIndex ? Math.round(uvIndex) : 'N/A'}</div>
            </GlassCard>

            <GlassCard className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Wind size={18} /> Wind
                </div>
                <div className="text-3xl font-bold">{Math.round(windSpeed)} <span className="text-lg">km/h</span></div>
            </GlassCard>

            {/* Install App Prompt */}
            {showInstall && (
                <GlassCard
                    className="col-span-2 p-4 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={onInstall}
                >
                    <div className="flex items-center gap-3 text-primary">
                        <Download size={20} />
                        <span className="font-semibold">Install Rift Sky</span>
                    </div>
                    <span className="text-sm text-gray-400">Add to Home Screen</span>
                </GlassCard>
            )}
        </div>
    );
};

export default MetricsGrid;
