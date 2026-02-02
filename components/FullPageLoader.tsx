"use client";

import { motion } from "framer-motion";


export default function FullPageLoader() {
  const text = "FARMVOICE".split("");

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#fafafa] overflow-hidden">
      


      {/* Main Text Container */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        
        {/* Main Text */}
        <div className="flex items-center justify-center space-x-4 md:space-x-8 lg:space-x-12">
          {text.map((char, i) => (
            <motion.span
              key={i}
              className="text-6xl md:text-8xl lg:text-9xl font-extralight text-emerald-900/80 drop-shadow-sm select-none"
              initial={{ y: 50, opacity: 0, filter: "blur(10px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{
                duration: 1.2,
                delay: 0.5 + (i * 0.1),
                ease: [0.22, 1, 0.36, 1] // Custom easeOut
              }}
            >
              {char}
            </motion.span>
          ))}
        </div>

        {/* Reflection/Water Effect */}
        <div className="flex items-center justify-center space-x-4 md:space-x-8 lg:space-x-12 -mt-2 md:-mt-4 lg:-mt-6 opacity-30 pointer-events-none blur-[2px]">
          {text.map((char, i) => (
            <motion.span
              key={`reflect-${i}`}
              className="text-6xl md:text-8xl lg:text-9xl font-extralight text-emerald-900/50 select-none scale-y-[-1] origin-bottom mask-image-gradient"
              initial={{ y: 50, opacity: 0, filter: "blur(10px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(2px)" }}
              transition={{
                duration: 1.2,
                delay: 0.6 + (i * 0.1),
                ease: [0.22, 1, 0.36, 1]
              }}
              style={{
                background: "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)",
                WebkitBackgroundClip: "text",
                // Note: Pure CSS reflection is sometimes better with -webkit-box-reflect, 
                // but that's non-standard. The transform method is safer.
                maskImage: "linear-gradient(to bottom, black 20%, transparent 90%)",
                WebkitMaskImage: "linear-gradient(to bottom, black 20%, transparent 90%)"
              }}
            >
              {char}
            </motion.span>
          ))}
        </div>

      </div>
    </div>
  );
}
