"use client";

import { FaSun, FaMoon, FaCloud, FaCloudMoon, FaCloudRain, FaLocationArrow, FaSnowflake, FaTint } from "react-icons/fa";
import { motion } from "framer-motion";

interface HourlyItem {
    time: string;
    temperature: number;
    humidity?: number;
    wind_speed?: number;
    precipitation_prob?: number;
    is_day?: boolean;
    condition?: string;
}

// Skeleton for loading state
function HourlySkeleton() {
  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-900/90 rounded-3xl p-5">
      <div className="h-4 w-32 bg-gray-300 dark:bg-gray-600 rounded mb-4 mx-auto animate-pulse" />
      <div className="grid grid-cols-6 gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl py-3 px-1 flex flex-col items-center gap-2 animate-pulse">
            <div className="w-8 h-3 bg-gray-300 dark:bg-gray-600 rounded" />
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
            <div className="w-6 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HourlyForecast({ data = [], loading = false }: { data?: HourlyItem[], loading?: boolean }) {
  if (loading) {
    return <HourlySkeleton />;
  }

  // Show next 12 hours
  const hours = data.slice(0, 12);

  const getIcon = (item: HourlyItem) => {
    const c = (item.condition || "").toLowerCase();
    const isDay = item.is_day !== false; // Default to day if not specified
    
    if (c.includes("rain") || (item.precipitation_prob && item.precipitation_prob > 50)) {
      return <FaCloudRain className="text-blue-500 dark:text-blue-400" />;
    }
    if (c.includes("cloud")) {
      return isDay 
        ? <FaCloud className="text-gray-400 dark:text-gray-300" />
        : <FaCloudMoon className="text-gray-400 dark:text-gray-300" />;
    }
    if (c.includes("snow")) {
      return <FaSnowflake className="text-cyan-500 dark:text-cyan-400" />;
    }
    // Clear
    return isDay 
      ? <FaSun className="text-yellow-500 dark:text-yellow-400" />
      : <FaMoon className="text-indigo-400 dark:text-indigo-300" />;
  };

  // Format time from ISO string
  const formatTime = (timeStr: string) => {
    try {
      if (timeStr.includes("T")) {
        const date = new Date(timeStr);
        return date.toLocaleTimeString([], { hour: '2-digit', hour12: true }).replace(/\s/g, '');
      }
      return timeStr;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="h-full perspective-1000">
      <motion.div
        whileHover={{ scale: 1.01, rotateX: 2, rotateY: 2, z: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white p-5 rounded-3xl shadow-lg relative overflow-hidden group flex flex-col justify-center cursor-pointer"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Shine Effect */}
        <motion.div 
           className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 z-20 pointer-events-none"
           animate={{ x: "400%" }}
           transition={{ repeat: Infinity, duration: 4, ease: "linear", repeatDelay: 2 }}
        />

        <div className="relative z-10 transform-gpu h-full flex flex-col" style={{ transform: "translateZ(20px)" }}>
           <h3 className="text-lg font-bold mb-4 text-center text-gray-700 dark:text-gray-200">Hourly Forecast</h3>
           
           <div className="grid grid-cols-6 gap-2 flex-1 items-center overflow-x-auto">
              {hours.slice(0, 6).map((item, idx) => (
                 <div key={idx} className="bg-white/60 dark:bg-white/5 rounded-xl py-3 px-1 flex flex-col items-center justify-between gap-1 shadow-sm hover:shadow-md hover:scale-105 transition-all cursor-pointer group/item border border-gray-100 dark:border-white/5 h-full min-w-[60px]">
                    <span className="font-bold text-[10px] text-gray-500 dark:text-gray-400">{formatTime(item.time)}</span>
                    
                    <div className="text-2xl my-1 group-hover/item:scale-110 transition-transform filter drop-shadow-sm">
                       {getIcon(item)}
                    </div>
                    
                    <span className="font-bold text-base">{Math.round(item.temperature)}°</span>
                    
                    {/* Rain probability */}
                    {item.precipitation_prob !== undefined && item.precipitation_prob > 0 && (
                      <div className="flex items-center gap-0.5 text-blue-500">
                        <FaTint className="text-[8px]" />
                        <span className="text-[9px] font-medium">{item.precipitation_prob}%</span>
                      </div>
                    )}
                    
                    {/* Wind if no rain */}
                    {(!item.precipitation_prob || item.precipitation_prob === 0) && item.wind_speed && (
                      <div className="flex flex-col items-center">
                        <FaLocationArrow className="transform -rotate-45 text-[8px] text-gray-400" />
                        <span className="text-[8px] font-medium text-gray-500 dark:text-gray-400">{Math.round(item.wind_speed)}</span>
                      </div>
                    )}
                 </div>
              ))}
              {hours.length === 0 && <div className="col-span-6 text-center text-sm text-gray-500">No hourly data available</div>}
           </div>

           {/* Show more hours indicator */}
           {hours.length > 6 && (
             <div className="mt-2 text-center">
               <span className="text-xs text-gray-400 dark:text-gray-500">
                 +{hours.length - 6} more hours
               </span>
             </div>
           )}
        </div>
      </motion.div>
    </div>
  );
}
