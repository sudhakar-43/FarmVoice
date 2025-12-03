"use client";

import { useEffect, useState } from "react";
import { FaSeedling } from "react-icons/fa";

export default function NewLoader() {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900">
      <div className="relative w-24 h-24 mb-8">
        {/* Growing Plant Animation */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-2 h-0 bg-emerald-500 rounded-full animate-grow-stem"></div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-8 h-8 text-emerald-500 opacity-0 animate-bloom-leaf-left">
          <FaSeedling className="transform -scale-x-100" />
        </div>
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-10 h-10 text-emerald-600 opacity-0 animate-bloom-leaf-right">
           <FaSeedling />
        </div>
        
        {/* Pulsing Soil */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-amber-800/20 dark:bg-amber-700/30 rounded-full animate-pulse"></div>
      </div>
      
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white tracking-wide">
        FarmVoice{dots}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Cultivating your dashboard</p>

      <style jsx>{`
        @keyframes grow-stem {
          0% { height: 0; opacity: 0; }
          30% { height: 40px; opacity: 1; }
          100% { height: 60px; opacity: 1; }
        }
        @keyframes bloom-leaf-left {
          0%, 30% { transform: translate(-50%, 10px) scale(0); opacity: 0; }
          60% { transform: translate(-80%, 0) scale(1) rotate(-20deg); opacity: 1; }
          100% { transform: translate(-80%, 0) scale(1) rotate(-20deg); opacity: 1; }
        }
        @keyframes bloom-leaf-right {
          0%, 50% { transform: translate(-50%, 10px) scale(0); opacity: 0; }
          80% { transform: translate(-20%, -10px) scale(1.2) rotate(10deg); opacity: 1; }
          100% { transform: translate(-20%, -10px) scale(1.2) rotate(10deg); opacity: 1; }
        }
        .animate-grow-stem {
          animation: grow-stem 2s ease-out forwards infinite;
        }
        .animate-bloom-leaf-left {
          animation: bloom-leaf-left 2s ease-out forwards infinite;
        }
        .animate-bloom-leaf-right {
          animation: bloom-leaf-right 2s ease-out forwards infinite;
        }
      `}</style>
    </div>
  );
}
