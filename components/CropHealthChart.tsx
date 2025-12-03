"use client";

import { FaHeartbeat, FaLeaf, FaShieldAlt } from "react-icons/fa";
import { useSettings } from "@/context/SettingsContext";

export default function CropHealthChart() {
  const { t } = useSettings();
  // Static data for overview - in production, fetch from API
  const healthScore = 92;
  const status = "status_excellent";
  
  return (
    <div className="h-full flex flex-col justify-center space-y-4">
      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
        <div className="flex items-center">
          <div className="p-3 bg-white dark:bg-emerald-800/50 rounded-full shadow-sm mr-4 text-emerald-600 dark:text-emerald-400">
            <FaHeartbeat className="text-xl" />
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t('overall_health')}</div>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{healthScore}%</div>
          </div>
        </div>
        <div className="text-right">
          <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full uppercase tracking-wide">
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
          <div className="text-lg font-bold text-gray-800 dark:text-white">{t('growth_normal')}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
          <div className="flex items-center mb-2">
            <FaShieldAlt className="text-blue-500 dark:text-blue-400 mr-2" />
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{t('risks')}</span>
          </div>
          <div className="text-lg font-bold text-gray-800 dark:text-white">{t('risk_low')}</div>
        </div>
      </div>
    </div>
  );
}
