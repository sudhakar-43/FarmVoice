"use client";

import { useState, useEffect } from "react";
import { FaCheckCircle, FaCircle, FaCalendarAlt, FaClock, FaExclamationCircle, FaCloudSun, FaTint, FaWind } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";

interface Task {
  id: number;
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
    } catch (error) {
      console.error("Error fetching tasks:", error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = (taskId: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return { ...t, status: t.status === "completed" ? "pending" : "completed" };
      }
      return t;
    }));
  };

  const getStatusColor = (task: Task) => {
    if (task.status === "completed") return "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
    if (task.status === "overdue") return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
    
    // Time-based logic for "Yellow" (Due Soon)
    // Mocking "Due Soon" if priority is high for pending tasks
    if (task.priority === "high") return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    
    return "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700";
  };

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case "smart-weather": return <FaCloudSun className="text-orange-500" />;
      case "smart-disease": return <FaExclamationCircle className="text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      {!compact && (
        <div className="flex p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl mb-4">
          {(["yesterday", "today", "tomorrow"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all capitalize ${
                activeTab === tab
                  ? "bg-white dark:bg-gray-600 text-emerald-700 dark:text-emerald-400 shadow-sm"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              {t(tab)}
            </button>
          ))}
        </div>
      )}

      {/* Task List */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar space-y-3 ${activeTab === "yesterday" ? "opacity-75 grayscale" : ""}`}>
        {loading ? (
           <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {tasks.map((task, index) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${getStatusColor(task)}`}
              >
                <div className="flex items-start gap-3">
                  <button 
                    onClick={() => handleToggleTask(task.id)}
                    className={`mt-1 text-xl transition-colors ${
                      task.status === "completed" ? "text-emerald-500" : "text-gray-300 hover:text-emerald-500"
                    }`}
                  >
                    {task.status === "completed" ? <FaCheckCircle /> : <FaCircle />}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h4 className={`font-semibold text-gray-900 dark:text-white leading-tight ${task.status === "completed" ? "line-through text-gray-400 dark:text-gray-500" : ""}`}>
                        {t(task.task as any)}
                      </h4>
                      {task.source && task.source !== "manual" && (
                        <div className="ml-2 flex-shrink-0" title="Smart Task">
                          {getSourceIcon(task.source)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      {task.time && (
                        <span className="flex items-center gap-1">
                          <FaClock /> {task.time}
                        </span>
                      )}
                      {task.meta?.value && (
                        <span className="flex items-center gap-1 font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                          {task.meta.icon} {task.meta.value}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        task.priority === "high" ? "bg-red-100 text-red-700" :
                        task.priority === "medium" ? "bg-yellow-100 text-yellow-700" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Indicator Bar */}
                <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${
                  task.status === "completed" ? "bg-emerald-500" :
                  task.status === "overdue" ? "bg-red-500" :
                  task.priority === "high" ? "bg-yellow-500" : "bg-blue-500"
                }`} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {!loading && tasks.length === 0 && (
          <div className="text-center py-10 text-gray-400 dark:text-gray-500">
            <FaCheckCircle className="mx-auto text-4xl mb-3 opacity-20" />
            <p>{t('no_tasks_for')} {t(activeTab)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
