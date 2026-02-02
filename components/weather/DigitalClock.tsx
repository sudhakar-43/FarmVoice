"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function DigitalClock({ city }: { city: string }) {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="h-full w-full animate-pulse bg-gray-200 dark:bg-gray-700/50 rounded-3xl" />;

  return (
    <div className="h-full perspective-1000">
      <motion.div
         whileHover={{ scale: 1.01, rotateX: 5, rotateY: 5, z: 20 }}
         transition={{ type: "spring", stiffness: 300, damping: 20 }}
         className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/80 dark:to-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white p-5 rounded-3xl shadow-lg relative overflow-hidden group flex flex-col justify-center items-center cursor-pointer"
         style={{ transformStyle: "preserve-3d" }}
      >
        {/* Background Depth */}
        <div className="absolute inset-0 bg-white/40 dark:bg-black/10 backdrop-blur-[2px] z-0 pointer-events-none" />

        {/* Shine Effect */}
        <motion.div 
           className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 z-20 pointer-events-none"
           animate={{ x: "400%" }}
           transition={{ repeat: Infinity, duration: 4, ease: "linear", repeatDelay: 2 }}
        />
        
        <div className="relative z-10 transform-gpu flex flex-col items-center" style={{ transform: "translateZ(20px)" }}>
           <h2 className="text-xl font-semibold mb-2 text-gray-500 dark:text-gray-300">{city}</h2>
           
           <div className="text-5xl font-bold tracking-tight mb-3 drop-shadow-sm dark:drop-shadow-2xl text-gray-800 dark:text-white">
             {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
           </div>
           
           <div className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-widest text-xs bg-emerald-100 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 shadow-sm">
             {time.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })}
           </div>
        </div>
      </motion.div>
    </div>
  );
}
