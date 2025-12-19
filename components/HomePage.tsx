"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
  FaCloudSun, FaBell, FaCheckSquare, FaLeaf, FaWind, FaTint, FaCheck, 
  FaRobot, FaStethoscope, FaChartLine, FaUser, FaSignOutAlt, FaCog,
  FaHome, FaSun, FaCloud, FaCloudRain, FaSnowflake, FaThermometerHalf,
  FaTasks, FaCalendarCheck, FaSeedling, FaChartBar, FaLightbulb, 
  FaLandmark, FaMapMarkerAlt, FaArrowRight
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";

interface Task {
  id: string;
  task_name: string;
  priority: string;
  due_date: string;
  status: string;
}

interface HealthData {
  score: number;
  status: string;
  growth: string;
  risks: string;
}

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  wind_speed: number;
  location: string;
  high: number;
  low: number;
}

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useSettings();
  const [userName, setUserName] = useState("Farmer");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [healthData, setHealthData] = useState<HealthData>({
    score: 0,
    status: "Loading...",
    growth: "Analyzing...",
    risks: "Analyzing...",
  });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Animated score
  const [displayScore, setDisplayScore] = useState(0);
  const [scoreAnimating, setScoreAnimating] = useState(false);
  const prevScoreRef = useRef(0);

  // Health Score Animation
  const radius = 60; // Slightly larger
  const stroke = 10;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;

  // Nav items - Redesigned to be top-bar/sidebar hybrid
  const navItems = [
    { icon: <FaHome />, label: "Dashboard", path: "/home", active: pathname === "/home" },
    { icon: <FaRobot />, label: "AI Assistant", path: "/home/voice-assistant", active: pathname?.includes("voice") },
    { icon: <FaStethoscope />, label: "Disease Scan", path: "/home/disease-management", active: pathname?.includes("disease") },
    { icon: <FaChartLine />, label: "Market Prices", path: "/home/market-prices", active: pathname?.includes("market") },
    { icon: <FaCloudSun />, label: "Weather", path: "/home/weather", active: pathname?.includes("weather") },
  ];

  // Animate score on change
  useEffect(() => {
    if (healthData.score !== prevScoreRef.current) {
      setScoreAnimating(true);
      const startScore = prevScoreRef.current;
      const endScore = healthData.score;
      const duration = 1200; // Slower animation
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 4); // Smoother ease out
        const currentScore = Math.round(startScore + (endScore - startScore) * easeOut);
        setDisplayScore(currentScore);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setScoreAnimating(false);
          prevScoreRef.current = endScore;
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [healthData.score]);

  // Fetch real-time weather
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const token = localStorage.getItem("farmvoice_token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/weather/current`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setWeather(data);
        }
      } catch (error) {
        console.error("Weather fetch error:", error);
        // Fallback weather
        setWeather({
          temperature: 25,
          condition: "Clear",
          humidity: 65,
          wind_speed: 8,
          location: "Simulated Location",
          high: 28,
          low: 18
        });
      } finally {
        setWeatherLoading(false);
      }
    };
    fetchWeather();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedName = localStorage.getItem("farmvoice_user_name");
        if (storedName) setUserName(storedName);

        const token = localStorage.getItem("farmvoice_token");
        const userStr = localStorage.getItem("farmvoice_user");
        const user = userStr ? JSON.parse(userStr) : {};
        
        // Parallel data fetching for performance
        const dashResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/home/init`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
             user_id: user.id,
             active_crop: "Wheat" 
          })
        });

        if (dashResponse.ok) {
          const data = await dashResponse.json();
          if (data.dashboard) {
             const allTasksData = data.dashboard.tasks || [];
             setAllTasks(allTasksData);
             setTasks(allTasksData.filter((t: Task) => t.status !== 'completed'));
             setHealthData(data.dashboard.health || { score: 85, status: "Good", growth: "Normal", risks: "Low" });
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        setHealthData({ score: 85, status: "Good", growth: "Normal", risks: "Low" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCompleteTask = async (taskId: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      setHealthData(prev => ({
          ...prev, 
          score: Math.min(100, prev.score + 5) 
      }));

      const token = localStorage.getItem("farmvoice_token");
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/tasks/${taskId}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Error completing task", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("farmvoice_auth");
    localStorage.removeItem("farmvoice_user");
    localStorage.removeItem("farmvoice_token");
    localStorage.removeItem("farmvoice_user_id");
    localStorage.removeItem("farmvoice_user_name");
    router.push("/");
  };

  const getWeatherIcon = (condition: string) => {
    const c = condition?.toLowerCase() || "";
    if (c.includes("rain")) return <FaCloudRain className="text-5xl text-blue-300 drop-shadow-md" />;
    if (c.includes("cloud")) return <FaCloud className="text-5xl text-gray-300 drop-shadow-md" />;
    if (c.includes("snow")) return <FaSnowflake className="text-5xl text-blue-200 drop-shadow-md" />;
    if (c.includes("clear") || c.includes("sun")) return <FaSun className="text-5xl text-yellow-300 drop-shadow-lg" />;
    return <FaCloudSun className="text-5xl text-yellow-100 drop-shadow-md" />;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Task display logic
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasks = allTasks.filter(t => t.status === 'completed');
  const hasNoTasks = allTasks.length === 0;
  const allCompleted = allTasks.length > 0 && pendingTasks.length === 0;

  return (
    <div className={`min-h-screen bg-gradient-premium transition-colors duration-500`}>
      
      {/* BACKGROUND BLOBS */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
         <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-emerald-400/20 blur-[120px] animate-blob" />
         <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-blue-400/20 blur-[100px] animate-blob animation-delay-2000" />
         <div className="absolute -bottom-[10%] left-[20%] w-[400px] h-[400px] rounded-full bg-indigo-400/20 blur-[100px] animate-blob animation-delay-4000" />
      </div>

      {/* TOP NAVBAR (Redesigned as "Top Sidebar") */}
      <nav className="sticky top-0 z-50 glass-panel border-b-0 mb-6 mx-4 mt-4 rounded-2xl">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => router.push("/home")}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-all">
                 <img src="/logo.png" alt="Logo" className="w-6 h-6 object-contain invert brightness-0" />
              </div>
              <div>
                 <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-teal-700 dark:from-emerald-400 dark:to-teal-300">FarmVoice</span>
                 <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Pro Edition</p>
              </div>
            </motion.div>
            
            {/* Nav Links - Center Pills */}
            <div className="hidden lg:flex items-center gap-2 bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-xl border border-white/20">
              {navItems.map((item, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(item.path)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    item.active 
                      ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm" 
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50"
                  }`}
                >
                  <span className={item.active ? "text-emerald-600" : ""}>{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </motion.button>
              ))}
            </div>
            
            {/* User Menu */}
            <div className="flex items-center gap-4">
              <motion.button whileHover={{ y: -2 }} className="relative p-2.5 bg-white/50 dark:bg-gray-800/50 hover:bg-white rounded-xl transition-colors text-gray-600 dark:text-gray-300 shadow-sm">
                <FaBell />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </motion.button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 pl-2 pr-1 py-1 bg-white/50 dark:bg-gray-800/50 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-200 shadow-sm"
                >
                  <div className="text-right hidden md:block">
                     <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight">{userName}</p>
                     <p className="text-[10px] text-emerald-600 font-bold">Premium Plan</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white text-lg font-bold shadow-md">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                </button>
                
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-3 w-56 glass-panel rounded-2xl overflow-hidden z-50 p-2"
                    >
                      <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 mb-2">
                        <p className="text-sm font-bold text-gray-800 dark:text-white">Signed in as</p>
                        <p className="text-xs text-gray-500 truncate">{userName}</p>
                      </div>
                      <button onClick={() => router.push("/home/profile")} className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors">
                        <FaUser className="text-emerald-500" /> Profile
                      </button>
                      <button onClick={() => router.push("/settings")} className="w-full px-4 py-2.5 text-left hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl flex items-center gap-3 text-gray-700 dark:text-gray-300 transition-colors">
                        <FaCog className="text-emerald-500" /> Settings
                      </button>
                      <hr className="my-2 border-gray-100 dark:border-gray-700" />
                      <button onClick={handleLogout} className="w-full px-4 py-2.5 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl flex items-center gap-3 text-red-500 transition-colors font-medium">
                        <FaSignOutAlt /> Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="pb-12 px-6 max-w-7xl mx-auto z-10 relative">
        
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex justify-between items-end"
        >
          <div>
             <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-2 tracking-tight">
               {getGreeting()}, <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">{userName}</span>
             </h1>
             <p className="text-gray-500 dark:text-gray-400 font-medium">Here's your farm's overview for today.</p>
          </div>
          <div className="hidden md:block text-right">
             <p className="text-3xl font-bold text-gray-800 dark:text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
             <p className="text-emerald-600 font-medium">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
        </motion.div>

        {/* BENTO GRID LAYOUT */}
        <div className="bento-grid">
          
          {/* Health Index Card (Large) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => router.push("/home/health")}
            className="bento-item-large glass-card p-8 flex flex-col justify-between group cursor-pointer hover:border-emerald-300/50 transition-all overflow-hidden relative"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/20"></div>
            
            <div className="flex justify-between items-start z-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                   <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <FaLeaf />
                   </div>
                   <h3 className="font-bold text-gray-800 dark:text-white text-lg">Crop Health Index</h3>
                </div>
                <p className="text-gray-500 text-sm">Real-time analysis based on soil & weather</p>
              </div>
              <motion.div 
                 whileHover={{ x: 5 }} 
                 className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors"
              >
                 <FaArrowRight size={12} />
              </motion.div>
            </div>
            
            <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-8 z-10">
              {/* Animated Circle */}
              <div className="relative">
                <svg height={radius * 2} width={radius * 2} className="transform -rotate-90 drop-shadow-xl">
                  <circle
                    stroke="rgba(209, 213, 219, 0.3)"
                    strokeWidth={stroke}
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                  />
                  <motion.circle
                    stroke={displayScore >= 80 ? "#10B981" : displayScore >= 50 ? "#F59E0B" : "#EF4444"}
                    strokeWidth={stroke}
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    fill="transparent"
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                    className="filter drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <motion.span 
                    className="text-4xl font-extrabold text-gray-800 dark:text-white"
                    key={displayScore}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    {displayScore}%
                  </motion.span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${
                    displayScore >= 80 ? 'bg-emerald-100 text-emerald-700' : 
                    displayScore >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {healthData.status}
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full grid grid-cols-2 gap-4">
                 <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Growth Rate</p>
                    <p className="font-bold text-emerald-600 text-lg">{healthData.growth}</p>
                 </div>
                 <div className="bg-white/50 dark:bg-gray-800/50 p-4 rounded-2xl border border-white/20 backdrop-blur-sm">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wide mb-1">Risk Factors</p>
                    <p className="font-bold text-red-500 text-lg">{healthData.risks}</p>
                 </div>
                 <div className="col-span-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                       <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 text-right">Updated 5m ago</p>
                 </div>
              </div>
            </div>
          </motion.div>

          {/* Weather Card (Medium) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => router.push("/home/weather")}
            className="bento-item-medium bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all cursor-pointer text-white relative overflow-hidden group"
          >
             {/* Dynamic Weather Backgrounds would go here */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
             
            {weatherLoading ? (
              <div className="flex items-center justify-center h-full min-h-[160px]">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/30 border-t-white"></div>
              </div>
            ) : weather ? (
              <div className="flex flex-col h-full justify-between relative z-10">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white/90 flex items-center gap-2"><FaMapMarkerAlt className="text-blue-200" /> {weather.location}</h3>
                    <p className="text-sm text-blue-100 font-medium">Today's Forecast</p>
                  </div>
                  <motion.div 
                     animate={{ y: [0, -5, 0] }} 
                     transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    {getWeatherIcon(weather.condition)}
                  </motion.div>
                </div>
                
                <div className="flex items-end gap-4 mt-2">
                  <span className="text-6xl font-extrabold tracking-tighter">{weather.temperature}°</span>
                  <div className="mb-2">
                     <p className="text-xl font-medium">{weather.condition}</p>
                     <p className="text-sm text-blue-100">H: {weather.high}° L: {weather.low}°</p>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-4">
                  <div className="bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 flex items-center gap-2 text-sm flex-1 justify-center">
                    <FaTint className="text-blue-200" />
                    <span className="font-bold">{weather.humidity}%</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md rounded-xl px-3 py-2 flex items-center gap-2 text-sm flex-1 justify-center">
                    <FaWind className="text-blue-200" />
                    <span className="font-bold">{weather.wind_speed} km/h</span>
                  </div>
                </div>
              </div>
            ) : (
              <p>Weather unavailable</p>
            )}
          </motion.div>

          {/* Tasks Card (Medium) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => router.push("/home/tasks")}
            className="bento-item-medium glass-card p-6 relative overflow-hidden group hover:border-orange-300/50 transition-colors"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-orange-500/20"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-2">
                 <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                    <FaCheckSquare />
                 </div>
                 <h3 className="font-bold text-gray-800 dark:text-white text-lg">Daily Tasks</h3>
              </div>
              {pendingTasks.length > 0 && (
                <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold">
                  {pendingTasks.length} Pending
                </span>
              )}
            </div>
            
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 customize-scrollbar relative z-10">
              {loading ? (
                <div className="space-y-2">
                   {[1,2].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
                </div>
              ) : hasNoTasks ? (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-2">
                     <FaCalendarCheck className="text-xl text-green-500" />
                  </div>
                  <p className="font-bold text-gray-700">No tasks for today</p>
                  <p className="text-xs text-gray-400">Enjoy your free time!</p>
                </div>
              ) : allCompleted ? (
                <div className="flex flex-col items-center justify-center py-6 text-center h-full">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mb-3"
                  >
                    <FaCheck className="text-2xl text-emerald-600" />
                  </motion.div>
                  <p className="font-bold text-gray-800">All caught up!</p>
                  <p className="text-xs text-gray-500">Great job completing your tasks.</p>
                </div>
              ) : (
                pendingTasks.slice(0, 3).map((task) => (
                  <motion.div 
                    key={task.id} 
                    whileHover={{ scale: 1.01 }}
                    className="flex items-center justify-between p-3 bg-white border border-gray-100 hover:border-orange-200 rounded-xl shadow-sm transition-colors group/task"
                  >
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleCompleteTask(task.id); }}
                        className="w-5 h-5 rounded-md border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-colors text-white"
                      >
                        <FaCheck className="text-[10px]" />
                      </button>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{task.task_name}</p>
                        <p className="text-[10px] text-gray-500">Due: {task.due_date}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      task.priority === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-50 text-gray-500'
                    }`}>
                      {task.priority}
                    </span>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Quick Actions (Full Row) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-1 md:col-span-4 glass-card p-6"
          >
            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
               <FaLightbulb className="text-yellow-500" /> Quick Actions
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { icon: <FaRobot />, label: "Ask AI", path: "/home/voice-assistant", color: "from-emerald-500 to-teal-500" },
                { icon: <FaSeedling />, label: "Crop Advisor", path: "/home/crop-recommendation", color: "from-green-500 to-emerald-500" },
                { icon: <FaStethoscope />, label: "Disease Scan", path: "/home/disease-management", color: "from-red-500 to-pink-500" },
                { icon: <FaChartLine />, label: "Market Prices", path: "/home/market-prices", color: "from-blue-500 to-indigo-500" },
                { icon: <FaCloudSun />, label: "Weather", path: "/home/weather", color: "from-sky-400 to-blue-500" },
                { icon: <FaTasks />, label: "Tasks", path: "/home/tasks", color: "from-orange-400 to-red-500" },
                { icon: <FaChartBar />, label: "Analytics", path: "/home/analytics", color: "from-purple-500 to-indigo-500" },
                { icon: <FaLightbulb />, label: "Farming Tips", path: "/home/farming-tips", color: "from-yellow-400 to-orange-500" },
                { icon: <FaLandmark />, label: "Schemes", path: "/home/govt-schemes", color: "from-indigo-500 to-purple-500" },
                { icon: <FaMapMarkerAlt />, label: "Mandis", path: "/home/nearby-mandis", color: "from-teal-400 to-cyan-500" },
              ].map((action, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push(action.path)}
                  className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-all group"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white text-xl shadow-md group-hover:shadow-lg transition-all`}>
                    {action.icon}
                  </div>
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
