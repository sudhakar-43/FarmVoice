"use client";

import { useState, useEffect } from "react";
import { FaHeartbeat, FaLeaf, FaShieldAlt, FaSpinner } from "react-icons/fa";
import { useSettings } from "@/context/SettingsContext";
import { apiClient } from "@/lib/api";

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

export default function CropHealthChart() {
  const { t } = useSettings();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  
  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        // Fetch disease risk forecast from API
        const response = await apiClient.request<any>('/api/disease-risk-forecast', {
          method: 'GET'
        });
        
        if (response.data) {
          const data = response.data;
          
          // Calculate health score based on disease risk
          let baseScore = 95; // Start with high score
          
          // Reduce score based on risk factors
          if (data.risk_level === "high") {
            baseScore -= 25;
          } else if (data.risk_level === "medium") {
            baseScore -= 12;
          } else if (data.risk_level === "low") {
            baseScore -= 5;
          }
          
          // Add weather-based adjustments
          if (data.weather_conditions) {
            const conditions = data.weather_conditions;
            if (conditions.humidity > 85) baseScore -= 5;
            if (conditions.temperature > 35) baseScore -= 8;
            if (conditions.temperature < 10) baseScore -= 8;
          }
          
          // Ensure score is within bounds
          baseScore = Math.max(50, Math.min(100, baseScore));
          
          // Determine status text
          let status = "status_excellent";
          if (baseScore >= 90) status = "status_excellent";
          else if (baseScore >= 75) status = "status_good";
          else if (baseScore >= 60) status = "status_fair";
          else status = "status_poor";
          
          setHealthData({
            health_score: baseScore,
            status,
            growth_status: data.growth_stage || "growth_normal",
            risk_level: data.risk_level || "low",
            disease_risk: data.disease_risk || { level: "low", factors: [] }
          });
        } else {
          // Fallback to calculated data based on weather
          const weatherResponse = await apiClient.request<any>('/api/weather?latitude=20.5937&longitude=78.9629', {
            method: 'GET'
          });
          
          if (weatherResponse.data) {
            const weather = weatherResponse.data.current || {};
            let score = 90;
            
            // Adjust based on weather
            if (weather.humidity > 85) score -= 8;
            if (weather.temperature > 35) score -= 10;
            if (weather.wind_speed > 20) score -= 5;
            
            score = Math.max(60, score);
            
            setHealthData({
              health_score: score,
              status: score >= 80 ? "status_good" : "status_fair",
              growth_status: "growth_normal",
              risk_level: weather.humidity > 85 ? "medium" : "low",
              disease_risk: { level: "low", factors: [] }
            });
          } else {
            // Final fallback
            setHealthData({
              health_score: 85,
              status: "status_good",
              growth_status: "growth_normal",
              risk_level: "low",
              disease_risk: { level: "low", factors: [] }
            });
          }
        }
      } catch (error) {
        console.error("Error fetching health data:", error);
        // Fallback data
        setHealthData({
          health_score: 85,
          status: "status_good",
          growth_status: "growth_normal",
          risk_level: "low",
          disease_risk: { level: "low", factors: [] }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
  }, []);
  
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <FaSpinner className="animate-spin text-emerald-600 dark:text-emerald-400 text-2xl" />
      </div>
    );
  }
  
  const healthScore = healthData?.health_score || 85;
  const status = healthData?.status || "status_good";
  const riskLevel = healthData?.risk_level || "low";
  
  // Determine colors based on health score
  const getScoreColor = () => {
    if (healthScore >= 85) return "text-emerald-700 dark:text-emerald-400";
    if (healthScore >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };
  
  const getStatusBg = () => {
    if (healthScore >= 85) return "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300";
    if (healthScore >= 70) return "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300";
    return "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300";
  };
  
  const getRiskColor = () => {
    if (riskLevel === "high") return "text-red-600 dark:text-red-400";
    if (riskLevel === "medium") return "text-yellow-600 dark:text-yellow-400";
    return "text-emerald-600 dark:text-emerald-400";
  };
  
  return (
    <div className="h-full flex flex-col justify-center space-y-4">
      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
        <div className="flex items-center">
          <div className="p-3 bg-white dark:bg-emerald-800/50 rounded-full shadow-sm mr-4 text-emerald-600 dark:text-emerald-400">
            <FaHeartbeat className="text-xl" />
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('overall_health')}</div>
            <div className={`text-2xl font-bold ${getScoreColor()}`}>{healthScore}%</div>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 ${getStatusBg()} text-xs font-bold rounded-full uppercase tracking-wide`}>
            {t(status as any)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
          <div className="flex items-center mb-2">
            <FaLeaf className="text-emerald-500 dark:text-emerald-400 mr-2" />
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{t('growth')}</span>
          </div>
          <div className="text-lg font-bold text-gray-800 dark:text-white">{t(healthData?.growth_status as any || 'growth_normal')}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
          <div className="flex items-center mb-2">
            <FaShieldAlt className={`${getRiskColor()} mr-2`} />
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{t('risks')}</span>
          </div>
          <div className={`text-lg font-bold ${getRiskColor()}`}>
            {riskLevel === "high" ? t('risk_high' as any) : riskLevel === "medium" ? t('risk_medium' as any) : t('risk_low')}
          </div>
        </div>
      </div>
    </div>
  );
}
