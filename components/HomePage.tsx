"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { 
  FaHome, FaRobot, FaStethoscope, FaChartLine, FaCloudSun, 
  FaBell, FaUser, FaCog, FaSignOutAlt, FaLeaf 
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import FullPageLoader from "@/components/FullPageLoader";

// Import new components
import MarketTicker from "@/components/MarketTicker";
import QuickActions from "@/components/QuickActions";
import TasksWidget from "@/components/TasksWidget";
import WeatherWidget from "@/components/WeatherWidget";

// Lazy load chart
const CropHealthChart = dynamic(() => import("@/components/CropHealthChart"), {
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-2xl animate-pulse min-h-[300px]">
      <FaLeaf className="text-gray-300 dark:text-gray-600 text-4xl" />
    </div>
  ),
  ssr: false
});

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPageReady, setIsPageReady] = useState(false);
  const [userName, setUserName] = useState("Farmer");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Simulated fast load
    const timer = setTimeout(() => setIsPageReady(true), 800);
    
    // Load profile
    const storedName = localStorage.getItem("farmvoice_user_name");
    if (storedName && storedName !== "null") {
      setUserName(storedName);
    }

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("farmvoice_auth");
    localStorage.removeItem("farmvoice_user");
    localStorage.removeItem("farmvoice_token");
    localStorage.removeItem("farmvoice_user_id");
    localStorage.removeItem("farmvoice_user_name");
    router.push("/");
  };

  const navItems = [
    { icon: <FaHome />, label: "Dashboard", path: "/home", active: pathname === "/home" },
    { icon: <FaRobot />, label: "AI Assistant", path: "/home/voice-assistant", active: pathname?.includes("voice") },
    { icon: <FaStethoscope />, label: "Disease Scan", path: "/home/disease-management", active: pathname?.includes("disease") },
    { icon: <FaChartLine />, label: "Market", path: "/home/market-prices", active: pathname?.includes("market") },
    { icon: <FaCloudSun />, label: "Weather", path: "/home/weather", active: pathname?.includes("weather") },
  ];

  return (
    <>
      <AnimatePresence>
        {!isPageReady && <FullPageLoader />}
      </AnimatePresence>

      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-500 ${!isPageReady ? 'invisible' : 'visible'}`}>
        
        {/* Market Ticker */}
        <MarketTicker />

        {/* Sticky Header */}
        <nav className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-sm" : "bg-transparent"
        }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Logo */}
              <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => router.push("/home")}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                   <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain invert brightness-0" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-300">
                  FarmVoice
                </span>
              </div>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                {navItems.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push(item.path)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      item.active 
                        ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* User Actions */}
              <div className="flex items-center gap-3">
                <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
                  <FaBell />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-2 pr-1 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white text-sm font-bold">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  
                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 overflow-hidden z-50"
                      >
                         <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                           <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userName}</p>
                           <p className="text-xs text-gray-500">View Profile</p>
                         </div>
                         <button onClick={() => router.push("/home/profile")} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                           <FaUser size={12} /> Profile
                         </button>
                         <button onClick={() => router.push("/settings")} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                           <FaCog size={12} /> Settings
                         </button>
                         <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                           <FaSignOutAlt size={12} /> Sign Out
                         </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Bottom Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-50 pb-safe">
          <div className="flex justify-around items-center h-16">
            {navItems.map((item, idx) => (
              <button
                key={idx}
                onClick={() => router.push(item.path)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  item.active ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
          
          <QuickActions />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Health Chart & Weather (8 cols) */}
            <div className="lg:col-span-8 space-y-6">
               <div className="h-[400px]">
                 <CropHealthChart />
               </div>
               
               <div className="h-[220px]">
                 <WeatherWidget />
               </div>
            </div>

            {/* Right Column: Tasks (4 cols) */}
            <div className="lg:col-span-4 h-full min-h-[500px]">
               <TasksWidget />
            </div>

          </div>
        </main>

      </div>
    </>
  );
}
