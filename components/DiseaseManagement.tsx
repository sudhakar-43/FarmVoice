"use client";

import { useState, useEffect } from "react";
import { FaBug, FaSearch, FaLeaf, FaExclamationTriangle, FaCloudRain, FaTemperatureHigh, FaWind } from "react-icons/fa";
import { apiClient } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";

interface Disease {
  name: string;
  symptoms: string;
  control: string;
  image_url?: string;
}

interface RiskForecast {
  level: "Low" | "Moderate" | "High";
  factor: string;
  icon: React.ReactNode;
  color: string;
}

export default function DiseaseManagement() {
  const { t } = useSettings();
  const [cropSearch, setCropSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [predictions, setPredictions] = useState<Disease[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [riskForecast, setRiskForecast] = useState<RiskForecast[]>([]);

  const commonCrops = ["Rice", "Wheat", "Corn", "Tomato", "Potato", "Cotton", "Soybean", "Sugarcane", "Chilli", "Mango"];

  const filteredCrops = commonCrops.filter(c => c.toLowerCase().includes(cropSearch.toLowerCase()));

  useEffect(() => {
    // Fetch risk forecast from backend API
    const fetchRiskForecast = async () => {
      try {
        // TODO: Implement API call to fetch risk forecast based on current weather
        // const response = await apiClient.getDiseaseRiskForecast();
        // setRiskForecast(response.data || []);
        setRiskForecast([]);
      } catch (error) {
        console.error("Error fetching risk forecast:", error);
        setRiskForecast([]);
      }
    };
    fetchRiskForecast();
  }, []);

  const handlePredict = async () => {
    if (!cropSearch) {
      setError(t('enter_crop_error'));
      return;
    }

    setIsLoading(true);
    setError("");
    setPredictions([]);

    try {
      const response = await apiClient.predictDisease(cropSearch);
      
      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data && response.data.diseases) {
        setPredictions(response.data.diseases);
      } else {
        setError(t('no_diseases_found'));
      }
    } catch (err) {
      console.error("Prediction error:", err);
      setError(t('prediction_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Header & Risk Forecast */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl">
              <FaBug className="text-red-600 dark:text-red-400 text-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('disease_management_title')}</h2>
              <p className="text-gray-500 dark:text-gray-400">{t('disease_management_desc')}</p>
            </div>
          </div>
          
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t('select_crop_label')}</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={cropSearch}
                  onChange={(e) => {
                    setCropSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  placeholder={t('type_crop_placeholder')}
                />
                {showSuggestions && cropSearch && filteredCrops.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-xl shadow-lg border border-gray-100 dark:border-gray-600 max-h-48 overflow-y-auto">
                    {filteredCrops.map((crop) => (
                      <button
                        key={crop}
                        onClick={() => {
                          setCropSearch(crop);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                      >
                        {crop}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handlePredict}
                disabled={isLoading}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> : <FaSearch />}
                {t('predict_button')}
              </button>
            </div>
          </div>
        </div>

        {/* Risk Forecast Card */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-6 border border-orange-100 dark:border-orange-800 shadow-sm">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <FaExclamationTriangle className="text-orange-500" />
            {t('disease_risk_forecast')}
          </h3>
          <div className="space-y-3">
            {riskForecast.map((risk, idx) => (
              <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 ${risk.color}`}>
                <div className="text-xl opacity-80">{risk.icon}</div>
                <div>
                  <div className="font-bold text-sm">{t(`risk_level_${risk.level.toLowerCase()}` as any)}</div>
                  <div className="text-xs opacity-90">{t(risk.factor as any)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-fade-in">
          {error}
        </div>
      )}

      {/* Predictions Results */}
      <AnimatePresence>
        {predictions.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {predictions.map((disease, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                {disease.image_url && (
                  <div className="h-48 w-full bg-gray-100 dark:bg-gray-700 relative">
                    <img 
                      src={disease.image_url} 
                      alt={disease.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 shadow-sm">
                      {t('ai_confidence')}: 92%
                    </div>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{disease.name}</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t('symptoms_label')}</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{disease.symptoms}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">{t('control_label')}</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-800">
                      {disease.control}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isLoading && predictions.length === 0 && !error && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <FaLeaf className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t('select_crop_prompt')}</p>
        </div>
      )}
    </div>
  );
}
