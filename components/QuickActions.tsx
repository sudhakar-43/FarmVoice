"use client";

import { FaLeaf, FaBug, FaChartLine, FaMicrophone, FaSearch, FaHistory } from "react-icons/fa";

interface QuickActionsProps {
  onFeatureClick: (feature: string) => void;
  onVoiceClick: () => void;
}

export default function QuickActions({ onFeatureClick, onVoiceClick }: QuickActionsProps) {
  const actions = [
    { id: "crop", label: "Crop Recommendation", icon: FaLeaf, color: "emerald", description: "Get crop suggestions" },
    { id: "disease", label: "Disease Check", icon: FaBug, color: "red", description: "Diagnose plant issues" },
    { id: "market", label: "Market Prices", icon: FaChartLine, color: "blue", description: "View price trends" },
    { id: "voice", label: "Voice Assistant", icon: FaMicrophone, color: "purple", description: "Ask questions" },
  ];

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 rounded-xl border border-emerald-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">Quick Actions</h3>
          <p className="text-sm text-gray-600">Access your most used features instantly</p>
        </div>
        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
          <FaHistory className="text-xs" />
          <span>Recently used</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          const isVoice = action.id === "voice";
          
          const getColorClasses = (color: string) => {
            const colors: { [key: string]: { bg: string; hoverBg: string; text: string; border: string; gradient: string } } = {
              emerald: { bg: "bg-emerald-100", hoverBg: "group-hover:bg-emerald-600", text: "text-emerald-600", border: "hover:border-emerald-500", gradient: "from-emerald-500 to-emerald-600" },
              red: { bg: "bg-red-100", hoverBg: "group-hover:bg-red-600", text: "text-red-600", border: "hover:border-red-500", gradient: "from-red-500 to-red-600" },
              blue: { bg: "bg-blue-100", hoverBg: "group-hover:bg-blue-600", text: "text-blue-600", border: "hover:border-blue-500", gradient: "from-blue-500 to-blue-600" },
              purple: { bg: "bg-purple-100", hoverBg: "group-hover:bg-purple-600", text: "text-purple-600", border: "hover:border-purple-500", gradient: "from-purple-500 to-purple-600" },
            };
            return colors[color] || colors.emerald;
          };
          
          const colorClasses = getColorClasses(action.color);
          
          return (
            <button
              key={action.id}
              onClick={() => isVoice ? onVoiceClick() : onFeatureClick(action.id)}
              className={`bg-white rounded-lg border-2 border-gray-200 p-4 text-center ${colorClasses.border} hover:shadow-md transition-all duration-200 group relative overflow-hidden`}
            >
              {/* Hover gradient effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${colorClasses.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
              
              <div className="relative z-10">
                <div className={`${colorClasses.bg} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${colorClasses.hoverBg} transition-colors duration-300`}>
                  <Icon className={`${colorClasses.text} text-xl group-hover:text-white transition-colors duration-300`} />
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{action.label}</h4>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

