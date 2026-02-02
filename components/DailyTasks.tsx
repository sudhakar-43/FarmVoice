"use client";

import { useState, useEffect } from "react";
import { FaCheckCircle, FaCircle, FaCalendarAlt, FaClock, FaExclamationCircle, FaCloudSun, FaTint, FaWind } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";

interface Task {
  id: string; // Changed from number to string to support UUIDs
  task: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:MM
  status: "pending" | "completed" | "overdue";
  priority: "high" | "medium" | "low";
  source?: "manual" | "smart-weather" | "smart-disease";
  meta?: any;
}

interface DailyTasksProps {
  limit?: number;
  compact?: boolean;
}

export default function DailyTasks({ limit, compact = false }: DailyTasksProps) {
  const { t } = useSettings();
  const [activeTab, setActiveTab] = useState<"yesterday" | "today" | "tomorrow">("today");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [activeTab]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      // Fetch tasks from API based on the active tab
      const response = await apiClient.request<Task[]>(`/api/tasks?tab=${activeTab}`, {
        method: 'GET'
      });
      
      if (response.error) {
        throw new Error(response.error);
      }

      const tasksData = response.data || [];
      setTasks(tasksData);
    } catch (error: any) {
      console.error("Error fetching tasks:", error);
      if (error.message?.includes("Session expired") || error.message?.includes("Not authenticated")) {
          // Graceful redirect
          console.warn("Session expired (Not authenticated) in DailyTasks. Redirecting...");
          window.location.href = "/login";
      }
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    try {
      // Find the task to verify it exists and get its details if needed
      const taskIndex = tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) return;
      
      const currentTask = tasks[taskIndex];
      const newStatus = currentTask.status === 'completed' ? 'pending' : 'completed';
      
      // Optimistic update
      const updatedTasks = [...tasks];
      updatedTasks[taskIndex] = { ...currentTask, status: newStatus };
      setTasks(updatedTasks);
      
      // Call API
      if (newStatus === 'completed') {
        await apiClient.post(`/api/tasks/${taskId}/complete`, {});
        
        // Show DTS toast notification
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        
        // Invalidate CHI cache so chart refreshes
        localStorage.removeItem("farmvoice_chi_cache");
      }
      // Note: If reverting to pending, we might need an endpoint or logic, 
      // but typically we only mark complete. For now we just support complete.
      
    } catch (error) {
      console.error('Error toggling task:', error);
      // Revert on error
      fetchTasks();
    }
  };

  const getStatusStyles = (task: Task) => {
    if (task.status === "completed") return "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-800/30";
    if (task.status === "overdue") return "bg-red-50/50 dark:bg-red-900/10 border-red-200/50 dark:border-red-800/30";
    
    // Time-based logic for "Yellow" (Due Soon)
    // Mocking "Due Soon" if priority is high for pending tasks
    if (task.priority === "high") return "bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200/50 dark:border-yellow-800/30";
    
    return "bg-white/40 dark:bg-gray-800/40 border-white/20 dark:border-gray-700/30";
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case "smart-weather": return <FaCloudSun className="text-orange-500" />;
      case "smart-disease": return <FaExclamationCircle className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className={`h-full flex flex-col ${!compact ? 'glass-panel p-6 rounded-2xl' : ''}`}>
      {/* Tabs */}
      {!compact && (
        <div className="flex p-1.5 bg-gray-100/50 dark:bg-gray-700/30 rounded-xl mb-6 backdrop-blur-sm">
          {(["yesterday", "today", "tomorrow"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all capitalize duration-300 ${
                activeTab === tab
                  ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] scale-[1.02]"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/30 dark:hover:bg-gray-600/30"
              }`}
            >
              {t(tab)}
            </button>
          ))}
        </div>
      )}

      {/* Task List - 2×5 Grid Layout */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar ${activeTab === "yesterday" ? "opacity-75 grayscale-[0.5]" : ""}`}>
        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl animate-pulse backdrop-blur-sm"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AnimatePresence mode="popLayout">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                transition={{ 
                  delay: index * 0.05,
                  type: "spring",
                  stiffness: 300,
                  damping: 25
                }}
                className={`group relative p-4 rounded-xl border backdrop-blur-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${getStatusStyles(task)}`}
              >
                <div className="flex items-start gap-3">
                  <motion.button 
                    whileTap={{ scale: 0.8 }}
                    onClick={() => handleToggleTask(task.id)}
                    className={`mt-1 text-xl transition-colors ${
                      task.status === "completed" ? "text-emerald-500" : "text-gray-300 dark:text-gray-600 hover:text-emerald-500"
                    }`}
                  >
                    {task.status === "completed" ? <FaCheckCircle className="drop-shadow-sm" /> : <FaCircle />}
                  </motion.button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className={`font-semibold text-gray-900 dark:text-gray-100 leading-tight transition-all duration-300 ${task.status === "completed" ? "line-through text-gray-400 dark:text-gray-500 decoration-2 decoration-emerald-500/30" : ""}`}>
                        {t(task.task as any)}
                      </h4>
                      {task.source && task.source !== "manual" && (
                        <div className="ml-2 flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity" title="Smart Task">
                          {getSourceIcon(task.source)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {/* DTS Impact Label - NEW */}
                      <span className="flex items-center gap-1.5 bg-emerald-50/80 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-md font-semibold">
                        +10 DTS
                      </span>
                      {task.time && (
                        <span className="flex items-center gap-1.5 bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded-md">
                          <FaClock className="text-emerald-500/70" /> {task.time}
                        </span>
                      )}
                      <span className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm ${
                        task.priority === "high" ? "bg-red-100/80 dark:bg-red-900/30 text-red-700 dark:text-red-300" :
                        task.priority === "medium" ? "bg-yellow-100/80 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300" :
                        "bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      }`}>
                         {task.priority === "high" && <span className="text-sm">!</span>}
                         {task.priority === "medium" && <span className="text-sm">•</span>}
                         {task.priority === "low" && <span className="text-sm">↓</span>}
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Indicator Bar */}
                <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full shadow-[0_0_8px_rgba(0,0,0,0.1)] ${
                  task.status === "completed" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" :
                  task.status === "overdue" ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" :
                  task.priority === "high" ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]" : "bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                }`} />
              </motion.div>
            ))}
          </AnimatePresence>
          </div>
        )}
        
        {!loading && tasks.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 text-gray-400 dark:text-gray-500"
          >
            <div className="bg-gray-100/50 dark:bg-gray-800/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <FaCheckCircle className="text-3xl text-emerald-500/30" />
            </div>
            <p className="font-medium">{t('no_tasks_for')} {t(activeTab)}</p>
          </motion.div>
        )}
      </div>

      {/* DTS Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <FaCheckCircle className="text-xl" />
            </div>
            <div>
              <p className="font-bold text-lg">+10 Daily Task Score</p>
              <p className="text-emerald-200 text-sm">Task completed successfully</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
