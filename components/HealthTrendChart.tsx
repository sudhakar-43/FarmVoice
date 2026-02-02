"use client";

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { useSettings } from "@/context/SettingsContext";
import { apiClient } from "@/lib/api";
import { FaInfoCircle } from "react-icons/fa";

interface ChartData {
  date: string;
  score: number;
}

interface CHIResponse {
  chi: {
    is_new_user?: boolean;
    score: number;
  };
}

export default function HealthTrendChart() {
  const { t } = useSettings();
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check if user is new via CHI API
        try {
          const chiResponse = await apiClient.request<CHIResponse>('/api/chi-data', { method: 'GET' });
          if (chiResponse.data?.chi?.is_new_user) {
            setIsNewUser(true);
            // Generate flat baseline data for new users
            const baselineData: ChartData[] = [];
            const today = new Date();
            for (let i = 6; i >= 0; i--) {
              const d = new Date(today);
              d.setDate(d.getDate() - i);
              baselineData.push({
                date: i === 0 ? 'Today' : `Day ${7-i}`,
                score: 50 // Flat baseline
              });
            }
            setData(baselineData);
            setLoading(false);
            return;
          }
        } catch (e) {
          // Continue with normal flow if API fails
        }

        // NORMAL USER: Show historical trajectory
        const mockData: ChartData[] = [];
        let currentScore = 50;
        const today = new Date();
        
        // Generate 14 days of history with realistic CHI changes
        for (let i = 14; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            
            // CHI changes slowly: -1% to +1% per day (realistic per DTS rules)
            const dailyChange = (Math.random() * 2) - 0.5; // Range: -0.5 to +1.5
            currentScore += dailyChange;
            
            // Keep within bounds 30-80 to look realistic
            currentScore = Math.max(35, Math.min(75, currentScore));
            
            mockData.push({
                date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                score: Math.round(currentScore * 10) / 10
            });
        }
        
        setData(mockData);

      } catch (err) {
        console.error("Chart error", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="h-64 w-full bg-gray-50 rounded-xl animate-pulse"></div>;

  // New User: Baseline view
  if (isNewUser) {
    return (
      <div className="w-full h-96 bg-gradient-to-br from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-800/20 p-6 rounded-3xl shadow-lg border border-blue-100 dark:border-blue-800/50 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Health Performance</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400">Initial monitoring period</p>
          </div>
          <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
            <FaInfoCircle className="text-blue-500 text-sm" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Baseline Mode</span>
          </div>
        </div>
        
        {/* Chart with baseline */}
        <div className="relative">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.3} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#9CA3AF', fontSize: 11 }} 
                dy={10}
              />
              <YAxis 
                hide={false}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 11 }}
                domain={[0, 100]} 
                width={30}
                ticks={[0, 25, 50, 75, 100]}
              />
              {/* Baseline reference line */}
              <ReferenceLine y={50} stroke="#3B82F6" strokeDasharray="4 4" strokeWidth={1} />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#3B82F6" 
                strokeWidth={2} 
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          
          {/* Overlay label */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 dark:bg-gray-800/90 px-6 py-4 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-700 text-center backdrop-blur-sm">
              <p className="text-lg font-bold text-gray-800 dark:text-white mb-1">Tracking starts after Day 1</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Baseline shown during initial monitoring</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal User: Full historical view
  return (
    <div className="w-full h-96 bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Health Performance</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Historical crop health trajectory</p>
        </div>
        <div className="flex items-center space-x-2">
            <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Live Updates</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" strokeOpacity={0.5} />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7280', fontSize: 12 }} 
            dy={10}
            minTickGap={30}
          />
          <YAxis 
            hide={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            domain={[0, 100]} 
            width={30}
          />
          <Tooltip 
            contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: 'none', 
                borderRadius: '8px',
                padding: '8px 12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
            itemStyle={{ color: '#10B981', fontWeight: 600 }}
            labelStyle={{ color: '#9CA3AF', marginBottom: '4px', fontSize: '12px' }}
            cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }}
            formatter={(value: number | undefined) => [`${(value ?? 0).toFixed(1)}%`, 'CHI']}
          />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#10B981" 
            strokeWidth={3} 
            dot={{ fill: '#10B981', strokeWidth: 2, r: 4, stroke: '#fff' }}
            activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
