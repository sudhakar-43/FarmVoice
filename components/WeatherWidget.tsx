"use client";

import { useState, useEffect } from "react";
import { FaCloudSun, FaTemperatureHigh, FaWind, FaTint, FaMapMarkerAlt, FaSpinner, FaCloudRain, FaSun, FaSnowflake, FaCloud, FaArrowRight } from "react-icons/fa";
import { apiClient } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface WeatherWidgetProps {
  compact?: boolean;
}

export default function WeatherWidget({ compact = false }: WeatherWidgetProps) {
  const { t } = useSettings();
  const router = useRouter();
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const cached = localStorage.getItem("farmvoice_weather_cache");
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < 1800000) { // 30 min cache
                setWeather(data);
                setLoading(false);
                return;
            }
        }

        const profile = JSON.parse(localStorage.getItem("farmvoice_profile") || "{}");
        const lat = profile.latitude || 16.3067;
        const lon = profile.longitude || 80.4365;

        const response = await apiClient.getWeather(lat, lon);
        
        if (response.error) throw new Error(response.error);

        if (response.data) {
          setWeather(response.data);
          localStorage.setItem("farmvoice_weather_cache", JSON.stringify({
              data: response.data,
              timestamp: Date.now()
          }));
        }
      } catch {
        setError("Failed to load weather");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = (condition: string) => {
    const c = condition?.toLowerCase() || "";
    if (c.includes("rain")) return <FaCloudRain className="text-blue-300 drop-shadow-md" />;
    if (c.includes("cloud")) return <FaCloud className="text-gray-300 drop-shadow-md" />;
    if (c.includes("snow")) return <FaSnowflake className="text-blue-200 drop-shadow-md" />;
    if (c.includes("clear") || c.includes("sun")) return <FaSun className="text-yellow-300 drop-shadow-lg" />;
    return <FaCloudSun className="text-yellow-100 drop-shadow-md" />;
  };

  const getGradient = (condition: string) => {
    const c = condition?.toLowerCase() || "";
    if (c.includes("rain")) return "from-blue-600 to-indigo-700";
    if (c.includes("cloud")) return "from-slate-500 to-slate-700";
    if (c.includes("clear") || c.includes("sun")) return "from-blue-400 to-blue-600";
    return "from-blue-500 to-cyan-600";
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col items-center justify-center min-h-[180px]">
        <FaSpinner className="animate-spin text-emerald-500 text-2xl mb-2" />
        <p className="text-xs text-gray-400">Loading forecast...</p>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full flex items-center justify-center text-red-500 min-h-[180px]">
        <p className="text-sm">{t('weather_unavailable')}</p>
      </div>
    );
  }

  const current = weather.current;
  const location = "Your Field"; // Could be dynamic
  const gradient = getGradient(current.condition);

  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-sm text-white bg-gradient-to-br ${gradient} h-full min-h-[180px] group`}>
       {/* Background Decoration */}
       <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity"></div>
       
       <div className="p-5 h-full flex flex-col justify-between relative z-10">
          <div className="flex justify-between items-start">
             <div>
                <div className="flex items-center gap-1 text-xs font-medium text-white/80 mb-1">
                   <FaMapMarkerAlt /> {location}
                </div>
                <h3 className="text-3xl font-bold">{Math.round(current.temperature)}°</h3>
                <p className="text-sm font-medium text-white/90">{current.condition}</p>
             </div>
             
             <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="text-4xl"
             >
                {getWeatherIcon(current.condition)}
             </motion.div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4">
             <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                <FaTint className="mx-auto mb-1 text-blue-200 text-xs" />
                <span className="text-xs font-bold block">{current.humidity}%</span>
                <span className="text-[10px] text-white/70 block uppercase">Humidity</span>
             </div>
             <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                <FaWind className="mx-auto mb-1 text-gray-200 text-xs" />
                <span className="text-xs font-bold block">{current.wind_speed} km/h</span>
                <span className="text-[10px] text-white/70 block uppercase">Wind</span>
             </div>
          </div>
          
          <button 
             onClick={() => router.push("/home/weather")}
             className="absolute bottom-4 right-4 text-white/80 hover:text-white transition-colors"
          >
             <FaArrowRight size={14} />
          </button>
       </div>
    </div>
  );
}
