"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { 
  FaCloudSun, FaBell, FaCheckSquare, FaLeaf, FaWind, FaTint, FaCheck, 
  FaRobot, FaStethoscope, FaChartLine, FaUser, FaSignOutAlt, FaCog,
  FaHome, FaSun, FaCloud, FaCloudRain, FaSnowflake, FaThermometerHalf,
  FaTasks, FaCalendarCheck, FaSeedling, FaChartBar, FaLightbulb, 
  FaLandmark, FaMapMarkerAlt, FaArrowRight
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import CropHealthChart from "@/components/CropHealthChart";
import FullPageLoader from "@/components/FullPageLoader";

// ... existing code ...



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
  const [userName, setUserName] = useState("Farmer"); // Default fallback
  
  useEffect(() => {
     // Load user name from personalized storage or fallback
     const storedName = localStorage.getItem("farmvoice_user_name");
     if (storedName && storedName !== "null" && storedName !== "undefined") {
         setUserName(storedName);
     } else {
         // Optionally try to fetch profile if not in local storage
         const fetchProfile = async () => {
            try {
                const userId = localStorage.getItem("farmvoice_user_id");
                if (userId) {
                    const { supabase } = await import("@/lib/supabaseClient");
                    const { data } = await supabase.from('users').select('full_name').eq('id', userId).single();
                    if (data?.full_name) {
                        setUserName(data.full_name);
                        localStorage.setItem("farmvoice_user_name", data.full_name);
                    }
                }
            } catch (e) {
                console.error("Profile fetch error", e);
            }
         };
         fetchProfile();
     }
  }, []);
  // Optimize: Max loading time constant
  const MAX_LOADING_TIME = 2500; // 2.5 seconds max wait

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
  const [isPageReady, setIsPageReady] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [healthDataReady, setHealthDataReady] = useState(false);
  
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

  // Unified Data Fetching with Max Wait Time
  useEffect(() => {
    let isMounted = true;
    
    // 1. Force page ready after MAX_LOADING_TIME (2.5s)
    const maxTimer = setTimeout(() => {
      if (isMounted) setIsPageReady(true);
    }, MAX_LOADING_TIME);

    // 2. Fetch Weather
    const fetchWeather = async () => {
      try {
        // CACHE CHECK
        const cached = localStorage.getItem("farmvoice_weather_cache");
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            const now = Date.now();
            // 20 minutes cache validity for weather
            if (now - timestamp < 1200000) {
                if (isMounted) {
                  setWeather(data);
                  setWeatherLoading(false);
                }
                return; // Use cache
            }
        }

        const token = localStorage.getItem("farmvoice_token");
        
        // Try to get user's actual location for accurate weather
        let lat: number | undefined;
        let lon: number | undefined;
        
        if (navigator.geolocation) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false, // Changed to false for speed
                timeout: 2000, // Reduced to 2s
                maximumAge: 300000 // 5 minutes cache
              });
            });
            lat = position.coords.latitude;
            lon = position.coords.longitude;
          } catch (geoError) {
            console.log("Geolocation skipped or timed out, using fallback");
          }
        }
        
        // Build URL with coordinates if available
        let url = `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/weather/current`;
        if (lat && lon) {
          url += `?lat=${lat}&lon=${lon}`;
        } else {
          // Fallback to pincode from localStorage
          const pincode = localStorage.getItem("farmvoice_pincode");
          if (pincode) {
            url += `?pincode=${pincode}`;
          }
        }
        
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            console.warn("Session expired. Redirecting to login...");
            localStorage.removeItem("farmvoice_token");
            window.location.href = "/login";
            return;
        }
        
        if (response.ok) {
          const data = await response.json();
          const locationDisplay = data.location || "Your Field";
          if (isMounted) {
            setWeather({ ...data, location: locationDisplay });
            // SAVE TO CACHE
            localStorage.setItem("farmvoice_weather_cache", JSON.stringify({
                data: { ...data, location: locationDisplay },
                timestamp: Date.now()
            }));
          }
        }
      } catch (error) {
        console.error("Weather fetch error:", error);
        // Fallback weather (silent fail)
      } finally {
        if (isMounted) setWeatherLoading(false);
      }
    };

    // 3. Fetch Tasks / Profile
    const initData = async () => {
      try {
        // QUICK CACHE CHECK FOR TASKS
        const cachedTasks = localStorage.getItem("farmvoice_tasks_cache");
        if (cachedTasks) {
            const { data, timestamp } = JSON.parse(cachedTasks);
            if (Date.now() - timestamp < 300000) { // 5 mins
                if (isMounted) {
                  setAllTasks(data.all);
                  setTasks(data.pending);
                  setLoading(false);
                }
                // We typically act on cached data and maybe re-fetch in background, 
                // but for now this is good enough speedup.
            }
        }

        let userId = localStorage.getItem("farmvoice_user_id");

        // Ensure we have a valid UUID for Supabase, else fetch/create one
        if (!userId || userId.length < 10) {
            const { data: users } = await import("@/lib/supabaseClient").then(m => m.supabase.from("users").select("id").limit(1));
            if (users && users.length > 0) {
                userId = users[0].id;
                localStorage.setItem("farmvoice_user_id", userId as string);
            }
        }
        
        if (!userId) return; 

        const today = new Date().toISOString().split('T')[0];
        const { supabase } = await import("@/lib/supabaseClient");

        // 1. Fetch Today's Tasks
        let { data: tasks, error } = await supabase
          .from('daily_tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('scheduled_date', today);

        if (error) console.error("Supabase error:", error);

        // 2. If no tasks for today, SEED them
        if (!tasks || tasks.length === 0) {
          const newTasks = [
            { user_id: userId, task_name: "Check Soil Moisture", priority: "HIGH", scheduled_date: today, completed: false, task_type: "Field Work" },
            { user_id: userId, task_name: "Inspect for Pests", priority: "HIGH", scheduled_date: today, completed: false, task_type: "Observation" },
            { user_id: userId, task_name: "Watering Schedule", priority: "MEDIUM", scheduled_date: today, completed: false, task_type: "Irrigation" },
            { user_id: userId, task_name: "Apply Fertilizer", priority: "MEDIUM", scheduled_date: today, completed: false, task_type: "Field Work" },
            { user_id: userId, task_name: "Update Crop Log", priority: "LOW", scheduled_date: today, completed: false, task_type: "Record Keeping" },
            { user_id: userId, task_name: "Check Weather Forecast", priority: "MEDIUM", scheduled_date: today, completed: false, task_type: "Planning" },
            { user_id: userId, task_name: "Inspect Irrigation Lines", priority: "HIGH", scheduled_date: today, completed: false, task_type: "Maintenance" },
            { user_id: userId, task_name: "Weeding", priority: "MEDIUM", scheduled_date: today, completed: false, task_type: "Field Work" },
            { user_id: userId, task_name: "Record Growth Height", priority: "LOW", scheduled_date: today, completed: false, task_type: "Observation" },
            { user_id: userId, task_name: "Clean Tools", priority: "LOW", scheduled_date: today, completed: false, task_type: "Maintenance" },
          ];
          
          const { data: inserted, error: insertError } = await supabase.from('daily_tasks').insert(newTasks).select();
          if (inserted) tasks = inserted;
        }

        if (tasks && isMounted) {
           const formattedTasks = tasks.map((t: any) => ({
             id: t.id,
             task_name: t.task_name,
             priority: t.priority || "MEDIUM",
             due_date: t.scheduled_date,
             status: t.completed ? 'completed' : 'pending'
           }));

           const pending = formattedTasks.filter((t: any) => t.status !== 'completed');
           setAllTasks(formattedTasks);
           setTasks(pending);
           
           // UPDATE CACHE
           localStorage.setItem("farmvoice_tasks_cache", JSON.stringify({
              data: { all: formattedTasks, pending },
              timestamp: Date.now()
           }));

           // Logic: 10 tasks per day, Daily Progress
           const completedCount = formattedTasks.filter((t: any) => t.status === 'completed').length;
           const score = Math.min(100, completedCount * 10);
           
           setHealthData(prev => ({
              ...prev,
              score,
              status: score >= 80 ? "Excellent" : score >= 50 ? "Good" : "Action Needed"
           }));
        }

      } catch (err) {
        console.error("Init failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    // Execute Parallel
    fetchWeather();
    initData();

    return () => {
      isMounted = false;
      clearTimeout(maxTimer);
    };
  }, [userName]);

  // Check if everything is ready earlier than max time
  useEffect(() => {
    if (!weatherLoading && !loading && healthDataReady && !isPageReady) {
        // Data ready fast? Wait just a bit to ensure animation played for at least ~1.5s total visually
        // But for now, just let it become ready. The max timer handles the "too slow" case.
        // We can add a min timer if needed, but the user complained about slowness.
        setIsPageReady(true);
    }
  }, [weatherLoading, loading, healthDataReady, isPageReady]);

  const handleCompleteTask = async (taskId: string) => {
    try {
      // Optimistic UI Update - only update task state, NOT CHI
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      
      // NOTE: CHI is NOT modified here.
      // Task completion contributes to Daily Task Score (DTS).
      // CHI only changes at end-of-day based on DTS thresholds.
      // The CropHealthChart component will fetch fresh DTS/CHI data.
      
      // Invalidate cache so CropHealthChart refetches
      localStorage.removeItem("farmvoice_chi_cache");

      const { supabase } = await import("@/lib/supabaseClient");
      await supabase.from('daily_tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);

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
    // Time ranges: 05:00-11:59 Morning, 12:00-16:59 Afternoon, 17:00-20:59 Evening, 21:00-04:59 Night
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };
  
  // Get priority color helper
  const getPriorityColor = (priority: string) => {
      const p = priority?.toUpperCase();
      if (p === 'HIGH') return 'bg-red-100 text-red-700 border-red-200';
      if (p === 'MEDIUM') return 'bg-amber-100 text-amber-700 border-amber-200';
      return 'bg-blue-50 text-blue-600 border-blue-100'; // LOW
  };

  // Get priority icon helper
  const getPriorityIcon = (priority: string) => {
      const p = priority?.toUpperCase();
      if (p === 'HIGH') return <span className="text-red-500 font-bold">!</span>;
      if (p === 'MEDIUM') return <span className="text-amber-500 font-bold">•</span>;
      return <span className="text-blue-500 font-bold">↓</span>; 
  };

  // Task display logic
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const completedTasksList = allTasks.filter(t => t.status === 'completed');
  const completedCount = completedTasksList.length;
  const totalTasksCount = allTasks.length || 10; // Default to 10 if no tasks loaded yet
  const hasNoTasks = allTasks.length === 0;
  
  // CRITICAL: "All caught up" ONLY when completed_tasks == 10 (all tasks done)
  const allCompleted = totalTasksCount >= 10 && completedCount >= 10;

  return (
    <>
      <AnimatePresence>
        {!isPageReady && <FullPageLoader />}
      </AnimatePresence>

      <div className={`min-h-screen bg-gradient-premium transition-colors duration-500 ${!isPageReady ? 'invisible h-screen overflow-hidden' : 'visible'}`}>
      
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
          <div 
            onClick={() => router.push("/home/health")}
            className="bento-item-large h-full w-full"
          >
             <CropHealthChart onDataLoaded={(data) => {
                 setHealthData(prev => ({
                    ...prev,
                    score: data.health_score,
                    status: data.status,
                    growth: data.growth_status,
                    risks: data.risk_level
                 }));
                 setHealthDataReady(true);
             }} />
          </div>

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
              <div className="flex flex-col items-center justify-center h-full min-h-[160px] gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-white/30 border-t-white"></div>
                <p className="text-white/80 text-sm font-medium">Fetching weather data…</p>
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
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-2">
                     <FaTasks className="text-xl text-blue-400" />
                  </div>
                  <p className="font-bold text-gray-700">Loading today's tasks...</p>
                  <p className="text-xs text-gray-400">Preparing your daily plan</p>
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
                  <p className="text-xs text-gray-500">Great job completing all 10 tasks today.</p>
                </div>
              ) : completedCount === 0 ? (
                // Zero tasks completed - show CTA, NOT "All caught up"
                <div className="space-y-3">
                  {/* Progress Indicator */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="font-medium">Progress: {completedCount}/{totalTasksCount}</span>
                    <span className="text-blue-500 font-medium">0 DTS</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                    <div className="bg-gray-300 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <p className="text-xs text-gray-500 text-center italic mb-3">
                    Complete today's tasks to start building your health score.
                  </p>
                  {pendingTasks.slice(0, 3).map((task) => (
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
                          <p className="text-[10px] text-emerald-600 font-medium">+10 Daily Task Score</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                        {getPriorityIcon(task.priority)} {task.priority}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Partial completion (1-9 tasks done) - show list with progress
                <div className="space-y-3">
                  {/* Progress Indicator */}
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span className="font-medium">Progress: {completedCount}/{totalTasksCount}</span>
                    <span className="text-emerald-600 font-bold">{completedCount * 10} DTS</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                    <motion.div 
                      className="bg-emerald-500 h-1.5 rounded-full" 
                      initial={{ width: 0 }}
                      animate={{ width: `${(completedCount / totalTasksCount) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    ></motion.div>
                  </div>
                  {pendingTasks.slice(0, 3).map((task) => (
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
                          <p className="text-[10px] text-emerald-600 font-medium">+10 Daily Task Score</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full border flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                        {getPriorityIcon(task.priority)} {task.priority}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
    </>
  );
}
