"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaCheckSquare, FaCheck, FaTasks, FaArrowRight } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

interface Task {
  id: string;
  task_name: string;
  priority: string;
  due_date: string;
  status: string;
}

export default function TasksWidget() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // INSTANT CACHE CHECK
        const cachedTasks = localStorage.getItem("farmvoice_tasks_cache");
        if (cachedTasks) {
            const { data, timestamp } = JSON.parse(cachedTasks);
            if (Date.now() - timestamp < 600000) { // 10 mins cache
                setAllTasks(data.all);
                setTasks(data.pending);
                setLoading(false);
                return;
            }
        }

        let userId = localStorage.getItem("farmvoice_user_id");
        if (!userId) {
             // Fallback for demo if no user
             setLoading(false);
             return;
        }

        const today = new Date().toISOString().split('T')[0];
        const { supabase } = await import("@/lib/supabaseClient");

        let { data: fetchedTasks, error } = await supabase
          .from('daily_tasks')
          .select('*')
          .eq('user_id', userId)
          .eq('scheduled_date', today);

        if (fetchedTasks) {
           const formattedTasks = fetchedTasks.map((t: any) => ({
             id: t.id,
             task_name: t.task_name,
             priority: t.priority || "MEDIUM",
             due_date: t.scheduled_date,
             status: t.completed ? 'completed' : 'pending'
           }));

           const pending = formattedTasks.filter((t: any) => t.status !== 'completed');
           setAllTasks(formattedTasks);
           setTasks(pending);
           
           localStorage.setItem("farmvoice_tasks_cache", JSON.stringify({
              data: { all: formattedTasks, pending },
              timestamp: Date.now()
           }));
        }
      } catch {
        // Tasks fetch error - silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  const handleCompleteTask = async (taskId: string) => {
    try {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setAllTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t));
      
      localStorage.removeItem("farmvoice_chi_cache"); // Invalidate health score cache

      const { supabase } = await import("@/lib/supabaseClient");
      await supabase.from('daily_tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);
    } catch {
      // Error completing task - silently fail
    }
  };

  const getPriorityColor = (priority: string) => {
      const p = priority?.toUpperCase();
      if (p === 'HIGH') return 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      if (p === 'MEDIUM') return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800';
      return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
  };

  const completedCount = allTasks.filter(t => t.status === 'completed').length;
  const totalTasksCount = allTasks.length || 10;
  const allCompleted = totalTasksCount > 0 && completedCount === totalTasksCount;
  const progress = totalTasksCount > 0 ? (completedCount / totalTasksCount) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaTasks className="text-emerald-500" /> Daily Tasks
        </h3>
        <button 
          onClick={() => router.push("/home/tasks")}
          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
        >
          View All <FaArrowRight size={10} />
        </button>
      </div>

      <div className="p-5 flex-1 overflow-y-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-2">
            <span className="text-gray-500 dark:text-gray-400 font-medium">{completedCount} of {totalTasksCount} completed</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <motion.div 
              className="bg-emerald-500 h-2 rounded-full" 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-50 dark:bg-gray-700/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : allCompleted ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-3 text-emerald-600 dark:text-emerald-400"
            >
              <FaCheck size={24} />
            </motion.div>
            <p className="font-bold text-gray-900 dark:text-white">All caught up!</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Great work today.</p>
          </div>
        ) : tasks.length === 0 ? (
           <div className="text-center py-8 text-gray-500">
             <p>No tasks scheduled for today.</p>
           </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {tasks.slice(0, 4).map((task) => (
                <motion.div 
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="group flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800 transition-all hover:shadow-sm"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <button 
                      onClick={() => handleCompleteTask(task.id)}
                      className="flex-shrink-0 w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 hover:border-emerald-500 hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center text-transparent"
                    >
                      <FaCheck size={10} />
                    </button>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      {task.task_name}
                    </span>
                  </div>
                  
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
            {tasks.length > 4 && (
                <p className="text-xs text-center text-gray-400 mt-2">+{tasks.length - 4} more tasks</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
