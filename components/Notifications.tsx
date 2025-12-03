"use client";

import { useState, useEffect } from "react";
import {
  FaBell,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  date: string;
  read: boolean;
}

interface NotificationsProps {
  limit?: number;
}

export default function Notifications({ limit }: NotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await apiClient.getNotifications();

        if (response.error) {
          throw new Error(response.error);
        }

        const notificationsData = response.data || [];
        setNotifications(
          limit ? notificationsData.slice(0, limit) : notificationsData
        );
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [limit]);

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <FaExclamationTriangle className="text-yellow-500" />;
      case "success":
        return <FaCheckCircle className="text-emerald-500" />;
      case "error":
        return <FaTimes className="text-red-500" />;
      default:
        return <FaInfoCircle className="text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case "warning":
        return "bg-yellow-50 border-yellow-100";
      case "success":
        return "bg-emerald-50 border-emerald-100";
      case "error":
        return "bg-red-50 border-red-100";
      default:
        return "bg-blue-50 border-blue-100";
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(limit || 3)].map((_, i) => (
          <div
            key={i}
            className="h-24 bg-gray-100 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ delay: index * 0.1 }}
            className={`relative p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${getBgColor(
              notification.type
            )} ${
              !notification.read ? "border-l-4 border-l-blue-500 shadow-sm" : ""
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="mt-1 text-lg bg-white p-2 rounded-full shadow-sm">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4
                    className={`font-bold text-gray-800 ${
                      !notification.read ? "text-blue-700" : ""
                    }`}
                  >
                    {notification.title}
                  </h4>
                  <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded-md">
                    {notification.date}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {notification.message}
                </p>
              </div>
              {!notification.read && (
                <button
                  onClick={() => markAsRead(notification.id)}
                  className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                  title="Mark as read"
                ></button>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {notifications.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FaBell className="mx-auto text-4xl text-gray-300 mb-3" />
          <p>No new notifications.</p>
        </div>
      )}
    </div>
  );
}
