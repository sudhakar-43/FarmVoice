"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaChartBar, FaChartLine, FaCoins, FaLeaf, FaLightbulb } from "react-icons/fa";
import { motion } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import { apiClient } from "@/lib/api";

interface AnalyticsData {
  summary: {
    total_revenue: number;
    total_expenses: number;
    total_profit: number;
    avg_monthly_profit: number;
    best_month: string;
  };
  monthly_data: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  crop_performance: Array<{
    crop: string;
    yield: number;
    target: number;
    status: string;
  }>;
  insights: string[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { theme } = useSettings();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const response = await apiClient.request<AnalyticsData>(`/api/analytics?period=${period}`);
      if (response.data) {
        setData(response.data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-500 bg-green-100 dark:bg-green-900/30";
      case "good": return "text-blue-500 bg-blue-100 dark:bg-blue-900/30";
      case "moderate": return "text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30";
      case "below_target": return "text-red-500 bg-red-100 dark:bg-red-900/30";
      default: return "text-gray-500 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  const maxRevenue = data ? Math.max(...data.monthly_data.map(d => d.revenue)) : 0;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => router.push('/home')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full mr-4">
            <FaArrowLeft />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FaChartBar className="text-purple-600 dark:text-purple-400 text-xl" />
            </div>
            <h1 className="text-2xl font-bold">Farming Analytics</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {data && (
          <>
            {/* Summary Cards */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                <p className="text-2xl font-extrabold text-blue-600">{formatCurrency(data.summary.total_revenue)}</p>
              </div>
              <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className="text-xs text-gray-500 mb-1">Total Expenses</p>
                <p className="text-2xl font-extrabold text-red-600">{formatCurrency(data.summary.total_expenses)}</p>
              </div>
              <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className="text-xs text-gray-500 mb-1">Net Profit</p>
                <p className="text-2xl font-extrabold text-green-600">{formatCurrency(data.summary.total_profit)}</p>
              </div>
              <div className={`rounded-2xl p-4 border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <p className="text-xs text-gray-500 mb-1">Best Month</p>
                <p className="text-2xl font-extrabold text-purple-600">{data.summary.best_month}</p>
              </div>
            </motion.div>

            {/* Revenue Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className={`rounded-3xl border p-6 mb-8 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
            >
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <FaChartLine className="mr-2 text-blue-500" />
                Revenue vs Expenses
              </h2>
              <div className="flex items-end justify-between h-48 gap-2">
                {data.monthly_data.map((month, index) => (
                  <div key={month.month} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex gap-1 items-end h-36">
                      <div 
                        className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all"
                        style={{ height: `${(month.revenue / maxRevenue) * 100}%` }}
                        title={`Revenue: ${formatCurrency(month.revenue)}`}
                      ></div>
                      <div 
                        className="flex-1 bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg transition-all"
                        style={{ height: `${(month.expenses / maxRevenue) * 100}%` }}
                        title={`Expenses: ${formatCurrency(month.expenses)}`}
                      ></div>
                    </div>
                    <p className="text-xs mt-2 text-gray-500">{month.month}</p>
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                  <span className="text-sm">Revenue</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
                  <span className="text-sm">Expenses</span>
                </div>
              </div>
            </motion.div>

            {/* Crop Performance & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Crop Performance */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-3xl border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <FaLeaf className="mr-2 text-green-500" />
                  Crop Performance
                </h2>
                <div className="space-y-4">
                  {data.crop_performance.map((crop) => (
                    <div key={crop.crop}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{crop.crop}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(crop.status)}`}>
                          {crop.yield}% of target
                        </span>
                      </div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            crop.status === 'excellent' ? 'bg-green-500' :
                            crop.status === 'good' ? 'bg-blue-500' :
                            crop.status === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(crop.yield, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Insights */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`rounded-3xl border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
              >
                <h2 className="text-xl font-bold mb-6 flex items-center">
                  <FaLightbulb className="mr-2 text-yellow-500" />
                  Insights & Recommendations
                </h2>
                <div className="space-y-4">
                  {data.insights.map((insight, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}
                    >
                      <p className="text-sm">💡 {insight}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading analytics...</p>
          </div>
        )}
      </main>
    </div>
  );
}
