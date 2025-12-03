"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaLeaf, FaBug, FaChartLine, FaMicrophone, FaArrowUp, FaArrowDown } from "react-icons/fa";
import { motion } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import { apiClient } from "@/lib/api";

export default function DashboardStats() {
  const router = useRouter();
  const { t } = useSettings();
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.request<any>('/api/dashboard/stats', {
          method: 'GET'
        });
        
        if (response.error) {
          throw new Error(response.error);
        }

        // Map API response to stats format
        const apiStats = response.data || {};
        setStats([
          {
            name: t('stat_crop_recommendations'),
            value: apiStats.crop_recommendations || "0",
            change: apiStats.crop_recommendations_change || "+0",
            trend: apiStats.crop_recommendations_trend || "up",
            icon: FaLeaf,
            color: "emerald",
            bgGradient: "from-emerald-500 to-teal-600",
            link: "/home/crop-recommendation"
          },
          {
            name: t('stat_disease_diagnoses'),
            value: apiStats.disease_diagnoses || "0",
            change: apiStats.disease_diagnoses_change || "+0",
            trend: apiStats.disease_diagnoses_trend || "up",
            icon: FaBug,
            color: "red",
            bgGradient: "from-red-500 to-pink-600",
            link: "/home/disease-management"
          },
          {
            name: t('stat_market_alerts'),
            value: apiStats.market_alerts || "0",
            change: apiStats.market_alerts_change || "+0",
            trend: apiStats.market_alerts_trend || "up",
            icon: FaChartLine,
            color: "blue",
            bgGradient: "from-blue-500 to-cyan-600",
            link: "/home/market-prices"
          },
          {
            name: t('stat_voice_queries'),
            value: apiStats.voice_queries || "0",
            change: apiStats.voice_queries_change || "+0",
            trend: apiStats.voice_queries_trend || "up",
            icon: FaMicrophone,
            color: "purple",
            bgGradient: "from-purple-500 to-indigo-600",
            link: "/home/voice-queries"
          }
        ]);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        // Set empty stats on error
        setStats([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [t]);

  const getColorClasses = (color: string) => {
    const colors: { [key: string]: { bg: string; hoverBg: string; text: string; darkBg: string; darkText: string } } = {
      emerald: { bg: "bg-emerald-100", hoverBg: "group-hover:bg-emerald-600", text: "text-emerald-600", darkBg: "dark:bg-emerald-900/30", darkText: "dark:text-emerald-400" },
      red: { bg: "bg-red-100", hoverBg: "group-hover:bg-red-600", text: "text-red-600", darkBg: "dark:bg-red-900/30", darkText: "dark:text-red-400" },
      blue: { bg: "bg-blue-100", hoverBg: "group-hover:bg-blue-600", text: "text-blue-600", darkBg: "dark:bg-blue-900/30", darkText: "dark:text-blue-400" },
      purple: { bg: "bg-purple-100", hoverBg: "group-hover:bg-purple-600", text: "text-purple-600", darkBg: "dark:bg-purple-900/30", darkText: "dark:text-purple-400" },
    };
    return colors[color] || colors.emerald;
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const colorClasses = getColorClasses(stat.color);
        return (
          <motion.div
            key={index}
            variants={item}
            whileHover={{ y: -5, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(stat.link)}
            className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 p-6 shadow-lg hover:shadow-2xl transition-all duration-300 group relative overflow-hidden cursor-pointer"
          >
            {/* Gradient Background on Hover */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`${colorClasses.bg} ${colorClasses.darkBg} p-3 rounded-2xl ${colorClasses.hoverBg} transition-colors duration-300 shadow-sm`}>
                  <Icon className={`${colorClasses.text} ${colorClasses.darkText} text-xl group-hover:text-white transition-colors duration-300`} />
                </div>
                <div className={`flex items-center space-x-1 text-sm font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full ${
                  stat.trend === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-red-500 dark:text-red-400"
                }`}>
                  {stat.trend === "up" ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />}
                  <span>{stat.change}</span>
                </div>
              </div>
              <h3 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-1 tracking-tight">{stat.value}</h3>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}


