"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaSync, FaExclamationTriangle, FaLightbulb } from "react-icons/fa";
import DigitalClock from "@/components/weather/DigitalClock";
import CurrentWeatherCard from "@/components/weather/CurrentWeatherCard";
import ForecastList from "@/components/weather/ForecastList";
import HourlyForecast from "@/components/weather/HourlyForecast";
import { useSettings } from "@/context/SettingsContext";

// Skeleton loading component
function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-gray-200 dark:bg-gray-700 rounded-3xl animate-pulse ${className}`}>
      <div className="p-5 h-full flex flex-col justify-center items-center gap-3">
        <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full" />
        <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
        <div className="w-32 h-3 bg-gray-300 dark:bg-gray-600 rounded" />
      </div>
    </div>
  );
}

export default function WeatherPage() {
  const router = useRouter();
  const { theme } = useSettings();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  // Fetch weather data with caching and abort handling
  const fetchWeather = async (params: { lat?: number, lon?: number, pincode?: string } = {}, forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      setLoadingTimeout(false);

      // Abort any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Set a timeout to show "Fetching..." message after 3 seconds
      const timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 3000);

      // Check cache first (unless force refresh)
      if (!forceRefresh && !params.lat && !params.lon && !params.pincode) {
        const cached = localStorage.getItem("farmvoice_weather_cache");
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();
            // Use cached data if less than 15 minutes old
            if (now - timestamp < 900000) {
              setWeatherData(data);
              setLastUpdated(data.last_updated || new Date(timestamp).toISOString());
              setLoading(false);
              clearTimeout(timeoutId);
              
              // Background revalidation for fresh data
              if (now - timestamp > 300000) { // Revalidate if > 5 min old
                fetchWeatherInBackground();
              }
              return;
            }
          } catch (e) {
            console.error("Cache parse error", e);
          }
        }
      }

      const token = localStorage.getItem("farmvoice_token");
      
      let url = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/weather/current`;
      const queryParams = [];
      
      if (params.lat && params.lon) {
        queryParams.push(`lat=${params.lat}`);
        queryParams.push(`lon=${params.lon}`);
      }
      if (params.pincode) {
        queryParams.push(`pincode=${params.pincode}`);
      }
      
      if (queryParams.length > 0) {
        url += `?${queryParams.join("&")}`;
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortControllerRef.current.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 401) {
        localStorage.removeItem("farmvoice_token");
        router.push("/login");
        return;
      }
      
      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }
      
      const data = await response.json();
      setWeatherData(data);
      setLastUpdated(data.last_updated || new Date().toISOString());
      
      // Update cache
      if (!params.lat && !params.pincode) {
        localStorage.setItem("farmvoice_weather_cache", JSON.stringify({
          data: data,
          timestamp: Date.now()
        }));
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Request was cancelled, ignore
      }
      console.error("Weather fetch failed", err);
      setError("Weather data unavailable");
    } finally {
      setLoading(false);
    }
  };

  // Background refresh (silent)
  const fetchWeatherInBackground = async () => {
    try {
      const token = localStorage.getItem("farmvoice_token");
      const url = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/weather/current`;
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWeatherData(data);
        setLastUpdated(data.last_updated || new Date().toISOString());
        localStorage.setItem("farmvoice_weather_cache", JSON.stringify({
          data: data,
          timestamp: Date.now()
        }));
      }
    } catch (err) {
      // Silent fail for background refresh
    }
  };

  useEffect(() => {
    fetchWeather();
    
    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Calculate "X minutes ago" text
  const getLastUpdatedText = () => {
    if (!lastUpdated) return null;
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffMs = now.getTime() - updated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Updated just now";
    if (diffMins === 1) return "Updated 1 min ago";
    if (diffMins < 60) return `Updated ${diffMins} min ago`;
    return `Updated ${Math.floor(diffMins / 60)}h ago`;
  };

  // Safe fallback
  const d = weatherData || { 
    temperature: 24, 
    condition: "Clear", 
    humidity: 41, 
    wind_speed: 2, 
    location: "Loading...",
    daily_forecast: [],
    hourly_forecast: [],
    sunrise: "06:00",
    sunset: "18:00",
    is_night: false,
    insights: []
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#1E1E1E]' : 'bg-[#E0E0E0]'} flex items-center justify-center p-4`}>
      {/* Main Container */}
      <div className="w-full max-w-6xl mx-auto h-[90vh] flex flex-col">
        
        {/* --- TOP BAR --- */}
        <div className="flex-shrink-0 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()} 
              className={`p-2 rounded-full transition-colors flex items-center justify-center ${
                theme === 'dark' 
                  ? 'text-white hover:bg-white/10' 
                  : 'text-gray-800 hover:bg-black/10 bg-white/50'
              }`}
            >
              <FaArrowLeft className="text-lg" />
            </button>
            <h1 className={`text-2xl font-bold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Weather</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {lastUpdated && !loading && (
              <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                {getLastUpdatedText()}
              </span>
            )}
            <button 
              onClick={() => fetchWeather({}, true)}
              disabled={loading}
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark' 
                  ? 'text-white/70 hover:bg-white/10' 
                  : 'text-gray-600 hover:bg-black/10'
              } ${loading ? 'animate-spin' : ''}`}
            >
              <FaSync className="text-sm" />
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className={`mb-4 p-4 rounded-xl flex items-center justify-between ${
            theme === 'dark' ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => fetchWeather({}, true)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                theme === 'dark' ? 'bg-red-800 hover:bg-red-700' : 'bg-red-200 hover:bg-red-300'
              }`}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading timeout message */}
        {loading && loadingTimeout && (
          <div className={`mb-4 p-3 rounded-xl text-center text-sm ${
            theme === 'dark' ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800'
          }`}>
            Fetching latest weather data...
          </div>
        )}

        {/* Farmer Insights */}
        {d.insights && d.insights.length > 0 && !loading && (
          <div className={`mb-4 p-3 rounded-xl ${
            theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
          }`}>
            <div className="flex items-start gap-2">
              <FaLightbulb className={`mt-0.5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
              <div className="flex-1">
                {d.insights.map((insight: any, idx: number) => (
                  <p key={idx} className={`text-sm ${theme === 'dark' ? 'text-green-200' : 'text-green-800'}`}>
                    {insight.message}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- MAIN DASHBOARD GRID --- */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
           
          {/* 1. Clock Card (Left, 1 col) */}
          <div className="lg:col-span-1 h-full min-h-[180px]">
            {loading && !weatherData ? (
              <SkeletonCard className="h-full" />
            ) : (
              <DigitalClock city={d.location} />
            )}
          </div>

          {/* 2. Current Weather (Right, 2 cols) */}
          <div className="lg:col-span-2 h-full min-h-[180px]">
            {loading && !weatherData ? (
              <SkeletonCard className="h-full" />
            ) : (
              <CurrentWeatherCard data={{
                temperature: d.temperature,
                condition: d.condition,
                humidity: d.humidity,
                windSpeed: d.wind_speed,
                feelsLike: d.temperature - 1,
                sunrise: d.sunrise,
                sunset: d.sunset,
                isNight: d.is_night
              }} />
            )}
          </div>

          {/* 3. 5-Day Forecast (Left, 1 col) */}
          <div className="lg:col-span-1 h-full min-h-[200px] overflow-hidden">
            {loading && !weatherData ? (
              <SkeletonCard className="h-full" />
            ) : (
              <ForecastList data={d.daily_forecast} />
            )}
          </div>

          {/* 4. Hourly Forecast (Right, 2 cols) */}
          <div className="lg:col-span-2 h-full min-h-[200px] overflow-hidden">
            {loading && !weatherData ? (
              <SkeletonCard className="h-full" />
            ) : (
              <HourlyForecast data={d.hourly_forecast} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
