"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaCalendarAlt, FaSeedling, FaTint, FaSprayCan, FaBug, FaTractor } from "react-icons/fa";
import { motion } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import { apiClient } from "@/lib/api";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  crop: string;
  type: string;
  color: string;
  description: string;
}

export default function CropCalendarPage() {
  const router = useRouter();
  const { theme } = useSettings();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingWeek, setUpcomingWeek] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchCalendar();
  }, [currentMonth, currentYear]);

  const fetchCalendar = async () => {
    try {
      const response = await apiClient.request<any>(`/api/crop-calendar?month=${currentMonth}&year=${currentYear}`);
      if (response.data) {
        setEvents(response.data.events);
        setUpcomingWeek(response.data.upcoming_week);
      }
    } catch (error) {
      console.error("Error fetching calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case "sowing": case "transplanting": return <FaSeedling />;
      case "watering": return <FaTint />;
      case "fertilizing": return <FaSprayCan />;
      case "pest_check": return <FaBug />;
      case "harvest": return <FaSeedling className="text-yellow-500" />;
      default: return <FaCalendarAlt />;
    }
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
      gold: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800",
      purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    };
    return colors[color] || colors.green;
  };

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => router.push('/home')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full mr-4">
            <FaArrowLeft />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <FaCalendarAlt className="text-emerald-600 dark:text-emerald-400 text-xl" />
            </div>
            <h1 className="text-2xl font-bold">Crop Calendar</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => setCurrentMonth(m => m === 1 ? 12 : m - 1)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Previous
          </button>
          <h2 className="text-2xl font-bold">{monthNames[currentMonth - 1]} {currentYear}</h2>
          <button 
            onClick={() => setCurrentMonth(m => m === 12 ? 1 : m + 1)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Next
          </button>
        </div>

        {/* Upcoming This Week */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl border p-6 mb-8 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <span className="w-3 h-3 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
            Upcoming This Week
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingWeek.length > 0 ? upcomingWeek.map((event) => (
              <div key={event.id} className={`p-4 rounded-xl border ${getColorClass(event.color)}`}>
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getEventIcon(event.type)}</div>
                  <div>
                    <p className="font-bold">{event.title}</p>
                    <p className="text-sm opacity-75">{event.date}</p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 col-span-3">No activities scheduled this week</p>
            )}
          </div>
        </motion.div>

        {/* Calendar Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`rounded-3xl border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center font-bold text-sm text-gray-500">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24"></div>
            ))}
            {/* Days of month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = events.filter(e => e.date === dateStr);
              const isToday = new Date().toISOString().split('T')[0] === dateStr;
              
              return (
                <div 
                  key={day} 
                  className={`h-24 p-2 rounded-xl border ${
                    isToday 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                      : theme === 'dark' ? 'border-gray-700 bg-gray-700/30' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <p className={`text-sm font-bold mb-1 ${isToday ? 'text-emerald-600' : ''}`}>{day}</p>
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div key={event.id} className={`text-xs px-1 py-0.5 rounded ${getColorClass(event.color)} truncate`}>
                        {event.crop}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-xs text-gray-500">+{dayEvents.length - 2} more</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Legend */}
        <div className="mt-6 flex flex-wrap gap-4">
          {[
            { type: "Sowing", color: "green" },
            { type: "Watering", color: "blue" },
            { type: "Fertilizing", color: "orange" },
            { type: "Pest Check", color: "red" },
            { type: "Harvest", color: "gold" },
          ].map(item => (
            <div key={item.type} className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getColorClass(item.color)}`}>
              <span className="text-sm font-medium">{item.type}</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
