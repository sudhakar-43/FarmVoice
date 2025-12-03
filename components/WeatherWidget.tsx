"use client";

import { useState, useEffect } from "react";
import { FaCloudSun, FaTemperatureHigh, FaWind, FaTint, FaMapMarkerAlt, FaSpinner, FaLeaf, FaExclamationTriangle, FaWater, FaSprayCan } from "react-icons/fa";
import { apiClient } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";

interface WeatherWidgetProps {
  compact?: boolean;
}

interface Insight {
  type: "spraying" | "disease" | "irrigation" | "temperature" | "harvest";
  status: "good" | "warning" | "danger";
  message: string;
  icon: React.ReactNode;
}

export default function WeatherWidget({ compact = false }: WeatherWidgetProps) {
  const { t } = useSettings();
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Get user location from profile or use default
        const profile = JSON.parse(localStorage.getItem("farmvoice_profile") || "{}");
        const lat = profile.latitude || 16.3067; // Default to Guntur
        const lon = profile.longitude || 80.4365;

        const response = await apiClient.getWeather(lat, lon);
        
        if (response.error) {
          throw new Error(response.error);
        }

        if (response.data) {
          setWeather(response.data);
          generateInsights(response.data);
        }
      } catch (err) {
        console.error("Error fetching weather:", err);
        setError("Failed to load weather");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const generateInsights = (data: any) => {
    const current = data.current;
    const newInsights: Insight[] = [];

    // 1. Spraying Advisory
    if (current.wind_speed > 15) {
      newInsights.push({
        type: "spraying",
        status: "danger",
        message: "insight_spray_danger",
        icon: <FaWind />
      });
    } else if (current.wind_speed < 5) {
       newInsights.push({
        type: "spraying",
        status: "good",
        message: "insight_spray_good",
        icon: <FaSprayCan />
      });
    }

    // 2. Disease Risk (Fungal)
    if (current.humidity > 85 && current.temperature > 20 && current.temperature < 30) {
      newInsights.push({
        type: "disease",
        status: "warning",
        message: "insight_disease_warning",
        icon: <FaExclamationTriangle />
      });
    }

    // 3. Irrigation Alert
    const soilMoisture = data.current.soil_moisture;
    if (soilMoisture !== undefined && soilMoisture < 30) {
      newInsights.push({
        type: "irrigation",
        status: "warning",
        message: "insight_irrigation_warning",
        icon: <FaWater />
      });
    } else if (current.condition.toLowerCase().includes("rain")) {
       newInsights.push({
        type: "irrigation",
        status: "good",
        message: "insight_irrigation_good",
        icon: <FaCloudSun />
      });
    }

    // 4. Heat/Frost Stress
    if (current.temperature > 35) {
      newInsights.push({
        type: "temperature",
        status: "danger",
        message: "insight_heat_danger",
        icon: <FaTemperatureHigh />
      });
    } else if (current.temperature < 10) {
       newInsights.push({
        type: "temperature",
        status: "warning",
        message: "insight_cold_warning",
        icon: <FaTemperatureHigh />
      });
    }

    setInsights(newInsights);
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 h-full flex items-center justify-center">
        <FaSpinner className="animate-spin text-emerald-600 dark:text-emerald-400 text-2xl" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 h-full flex items-center justify-center text-red-500 dark:text-red-400">
        <p>{t('weather_unavailable')}</p>
      </div>
    );
  }

  const current = weather.current;
  const location = "Guntur, AP"; // In a real app, reverse geocode this

  if (compact) {
    return (
      <div className="text-gray-800 dark:text-white h-full flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <FaCloudSun className="text-4xl mr-3 text-yellow-500" />
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{current.temperature}°C</div>
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{current.condition}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end text-sm text-gray-500 dark:text-gray-400 mb-1">
              <FaMapMarkerAlt className="mr-1 text-emerald-600 dark:text-emerald-400" /> {location}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-auto bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-100 dark:border-gray-600">
          <div className="flex items-center">
            <FaTint className="mr-2 text-blue-500 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{current.humidity}% {t('humidity')}</span>
          </div>
          <div className="flex items-center">
            <FaWind className="mr-2 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{current.wind_speed} km/h {t('wind')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Weather Card */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-900 rounded-3xl text-white p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-yellow-300 opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center mb-6 md:mb-0">
            <FaCloudSun className="text-7xl mr-6 text-yellow-300 drop-shadow-lg" />
            <div>
              <div className="text-6xl font-bold mb-1 drop-shadow-md">{current.temperature}°C</div>
              <div className="text-xl font-medium opacity-90">{current.condition}</div>
              <div className="flex items-center mt-2 text-sm opacity-80">
                <FaMapMarkerAlt className="mr-1" /> {location}
              </div>
            </div>
          </div>

          <div className="flex space-x-4 text-center">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 min-w-[100px] border border-white/10">
              <p className="text-xs font-bold mb-2 opacity-80 uppercase tracking-wider">{t('humidity')}</p>
              <FaTint className="text-2xl mx-auto mb-2" />
              <p className="font-bold text-lg">{current.humidity}%</p>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 min-w-[100px] border border-white/10">
               <p className="text-xs font-bold mb-2 opacity-80 uppercase tracking-wider">{t('wind')}</p>
               <FaWind className="text-2xl mx-auto mb-2" />
               <p className="font-bold text-lg">{current.wind_speed} <span className="text-xs">km/h</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Farming Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.length > 0 ? (
          insights.map((insight, index) => (
            <div 
              key={index}
              className={`p-4 rounded-2xl border-l-4 shadow-sm flex items-start space-x-4 ${
                insight.status === "danger" ? "bg-red-50 dark:bg-red-900/20 border-red-500 text-red-800 dark:text-red-200" :
                insight.status === "warning" ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 text-yellow-800 dark:text-yellow-200" :
                "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-800 dark:text-emerald-200"
              }`}
            >
              <div className={`p-2 rounded-full ${
                insight.status === "danger" ? "bg-red-100 dark:bg-red-800/50 text-red-600 dark:text-red-300" :
                insight.status === "warning" ? "bg-yellow-100 dark:bg-yellow-800/50 text-yellow-600 dark:text-yellow-300" :
                "bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-300"
              }`}>
                {insight.icon}
              </div>
              <div>
                <h4 className="font-bold text-sm uppercase tracking-wide opacity-80 mb-1">{t('insight')}</h4>
                <p className="font-medium leading-tight">{t(insight.message as any)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
            <FaLeaf className="mx-auto text-3xl mb-2 opacity-30" />
            <p>{t('stable_conditions')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
