"use client";

import { useRouter } from "next/navigation";
import { FaArrowLeft, FaChartLine } from "react-icons/fa";
import CropHealthChart from "@/components/CropHealthChart";
import HealthTrendChart from "@/components/HealthTrendChart";
import { useState } from "react";

export default function HealthOverviewPage() {
  const router = useRouter();
  const [healthMetrics, setHealthMetrics] = useState<any>(null);

  const handleHealthUpdate = (data: any) => {
     setHealthMetrics(data);
  };

  const getGrowthRate = () => {
    const status = healthMetrics?.growth_status || "Evaluating";
    if (status === "Optimal") return { val: "+15%", desc: "Excellent growth rate" };
    if (status === "Healthy") return { val: "+10%", desc: "Above average for this season" };
    if (status === "Moderate") return { val: "+5%", desc: "Average growth for this period" };
    if (status === "Stunted") return { val: "-3%", desc: "Below expected - needs attention" };
    return { val: "—", desc: "Tracking begins after initial setup" }; // Evaluating
  };

  const getRiskLabel = () => {
     const level = healthMetrics?.risk_level || "unknown";
     return level.charAt(0).toUpperCase() + level.slice(1);
  };

  const isNewUser = healthMetrics?.risk_level === "unknown" || healthMetrics?.risk_level === "Unknown";

  const getCardStyle = () => {
    const chi = healthMetrics?.health_score || 50;
    if (isNewUser) return "bg-white border-slate-200";
    if (chi >= 80) return "bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200";
    if (chi >= 50) return "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200";
    return "bg-gradient-to-br from-red-50 to-orange-50 border-red-200";
  };


  const growth = getGrowthRate();

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 px-4 py-2 bg-white rounded-full text-gray-600 hover:text-emerald-600 shadow-sm hover:shadow transition-all group"
          >
            <FaArrowLeft className="text-sm group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-semibold">Back to Dashboard</span>
          </button>
        </div>

        <div className="space-y-2">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Crop Health Index</h1>
            <p className="text-lg text-gray-500">Live analytics and health trajectory</p>
        </div>

        {/* Main Health Card */}
        <div className="bg-white rounded-3xl p-1 shadow-xl shadow-emerald-100/50 border border-gray-100">
             <div className="p-6">
                <CropHealthChart onDataLoaded={handleHealthUpdate} />
             </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Growth Trend Card */}
            <div className={`p-6 rounded-3xl shadow-lg border relative overflow-hidden group hover:shadow-xl transition-all duration-300 ${getCardStyle()}`}>
              <div className="relative z-10">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                   <FaChartLine size={60} className="text-emerald-500" />
                </div>
                <h3 className="text-gray-500 font-medium mb-1 text-sm uppercase tracking-wider">Seasonal Growth Trend</h3>
                <div className="flex items-end space-x-2">
                  <span className="text-4xl font-bold text-gray-800">{growth.val}</span>
                  {growth.val !== "—" && <span className={`font-bold mb-1 text-sm ${growth.val.startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>{growth.val.startsWith('-') ? '▼' : '▲'}</span>}
                </div>
                <p className="text-gray-400 text-sm mt-3 font-medium">{growth.desc}</p>
              </div>
            </div>

            {/* Moisture Card */}
            <div className={`p-6 rounded-3xl shadow-lg border relative overflow-hidden group hover:shadow-xl transition-all duration-300 ${getCardStyle()}`}>
              <div className="relative z-10">
                <div className="bg-blue-500/10 absolute top-0 right-0 w-24 h-24 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                <h3 className="text-gray-500 font-medium mb-1 text-sm uppercase tracking-wider">Moisture</h3>
                <div className="flex items-end space-x-2">
                  <span className="text-4xl font-bold text-gray-800">{isNewUser ? "—" : "Optimal"}</span>
                </div>
                <p className="text-blue-500 text-sm mt-3 font-medium">{isNewUser ? "Sensor data pending" : "Hydration levels perfect"}</p>
              </div>
            </div>

            {/* Risk Card */}
            <div className={`p-6 rounded-3xl shadow-lg border relative overflow-hidden group hover:shadow-xl transition-all duration-300 ${getCardStyle()}`}>
              <div className="relative z-10 flex flex-col h-full">
                <div className={`absolute top-0 left-0 w-1 h-full z-20 ${isNewUser ? 'bg-slate-400' : healthMetrics?.risk_level === 'high' ? 'bg-red-500' : healthMetrics?.risk_level === 'medium' ? 'bg-yellow-500' : 'bg-emerald-500'}`}></div>
                <h3 className="text-gray-500 font-medium mb-1 text-sm uppercase tracking-wider">Pest Risk</h3>
                <div className="flex items-end space-x-2">
                  <span className={`text-4xl font-bold ${isNewUser ? 'text-slate-500' : healthMetrics?.risk_level === 'high' ? 'text-red-600' : healthMetrics?.risk_level === 'medium' ? 'text-yellow-600' : 'text-emerald-600'}`}>
                      {getRiskLabel()}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-3 font-medium">
                    {isNewUser 
                      ? "Monitoring begins after initial activity"
                      : healthMetrics?.disease_risk?.factors?.[0] || "No current concerns"}
                </p>
              </div>
            </div>
        </div>

        {/* Trend Chart (Full Width) */}
        <div>
           <HealthTrendChart />
        </div>
        
      </div>
    </div>
  );
}
