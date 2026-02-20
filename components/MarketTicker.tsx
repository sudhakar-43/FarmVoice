"use client";

import { useEffect, useState } from "react";
import { FaArrowUp, FaArrowDown, FaMinus, FaChartLine } from "react-icons/fa";
import { motion } from "framer-motion";

interface MarketItem {
  commodity: string;
  price: number;
  change: number; // Percentage change
  unit: string;
}

export default function MarketTicker() {
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Mock data for now - in production this would come from an API
    const mockData: MarketItem[] = [
      { commodity: "Wheat", price: 2150, change: 2.5, unit: "₹/Qtl" },
      { commodity: "Rice", price: 3200, change: -1.2, unit: "₹/Qtl" },
      { commodity: "Cotton", price: 6500, change: 0.8, unit: "₹/Qtl" },
      { commodity: "Maize", price: 1850, change: 0.0, unit: "₹/Qtl" },
      { commodity: "Soybean", price: 4200, change: 1.5, unit: "₹/Qtl" },
      { commodity: "Potato", price: 1200, change: -3.0, unit: "₹/Qtl" },
      { commodity: "Tomato", price: 2500, change: 5.4, unit: "₹/Qtl" },
      { commodity: "Onion", price: 1800, change: -0.5, unit: "₹/Qtl" },
    ];
    setMarketData(mockData);
  }, []);

  if (!mounted) return null;

  return (
    <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 overflow-hidden py-2 shadow-sm relative z-30">
      <div className="max-w-7xl mx-auto flex items-center">
        <div className="flex-shrink-0 px-4 flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold border-r border-gray-200 dark:border-gray-800 mr-4 z-10 bg-white dark:bg-gray-900 pr-6">
          <FaChartLine />
          <span className="hidden sm:inline whitespace-nowrap">Market Rates</span>
        </div>
        
        <div className="flex-1 overflow-hidden relative mask-linear-fade">
          <motion.div 
            className="flex gap-12 whitespace-nowrap"
            animate={{ x: ["0%", "-25%"] }} 
            transition={{ 
              repeat: Infinity, 
              ease: "linear", 
              duration: 30, // Slower for readability
            }}
          >
            {/* Quadruplicate list for seamless infinite loop on wide screens */}
            {[...marketData, ...marketData, ...marketData, ...marketData].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm font-medium min-w-max">
                <span className="text-gray-600 dark:text-gray-400">{item.commodity}:</span>
                <span className="text-gray-900 dark:text-white font-bold">{item.price} {item.unit}</span>
                <span className={`flex items-center text-xs ${
                  item.change > 0 ? "text-emerald-500" : item.change < 0 ? "text-red-500" : "text-gray-500"
                }`}>
                  {item.change > 0 ? <FaArrowUp size={10} /> : item.change < 0 ? <FaArrowDown size={10} /> : <FaMinus size={10} />}
                  <span className="ml-0.5">{Math.abs(item.change)}%</span>
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
