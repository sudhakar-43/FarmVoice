"use client";

import { useSettings } from "@/context/SettingsContext";
import { useRouter, usePathname } from "next/navigation";
import { FaUser, FaStethoscope, FaChartLine, FaCloudSun, FaCog, FaSignOutAlt, FaRobot } from "react-icons/fa";
import { motion } from "framer-motion";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useSettings();
  
  const userName = typeof window !== "undefined" ? localStorage.getItem("farmvoice_user_name") : "User";

  const menuItems = [
    { icon: <FaRobot />, label: "AI Assistant", path: "/home/voice-assistant", active: pathname?.includes("voice") },
    { icon: <FaStethoscope />, label: "Disease Scan", path: "/home/disease-management", active: pathname?.includes("disease") },
    { icon: <FaChartLine />, label: "Market Prices", path: "/home/market-prices", active: pathname?.includes("market") },
    { icon: <FaCloudSun />, label: "Weather", path: "/home/weather", active: pathname?.includes("weather") },
  ];

  const handleLogout = () => {
    localStorage.removeItem("farmvoice_auth");
    localStorage.removeItem("farmvoice_user");
    localStorage.removeItem("farmvoice_token");
    localStorage.removeItem("farmvoice_user_id");
    localStorage.removeItem("farmvoice_user_name");
    router.push("/");
  };

  return (
    <div className="h-screen w-72 flex flex-col p-6 fixed left-0 top-0 z-50 bg-[#F5F2EA] border-r border-[#E6E2D6] text-[#1a3c2f] shadow-2xl">
      
      {/* Logo */}
      <div className="flex items-center gap-4 mb-12 cursor-pointer group" onClick={() => router.push("/home")}>
        <div className="relative w-10 h-10 transition-transform group-hover:scale-105">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain drop-shadow-md" />
        </div>
        <span className="text-2xl font-bold text-[#1a3c2f] tracking-tight font-display">FarmVoice</span>
      </div>

      {/* User Profile */}
      <div className="flex items-center gap-3 mb-10 p-4 rounded-2xl bg-white shadow-sm border border-[#E6E2D6]">
        <div className="w-10 h-10 rounded-full bg-[#1a3c2f] flex items-center justify-center text-[#F5F2EA] shadow-lg">
          <FaUser />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1a3c2f] truncate">{userName || "Farmer"}</p>
        </div>
        <button onClick={() => router.push("/settings")} className="p-2 hover:bg-[#F5F2EA] rounded-full transition-colors text-[#5C7A6B]">
            <FaCog className="text-sm" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex flex-col gap-3 flex-grow">
        {menuItems.map((item, index) => (
          <motion.button
            key={index}
            whileHover={{ x: 5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push(item.path)}
            className={`flex items-center gap-4 p-4 rounded-xl font-semibold transition-all duration-300 ${
              item.active 
                ? "bg-[#1a3c2f] text-[#F5F2EA] shadow-xl shadow-[#1a3c2f]/20" 
                : "text-[#5C7A6B] hover:bg-white hover:text-[#1a3c2f] hover:shadow-md"
            }`}
          >
            <span className={`text-xl ${item.active ? "text-[#C05D3B]" : "text-[#8BA599]"}`}>{item.icon}</span>
            <span>{item.label}</span>
          </motion.button>
        ))}
      </div>

      {/* Bottom Actions */}
      <div className="mt-auto pt-6 border-t border-[#E6E2D6]">
         <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-[#BC4B4B] hover:bg-[#FFE5E5] font-semibold transition-colors">
            <FaSignOutAlt />
            <span>Sign Out</span>
         </button>
      </div>
    </div>
  );
}
