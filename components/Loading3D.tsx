"use client";

import { motion } from "framer-motion";

interface Loading3DProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loading3D({ message = "Loading...", fullScreen = true }: Loading3DProps) {
  const containerClass = fullScreen 
    ? "min-h-screen fixed inset-0 z-50 bg-white/80 backdrop-blur-sm" 
    : "w-full h-full min-h-[300px] bg-transparent";

  return (
    <div className={`${containerClass} flex flex-col items-center justify-center`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex flex-col items-center"
      >
        <div className="relative w-12 h-12 mb-4">
          <motion.div
            className="absolute inset-0 border-4 border-emerald-100 rounded-full"
          />
          <motion.div
            className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
        
        <motion.p 
          className="text-gray-600 font-medium text-sm tracking-wide"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}
