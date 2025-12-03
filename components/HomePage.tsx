"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaSeedling, FaMicrophone, FaLeaf, FaBug, FaChartLine, FaSignOutAlt, FaBell, FaUser, FaCloudSun, FaTasks, FaChevronRight, FaCog } from "react-icons/fa";
import { motion } from "framer-motion";
import DashboardStats from "./DashboardStats";
import WeatherWidget from "./WeatherWidget";
import DailyTasks from "./DailyTasks";
import CropHealthChart from "./CropHealthChart";

import { useSettings } from "@/context/SettingsContext";

export default function HomePage() {
  const router = useRouter();
  const { theme, language, t } = useSettings();
  const [notifications, setNotifications] = useState(3);
  const [greeting, setGreeting] = useState<"greeting_morning" | "greeting_afternoon" | "greeting_evening">("greeting_morning");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("greeting_morning");
    else if (hour < 18) setGreeting("greeting_afternoon");
    else setGreeting("greeting_evening");
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("farmvoice_auth");
    localStorage.removeItem("farmvoice_user");
    localStorage.removeItem("farmvoice_token");
    localStorage.removeItem("farmvoice_user_id");
    localStorage.removeItem("farmvoice_user_name");
    router.push("/");
  };

  const userEmail = typeof window !== "undefined" ? localStorage.getItem("farmvoice_user") : "";
  const userName = typeof window !== "undefined" ? localStorage.getItem("farmvoice_user_name") : "";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <div className={`min-h-screen font-sans relative overflow-x-hidden transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      {/* Background Logo */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none opacity-5">
        <img src="/logo.png" alt="Background Logo" className="w-[800px] h-[800px] object-contain grayscale" />
      </div>

      {/* Content Wrapper */}
      <div className="relative z-10">
        {/* Header */}
        <header className={`sticky top-0 z-50 border-b shadow-sm transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => router.push("/home")}>
                <img 
                  src="/logo.png" 
                  alt="FarmVoice Logo" 
                  className="h-10 w-10 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300" 
                />
                <span className="text-2xl font-bold text-emerald-800 dark:text-emerald-400 tracking-tight">{t('app_name')}</span>
              </div>
              
              <div className="flex items-center space-x-3 sm:space-x-5">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2.5 text-gray-600 dark:text-gray-300 hover:text-emerald-700 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/30 rounded-full transition-all"
                >
                  <FaBell className="text-xl" />
                  {notifications > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-800 animate-pulse"></span>
                  )}
                </motion.button>
                
                <div className="h-8 w-px bg-gray-300/50 dark:bg-gray-600/50 hidden sm:block"></div>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/home/profile")}
                  className="hidden sm:flex items-center space-x-3 px-1 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all border border-transparent hover:border-gray-300 dark:hover:border-gray-600"
                >
                  <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center justify-center font-bold text-sm shadow-inner border border-white/50 dark:border-gray-600/50">
                    {userName ? userName[0].toUpperCase() : <FaUser />}
                  </div>
                  <div className="text-sm text-left hidden md:block pr-2">
                    <div className="font-bold text-gray-800 dark:text-gray-200 leading-none">{userName || "Farmer"}</div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">{t('view_details')}</div>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/settings")}
                  className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-full transition-all"
                  title={t('settings_title')}
                >
                  <FaCog className="text-lg" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-all"
                  title={t('logout')}
                >
                  <FaSignOutAlt className="text-lg" />
                </motion.button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Welcome Section */}
            <motion.div variants={itemVariants} className="mb-8 text-center sm:text-left">
              <h1 className={`text-3xl sm:text-4xl font-extrabold mb-2 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {t(greeting)}, <span className="text-emerald-600 dark:text-emerald-400">{userName || "Farmer"}</span>
              </h1>
              <p className={`text-base font-medium max-w-2xl ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Here's your daily farming insight. Your crops are looking great today!
              </p>
            </motion.div>

            {/* Row 1: Tasks, Weather, Health Overview */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* Daily Tasks */}
              <motion.div 
                whileHover={{ y: -5 }}
                onClick={() => router.push("/home/tasks")}
                className={`rounded-3xl border shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group h-[320px] flex flex-col ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className={`p-5 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                  <h3 className={`text-lg font-bold flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mr-3 text-emerald-600 dark:text-emerald-400">
                      <FaTasks />
                    </div>
                    {t('daily_tasks')}
                  </h3>
                  <FaChevronRight className="text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="p-4 flex-grow overflow-hidden">
                  <DailyTasks limit={3} compact={true} />
                </div>
              </motion.div>

              {/* Weather Widget */}
              <motion.div 
                whileHover={{ y: -5 }}
                onClick={() => router.push("/home/weather")}
                className={`rounded-3xl border shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group h-[320px] flex flex-col ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className={`p-5 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                  <h3 className={`text-lg font-bold flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-3 text-blue-600 dark:text-blue-400">
                      <FaCloudSun />
                    </div>
                    {t('weather')}
                  </h3>
                  <FaChevronRight className="text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="p-5 flex-grow">
                  <WeatherWidget compact={true} />
                </div>
              </motion.div>

              {/* Health Overview */}
              <motion.div 
                whileHover={{ y: -5 }}
                onClick={() => router.push("/home/health")}
                className={`rounded-3xl border shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group h-[320px] flex flex-col ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className={`p-5 border-b flex items-center justify-between ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                  <h3 className={`text-lg font-bold flex items-center ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg mr-3 text-emerald-600 dark:text-emerald-400">
                      <FaChartLine />
                    </div>
                    {t('health_overview')}
                  </h3>
                  <FaChevronRight className="text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="p-5 flex-grow">
                  <CropHealthChart />
                </div>
              </motion.div>

            </motion.div>

            {/* Row 2: Disease, AI Assistant, Market */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              
              {/* Disease Prediction */}
              <motion.div 
                whileHover={{ y: -5 }}
                onClick={() => router.push("/home/disease-management")}
                className={`rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer group border flex flex-col items-center text-center h-[280px] justify-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <FaBug className="text-red-600 dark:text-red-400 text-3xl" />
                </div>
                <h4 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Disease Prediction</h4>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Identify & treat diseases</p>
                <span className="text-red-600 dark:text-red-400 text-sm font-bold flex items-center mt-auto group-hover:translate-x-1 transition-transform">
                  Diagnose <FaChevronRight className="ml-1 text-xs" />
                </span>
              </motion.div>

              {/* AI Voice Assistant */}
              <motion.div 
                whileHover={{ y: -5 }}
                onClick={() => router.push("/home/voice-assistant")}
                className={`rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer group border flex flex-col items-center text-center h-[280px] justify-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <FaMicrophone className="text-purple-600 dark:text-purple-400 text-3xl" />
                </div>
                <h4 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('ai_assistant')}</h4>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Voice-guided help</p>
                <span className="text-purple-600 dark:text-purple-400 text-sm font-bold flex items-center mt-auto group-hover:translate-x-1 transition-transform">
                  {t('tap_to_speak')} <FaChevronRight className="ml-1 text-xs" />
                </span>
              </motion.div>

              {/* Market */}
              <motion.div 
                whileHover={{ y: -5 }}
                onClick={() => router.push("/home/market-prices")}
                className={`rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all cursor-pointer group border flex flex-col items-center text-center h-[280px] justify-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <FaChartLine className="text-blue-600 dark:text-blue-400 text-3xl" />
                </div>
                <h4 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('market_prices')}</h4>
                <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}></p>
                <span className="text-blue-600 dark:text-blue-400 text-sm font-bold flex items-center mt-auto group-hover:translate-x-1 transition-transform">
                  Check Prices <FaChevronRight className="ml-1 text-xs" />
                </span>
              </motion.div>

            </motion.div>

          </motion.div>
        </main>


      </div>
    </div>
  );
}
