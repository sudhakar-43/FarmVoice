"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaLightbulb, FaTint, FaBug, FaSeedling, FaCloudSun, FaFlask } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import { apiClient } from "@/lib/api";

interface Tip {
  id: string;
  title: string;
  content: string;
  category: string;
  icon: string;
  priority: string;
}

export default function FarmingTipsPage() {
  const router = useRouter();
  const { theme } = useSettings();
  const [tipOfDay, setTipOfDay] = useState<Tip | null>(null);
  const [allTips, setAllTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchTips();
  }, []);

  const fetchTips = async () => {
    try {
      const response = await apiClient.request<any>('/api/farming-tips');
      if (response.data) {
        setTipOfDay(response.data.tip_of_day);
        setAllTips(response.data.all_tips);
      }
    } catch (error) {
      console.error("Error fetching tips:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      irrigation: <FaTint className="text-blue-500" />,
      pest_management: <FaBug className="text-red-500" />,
      soil_management: <FaSeedling className="text-amber-600" />,
      planning: <FaLightbulb className="text-yellow-500" />,
      weather: <FaCloudSun className="text-sky-500" />,
    };
    return icons[category] || <FaLightbulb className="text-yellow-500" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      irrigation: "bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800",
      pest_management: "bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800",
      soil_management: "bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800",
      planning: "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800",
      weather: "bg-sky-100 dark:bg-sky-900/30 border-sky-200 dark:border-sky-800",
    };
    return colors[category] || colors.planning;
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-green-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const categories = ["all", "irrigation", "pest_management", "soil_management", "planning", "weather"];
  const filteredTips = selectedCategory === "all" ? allTips : allTips.filter(t => t.category === selectedCategory);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => router.push('/home')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full mr-4">
            <FaArrowLeft />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <FaLightbulb className="text-yellow-600 dark:text-yellow-400 text-xl" />
            </div>
            <h1 className="text-2xl font-bold">Farming Tips</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tip of the Day */}
        {tipOfDay && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-8 mb-8 bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 text-9xl opacity-20">💡</div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-bold">⭐ Tip of the Day</span>
              </div>
              <h2 className="text-3xl font-extrabold mb-4">{tipOfDay.title}</h2>
              <p className="text-lg opacity-95 max-w-2xl">{tipOfDay.content}</p>
            </div>
          </motion.div>
        )}

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-yellow-500 text-white'
                  : theme === 'dark' ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat === "all" ? "All Tips" : cat.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredTips.map((tip, index) => (
              <motion.div
                key={tip.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
                className={`rounded-3xl border p-6 ${getCategoryColor(tip.category)} ${
                  theme === 'dark' ? 'border-gray-700' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{tip.icon}</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${getPriorityBadge(tip.priority)}`}>
                    {tip.priority}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{tip.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{tip.content}</p>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center">
                  {getCategoryIcon(tip.category)}
                  <span className="ml-2 text-xs font-medium capitalize">{tip.category.replace("_", " ")}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading tips...</p>
          </div>
        )}
      </main>
    </div>
  );
}
