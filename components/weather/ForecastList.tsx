"use client";

import { FaSun, FaCloud, FaCloudRain, FaSnowflake, FaTint } from "react-icons/fa";
import { motion } from "framer-motion";

interface ForecastItem {
    date: string;
    max_temp: number;
    min_temp: number;
    condition?: string;
    rain_probability?: number;
    precip_mm?: number;
}

// Skeleton for loading state
function ForecastSkeleton() {
  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-900/90 rounded-3xl p-5">
      <div className="h-5 w-32 bg-gray-300 dark:bg-gray-600 rounded mb-3 animate-pulse" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between p-2 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full" />
              <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
            </div>
            <div className="w-12 h-3 bg-gray-300 dark:bg-gray-600 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ForecastList({ data = [], loading = false }: { data?: ForecastItem[], loading?: boolean }) {
  if (loading) {
    return <ForecastSkeleton />;
  }

  // Use real data or fallback to empty array
  const days = data.slice(0, 5); 

  const getIcon = (item: ForecastItem) => {
    const c = (item.condition || "").toLowerCase();
    
    // Use rain probability or precip to determine rainy icon
    if (c.includes("rain") || (item.rain_probability && item.rain_probability > 50) || (item.precip_mm && item.precip_mm > 5)) {
      return <FaCloudRain className="text-blue-500 dark:text-blue-400" />;
    }
    if (c.includes("cloud")) return <FaCloud className="text-gray-400 dark:text-gray-300" />;
    if (c.includes("snow")) return <FaSnowflake className="text-cyan-500 dark:text-cyan-400" />;
    return <FaSun className="text-yellow-500 dark:text-yellow-400" />;
  };

  return (
    <div className="h-full perspective-1000">
      <motion.div
        whileHover={{ scale: 1.01, rotateX: 2, rotateY: 2, z: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white p-5 rounded-3xl shadow-lg relative overflow-hidden group cursor-pointer"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Shine Effect */}
        <motion.div 
           className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 z-20 pointer-events-none"
           animate={{ x: "400%" }}
           transition={{ repeat: Infinity, duration: 4, ease: "linear", repeatDelay: 2 }}
        />

        <div className="relative z-10 transform-gpu h-full flex flex-col" style={{ transform: "translateZ(20px)" }}>
           <h3 className="text-lg font-bold mb-3 text-gray-700 dark:text-gray-200">5-Day Forecast</h3>
           
           <div className="flex-1 flex flex-col justify-between overflow-y-auto">
             {days.map((day, idx) => {
               const dateObj = new Date(day.date);
               // Check if date is valid, else fallback
               const isValidDate = !isNaN(dateObj.getTime());
               const dayName = isValidDate ? dateObj.toLocaleDateString([], { weekday: 'short' }) : `Day ${idx + 1}`;
               const dateNum = isValidDate ? dateObj.getDate() : "";
               
               return (
               <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-black/5 dark:hover:border-white/5">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center text-lg shadow-inner">
                        {getIcon(day)}
                     </div>
                     <div>
                       <span className="text-sm font-bold">{dayName} {dateNum}</span>
                       {/* Rain probability */}
                       {day.rain_probability !== undefined && day.rain_probability > 0 && (
                         <div className="flex items-center gap-1 text-blue-500">
                           <FaTint className="text-[8px]" />
                           <span className="text-[10px]">{day.rain_probability}%</span>
                         </div>
                       )}
                     </div>
                  </div>
                  
                  {/* High/Low temps */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-sm">
                      <span className="font-bold text-gray-800 dark:text-gray-100">{Math.round(day.max_temp)}°</span>
                      <span className="text-gray-400 dark:text-gray-500">/</span>
                      <span className="text-gray-500 dark:text-gray-400">{Math.round(day.min_temp)}°</span>
                    </div>
                  </div>
               </div>
             );})}
             {days.length === 0 && <div className="text-center text-gray-500 text-sm mt-4">No forecast data available</div>}
           </div>
        </div>
      </motion.div>
    </div>
  );
}
