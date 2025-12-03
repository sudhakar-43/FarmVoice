"use client";

import { useRouter } from "next/navigation";
import { FaArrowLeft } from "react-icons/fa";
import WeatherWidget from "@/components/WeatherWidget";
import { useSettings } from "@/context/SettingsContext";

export default function WeatherPage() {
  const router = useRouter();
  const { t } = useSettings();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Standard Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-300"
                aria-label="Go back"
              >
                <FaArrowLeft />
              </button>
              <div 
                onClick={() => router.push("/home")}
                className="flex items-center space-x-2 cursor-pointer group"
              >
                <img 
                  src="/logo.png" 
                  alt="FarmVoice Logo" 
                  className="h-10 w-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300" 
                />
                <span className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-emerald-700 dark:group-hover:text-emerald-500 transition-colors">FarmVoice</span>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('weather_forecast_title')}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          <WeatherWidget />
        </div>
      </main>
    </div>
  );
}
