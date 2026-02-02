"use client";

import { useState, useEffect } from "react";
import { FaHeartbeat, FaLeaf, FaArrowUp, FaArrowDown, FaMinus, FaSpinner, FaInfoCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import { apiClient } from "@/lib/api";

interface DTSData {
  date: string;
  completed_tasks: number;
  total_tasks: number;
  score: number;
  impact_label: string;
}

interface CHIData {
  score: number;
  trend: "up" | "down" | "stable" | "hidden";
  trend_delta: number;
  growth_status: string;
  risk_level: string;
  explanation: string;
  is_new_user?: boolean;
  grace_period_ends_at?: string | null;
}

interface HealthData {
  health_score: number;
  status: string;
  growth_status: string;
  risk_level: string;
  disease_risk: {
    level: string;
    factors: string[];
  };
}

interface CropHealthChartProps {
  onDataLoaded?: (data: HealthData) => void;
}

export default function CropHealthChart({ onDataLoaded }: CropHealthChartProps) {
  const { t } = useSettings();
  const [loading, setLoading] = useState(true);
  const [dtsData, setDtsData] = useState<DTSData | null>(null);
  const [chiData, setChiData] = useState<CHIData | null>(null);

  useEffect(() => {
    const fetchCHIData = async () => {
      try {
        // QUICK CACHE CHECK
        const cached = localStorage.getItem("farmvoice_chi_cache");
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 60000) { // 1 min cache for DTS (changes frequently)
            setDtsData(data.dts);
            setChiData(data.chi);
            if (onDataLoaded) {
              onDataLoaded({
                health_score: data.chi.score,
                status: data.chi.score >= 80 ? "Excellent" : data.chi.score >= 50 ? "Good" : "Needs Attention",
                growth_status: data.chi.growth_status,
                risk_level: data.chi.risk_level,
                disease_risk: { level: data.chi.risk_level, factors: [] }
              });
            }
            setLoading(false);
          }
        }

        // Fetch from new CHI/DTS API
        const response = await apiClient.request<{ dts: DTSData; chi: CHIData }>('/api/chi-data', {
          method: 'GET'
        });

        if (response.data) {
          const { dts, chi } = response.data;
          setDtsData(dts);
          setChiData(chi);

          // Update cache
          localStorage.setItem("farmvoice_chi_cache", JSON.stringify({
            data: response.data,
            timestamp: Date.now()
          }));

          if (onDataLoaded) {
            onDataLoaded({
              health_score: chi.score,
              status: chi.score >= 80 ? "Excellent" : chi.score >= 50 ? "Good" : "Needs Attention",
              growth_status: chi.growth_status,
              risk_level: chi.risk_level,
              disease_risk: { level: chi.risk_level, factors: [] }
            });
          }
        }
      } catch (error) {
        console.error("Error fetching CHI data:", error);
        // Fallback data - assume new user for safety
        setDtsData({
          date: new Date().toISOString().split('T')[0],
          completed_tasks: 0,
          total_tasks: 10,
          score: 0,
          impact_label: "+10 Daily Task Score"
        });
        setChiData({
          score: 50,
          trend: "hidden",
          trend_delta: 0,
          growth_status: "Evaluating",
          risk_level: "Unknown",
          explanation: "Baseline value. Health tracking begins after initial activity.",
          is_new_user: true,
          grace_period_ends_at: null
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCHIData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <FaSpinner className="animate-spin text-emerald-600 dark:text-emerald-400 text-2xl" />
      </div>
    );
  }

  const chiScore = chiData?.score ?? 50;
  const dtsScore = dtsData?.score ?? 0;
  const completedTasks = dtsData?.completed_tasks ?? 0;
  const totalTasks = dtsData?.total_tasks ?? 10;
  const trend = chiData?.trend ?? "stable";
  const trendDelta = chiData?.trend_delta ?? 0;
  const growthStatus = chiData?.growth_status ?? "Moderate";
  const riskLevel = chiData?.risk_level ?? "Low";
  const explanation = chiData?.explanation ?? "Start completing tasks to improve your score.";
  const isNewUser = chiData?.is_new_user ?? false;

  // Color helpers - calm colors for new users
  const getScoreColor = () => {
    if (isNewUser) return "text-blue-600 dark:text-blue-400"; // Calm blue for new users
    if (chiScore >= 80) return "text-emerald-700 dark:text-emerald-400";
    if (chiScore >= 50) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getBackgroundGradient = () => {
    if (isNewUser) {
      // Calm blue gradient for new users - no alarming colors
      return "bg-gradient-to-r from-blue-50 to-slate-100 dark:from-blue-900/30 dark:to-slate-800/30 border-blue-200 dark:border-blue-700/50";
    }
    if (chiScore >= 80) return "bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/30 dark:to-emerald-800/30 border-emerald-200 dark:border-emerald-700/50";
    if (chiScore >= 50) return "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-700/50";
    return "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-700/50";
  };

  const getGrowthColor = () => {
    if (growthStatus === "Evaluating") return "text-blue-600 dark:text-blue-400"; // Calm for new users
    switch (growthStatus) {
      case "Optimal": return "text-emerald-600";
      case "Healthy": return "text-green-600";
      case "Moderate": return "text-amber-600";
      case "Stunted": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getRiskColor = () => {
    if (riskLevel === "Unknown") return "text-blue-600 dark:text-blue-400"; // Calm for new users
    switch (riskLevel) {
      case "Low": return "text-emerald-600";
      case "Medium": return "text-amber-600";
      case "High": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getTrendIcon = () => {
    // Hide trend arrows for new users
    if (trend === "hidden" || isNewUser) return null;
    if (trend === "up") return <FaArrowUp className="text-emerald-500" />;
    if (trend === "down") return <FaArrowDown className="text-red-500" />;
    return <FaMinus className="text-gray-400" />;
  };

  const getTrendText = () => {
    if (isNewUser || trend === "hidden") return "";
    if (trendDelta === 0) return "";
    const sign = trendDelta > 0 ? "+" : "";
    return `${sign}${trendDelta.toFixed(1)}%`;
  };

  // Helper for growth/risk tooltips for new users
  const getGrowthTooltip = () => {
    if (growthStatus === "Evaluating") {
      return "Growth rate will be calculated after sufficient activity.";
    }
    return chiScore >= 70 ? "Optimal pace" : chiScore >= 40 ? "Needs improvement" : "Critical attention";
  };

  const getRiskTooltip = () => {
    if (riskLevel === "Unknown") {
      return "Monitoring will begin after initial setup.";
    }
    return riskLevel === "Low" ? "No current concerns" : riskLevel === "Medium" ? "Monitor closely" : riskLevel === "High" ? "Immediate action" : "Monitoring not started";
  };

  return (
    <div className="w-full h-full perspective-1000">
      <motion.div
        whileHover={{ scale: 1.01, rotateX: 2, rotateY: 2, z: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`w-full h-full p-6 rounded-3xl border shadow-xl relative overflow-hidden group cursor-pointer flex flex-col justify-between ${getBackgroundGradient()}`}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Background Depth Effect */}
        <div className="absolute inset-0 bg-white/40 dark:bg-black/20 backdrop-blur-[4px] z-0 pointer-events-none" />

        {/* Shine Effect */}
        <motion.div
          className="absolute top-0 -left-[100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 z-20 pointer-events-none"
          animate={{ x: "400%" }}
          transition={{ repeat: Infinity, duration: 5, ease: "linear", repeatDelay: 3 }}
        />

        {/* --- HEADER --- */}
        <div className="relative z-10 flex justify-between items-start transform-gpu" style={{ transform: "translateZ(20px)" }}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-inner bg-white/50 dark:bg-black/10 backdrop-blur-md ${getScoreColor()}`}>
              <FaLeaf className="text-xl" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white tracking-tight">
                {isNewUser ? "Baseline Health" : "Crop Health Index"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-300 font-medium">
                {isNewUser ? "Initial Setup Period" : "Enterprise Analytics"}
              </p>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/50 dark:bg-white/10 flex items-center justify-center text-gray-500 dark:text-gray-300 shadow-sm border border-white/20">
            <FaHeartbeat />
          </div>
        </div>

        {/* --- MIDDLE CONTENT (CHI + DTS Progress) --- */}
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 my-4 transform-gpu" style={{ transform: "translateZ(30px)" }}>

          {/* Left: CHI Donut Chart */}
          <div className="relative flex-shrink-0">
            <svg height="120" width="120" className="transform -rotate-90 drop-shadow-lg">
              <circle
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="12"
                fill="transparent"
                r="50"
                cx="60"
                cy="60"
              />
              <motion.circle
                stroke={isNewUser ? "#3B82F6" : chiScore >= 80 ? "#10B981" : chiScore >= 50 ? "#F59E0B" : "#EF4444"}
                strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 50} ${2 * Math.PI * 50}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 50 * (1 - chiScore / 100) }}
                strokeLinecap="round"
                fill="transparent"
                r="50"
                cx="60"
                cy="60"
                className="filter drop-shadow-md"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-extrabold ${getScoreColor()}`}>{Math.round(chiScore)}%</span>
                {getTrendIcon()}
              </div>
              <span className="text-[10px] font-medium text-gray-500">
                {isNewUser ? "Baseline" : getTrendText()}
              </span>
            </div>
          </div>

          {/* Right: Metrics Grid */}
          <div className="flex-1 grid grid-cols-2 gap-3 w-full">
            <div className="bg-white/40 dark:bg-white/5 p-3 rounded-2xl border border-white/20 shadow-sm backdrop-blur-sm group/tooltip relative">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-1">Growth Status</p>
              <p className={`font-bold text-base ${getGrowthColor()}`}>
                {growthStatus}
              </p>
              <p className="text-[10px] text-gray-400">
                {getGrowthTooltip()}
              </p>
              {growthStatus === "Evaluating" && (
                <FaInfoCircle className="absolute top-2 right-2 text-blue-400 text-xs" />
              )}
            </div>
            <div className="bg-white/40 dark:bg-white/5 p-3 rounded-2xl border border-white/20 shadow-sm backdrop-blur-sm relative">
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide mb-1">Risk Level</p>
              <p className={`font-bold text-base ${getRiskColor()}`}>
                {riskLevel}
              </p>
              <p className="text-[10px] text-gray-400">
                {getRiskTooltip()}
              </p>
              {riskLevel === "Unknown" && (
                <FaInfoCircle className="absolute top-2 right-2 text-blue-400 text-xs" />
              )}
            </div>
          </div>
        </div>

        {/* --- FOOTER (DTS Progress + Explanation) --- */}
        <div className="relative z-10 transform-gpu" style={{ transform: "translateZ(20px)" }}>
          {/* Analytical Explanation */}
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 font-medium">
            {explanation}
          </p>

          {/* DTS Progress */}
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Daily Tasks</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {completedTasks}/{totalTasks} ({dtsScore} DTS)
            </span>
            <span className="text-[9px] text-gray-400 dark:text-gray-500 italic">Daily Task Score</span>
          </div>
          <div className="w-full bg-white/30 dark:bg-white/10 rounded-full h-2 overflow-hidden shadow-inner">
            <motion.div
              className={`h-full rounded-full ${isNewUser ? 'bg-blue-500' : dtsScore >= 70 ? 'bg-emerald-500' : dtsScore >= 40 ? 'bg-amber-500' : 'bg-gray-400'}`}
              initial={{ width: 0 }}
              animate={{ width: `${dtsScore}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

      </motion.div>
    </div>
  );
}
