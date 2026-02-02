"use client";

import { FaSun, FaMoon, FaCloud, FaCloudMoon, FaCloudRain, FaSnowflake, FaWind, FaTint, FaCompressArrowsAlt, FaRegSun } from "react-icons/fa";
import { motion } from "framer-motion";

interface CurrentWeatherProps {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  feelsLike?: number;
  sunrise?: string;
  sunset?: string;
  isNight?: boolean;
}

export default function CurrentWeatherCard({ data }: { data: CurrentWeatherProps }) {
  const cn = data.condition.toLowerCase();
  const isNight = data.isNight ?? false;

  // Night-aware weather icon
  const getWeatherIcon = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes("rain")) return <FaCloudRain className="text-blue-500 dark:text-blue-400" />;
    if (c.includes("snow")) return <FaSnowflake className="text-cyan-500 dark:text-cyan-400" />;
    if (c.includes("cloud")) {
      return isNight 
        ? <FaCloudMoon className="text-gray-400 dark:text-gray-300" />
        : <FaCloud className="text-gray-500 dark:text-gray-400" />;
    }
    // Clear sky
    return isNight 
      ? <FaMoon className="text-indigo-400 dark:text-indigo-300" />
      : <FaSun className="text-yellow-500 dark:text-yellow-400" />;
  };

  // Get condition text (with night awareness)
  const getConditionText = () => {
    const c = data.condition.toLowerCase();
    if (c.includes("rain")) return "Rainy";
    if (c.includes("snow")) return "Snowy";
    if (c.includes("cloud")) return isNight ? "Cloudy Night" : "Cloudy";
    if (c.includes("clear") || c.includes("sun")) return isNight ? "Clear Night" : "Sunny";
    return data.condition;
  };

  const getGradient = () => {
    if (cn.includes("rain")) return "bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700/50";
    if (cn.includes("cloud")) return "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-700/30 border-gray-200 dark:border-gray-600/50";
    if (cn.includes("snow")) return "bg-gradient-to-br from-cyan-50 to-cyan-100 dark:from-cyan-900/30 dark:to-cyan-800/30 border-cyan-200 dark:border-cyan-700/50";
    if (isNight) return "bg-gradient-to-br from-indigo-50 to-purple-100 dark:from-indigo-900/30 dark:to-purple-800/30 border-indigo-200 dark:border-indigo-700/50";
    return "bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/30 dark:to-orange-800/30 border-yellow-200 dark:border-yellow-700/50";
  };

  const getTextColor = () => {
    if (cn.includes("rain")) return "text-blue-800 dark:text-blue-100";
    if (cn.includes("cloud")) return "text-gray-800 dark:text-gray-100";
    if (cn.includes("snow")) return "text-cyan-800 dark:text-cyan-100";
    if (isNight) return "text-indigo-800 dark:text-indigo-100";
    return "text-yellow-900 dark:text-yellow-100";
  };

  // Format time from ISO or HH:MM format
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "--:--";
    try {
      // Check if it's a full ISO string or just time
      if (timeStr.includes("T")) {
        const date = new Date(timeStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      // Assume HH:MM format
      const [hours, minutes] = timeStr.split(":");
      const h = parseInt(hours);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="h-full perspective-1000">
      <motion.div
        whileHover={{ scale: 1.01, rotateX: 5, rotateY: 5, z: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`h-full p-5 rounded-3xl shadow-lg relative overflow-hidden group cursor-pointer border ${getGradient()}`}
        style={{ transformStyle: "preserve-3d" }}
      >
         {/* Background Depth Effect */}
         <div className="absolute inset-0 bg-white/40 dark:bg-black/10 backdrop-blur-[2px] z-0 pointer-events-none" />
         
         {/* Shine Effect */}
         <motion.div 
            className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 z-20 pointer-events-none"
            animate={{ x: "400%" }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear", repeatDelay: 2 }}
         />

        <div className="flex justify-between items-center h-full relative z-10 transform-gpu" style={{ transform: "translateZ(20px)" }}>
          
          {/* Left: Temp Data */}
          <div className="flex flex-col">
            <div className={`text-5xl font-bold mb-1 tracking-tighter ${getTextColor()}`}>{Math.round(data.temperature)}°</div>
            <div className="text-gray-500 dark:text-gray-400 font-medium mb-4 flex items-center gap-2">
              <span className="px-2 py-0.5 bg-white/50 dark:bg-white/10 rounded-full text-[10px] backdrop-blur-md border border-black/5 dark:border-white/5">
                 Feels {Math.round(data.feelsLike || data.temperature)}°
              </span>
            </div>

            <div className="space-y-2">
               <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 shadow-sm">
                    <span className="text-yellow-600 dark:text-yellow-400 text-xs">↑</span>
                  </div>
                  <div>
                     <p className="text-[8px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Sunrise</p>
                     <p className={`font-semibold text-xs ${getTextColor()}`}>{formatTime(data.sunrise)}</p>
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center border border-orange-500/30 shadow-sm">
                    <span className="text-orange-600 dark:text-orange-400 text-xs">↓</span>
                  </div>
                  <div>
                     <p className="text-[8px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">Sunset</p>
                     <p className={`font-semibold text-xs ${getTextColor()}`}>{formatTime(data.sunset)}</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Center: Icon & Condition */}
          <div className="flex flex-col items-center justify-center mx-2">
            <motion.div 
              className="text-6xl mb-2 drop-shadow-2xl"
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              {getWeatherIcon(data.condition)}
            </motion.div>
            <p className={`text-lg font-bold tracking-wide ${getTextColor()}`}>{getConditionText()}</p>
          </div>

          {/* Right: Grid Details */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
             {[
               { icon: <FaTint />, val: `${data.humidity}%`, label: "Humidity", color: "text-blue-400" },
               { icon: <FaWind />, val: `${data.windSpeed} k/h`, label: "Wind", color: "text-teal-400" },
               { icon: <FaCompressArrowsAlt />, val: "1012", label: "Pressure", color: "text-purple-400" },
               { icon: <FaRegSun />, val: "8", label: "UV", color: "text-orange-400" }
             ].map((item, i) => (
               <div key={i} className="bg-white/40 dark:bg-white/5 p-2 rounded-xl backdrop-blur-sm border border-white/20 dark:border-white/5 text-center transition-colors hover:bg-white/60 dark:hover:bg-white/10 shadow-sm">
                  <div className={`text-lg mb-1 flex justify-center ${item.color}`}>{item.icon}</div>
                  <p className={`text-xs font-bold ${getTextColor()}`}>{item.val}</p>
                  <p className="text-[8px] text-gray-500 dark:text-gray-400 uppercase tracking-widest">{item.label}</p>
               </div>
             ))}
          </div>

        </div>
      </motion.div>
    </div>
  );
}
