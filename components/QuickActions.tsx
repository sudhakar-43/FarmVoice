"use client";

import { useRouter } from "next/navigation";
import { FaCamera, FaClipboardList, FaMicrophone, FaCalculator, FaSeedling, FaCloudRain } from "react-icons/fa";
import { motion } from "framer-motion";

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    { 
      label: "Check Disease", 
      icon: <FaCamera />, 
      path: "/home/disease-management", 
      color: "bg-red-500",
      desc: "Analyze crop health" 
    },
    { 
      label: "Log Activity", 
      icon: <FaClipboardList />, 
      path: "/home/tasks", 
      color: "bg-emerald-500",
      desc: "Track daily work" 
    },
    { 
      label: "Ask Assistant", 
      icon: <FaMicrophone />, 
      path: "/home/voice-assistant", 
      color: "bg-blue-500",
      desc: "Get instant answers" 
    },
    { 
      label: "Weather", 
      icon: <FaCloudRain />, 
      path: "/home/weather", 
      color: "bg-cyan-500",
      desc: "Forecast & Alerts" 
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {actions.map((action, idx) => (
        <motion.button
          key={idx}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push(action.path)}
          className="relative overflow-hidden group p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all text-left"
        >
          <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity`}>
             <span className={`text-4xl text-gray-900 dark:text-white`}>{action.icon}</span>
          </div>
          
          <div className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center text-white mb-3 shadow-lg`}>
            {action.icon}
          </div>
          
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm">{action.label}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{action.desc}</p>
          </div>
        </motion.button>
      ))}
    </div>
  );
}
