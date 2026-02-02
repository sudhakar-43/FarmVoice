"use client";

import { useState, useEffect } from "react";
import { FaBug, FaSearch, FaLeaf, FaExclamationTriangle, FaCloudRain, FaTemperatureHigh, FaWind } from "react-icons/fa";
import { apiClient } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import DiseaseHoverCard from "@/components/DiseaseHoverCard";

interface Disease {
  name: string;
  symptoms: string;
  control: string;
  image_url?: string;
  prevention?: string;
}

interface RiskForecast {
  level: "Low" | "Moderate" | "High";
  factor: string;
  icon: React.ReactNode;
  color: string;
}

interface SelectedCrop {
  id: string;
  crop_name: string;
  status: string;
}

export default function DiseaseManagement() {
  const { t } = useSettings();
  const [cropSearch, setCropSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [predictions, setPredictions] = useState<Disease[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [riskForecast, setRiskForecast] = useState<RiskForecast[]>([]);
  const [userCrops, setUserCrops] = useState<SelectedCrop[]>([]);
  const [loadingUserCrops, setLoadingUserCrops] = useState(true);
  const [selectedDisease, setSelectedDisease] = useState<Disease | null>(null);

  const commonCrops = ["Rice", "Wheat", "Corn", "Tomato", "Potato", "Cotton", "Soybean", "Sugarcane", "Chilli", "Mango"];

  const filteredCrops = commonCrops.filter(c => c.toLowerCase().includes(cropSearch.toLowerCase()));

  // Fetch user's selected crops on mount and auto-load diseases
  useEffect(() => {
    const fetchUserCrops = async () => {
      try {
        const response = await apiClient.getSelectedCrops();
        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
          setUserCrops(response.data);
          // Auto-select the first active crop
          const activeCrop = response.data.find((c: any) => c.status === 'active') || response.data[0];
          if (activeCrop) {
            setCropSearch(activeCrop.crop_name);
            // Auto-fetch diseases for the user's crop
            await fetchDiseasesForCrop(activeCrop.crop_name);
          }
        }
      } catch (error) {
        console.error("Error fetching user crops:", error);
      } finally {
        setLoadingUserCrops(false);
      }
    };
    fetchUserCrops();
    fetchRiskForecast();
  }, []);

  const fetchRiskForecast = async () => {
    try {
      const response = await apiClient.request<any>('/api/disease-risk-forecast');
      if (response.data) {
        const formattedRisks: RiskForecast[] = [];
        if (response.data.humidity_risk) {
          formattedRisks.push({
            level: response.data.humidity_risk > 70 ? "High" : response.data.humidity_risk > 50 ? "Moderate" : "Low",
            factor: "Humidity Risk",
            icon: <FaCloudRain />,
            color: response.data.humidity_risk > 70 ? "bg-red-100 text-red-600 border-red-200" : "bg-yellow-100 text-yellow-600 border-yellow-200"
          });
        }
        if (response.data.temperature_stress) {
          formattedRisks.push({
            level: response.data.temperature_stress > 35 ? "High" : response.data.temperature_stress > 30 ? "Moderate" : "Low",
            factor: "Temperature Stress",
            icon: <FaTemperatureHigh />,
            color: response.data.temperature_stress > 35 ? "bg-orange-100 text-orange-600 border-orange-200" : "bg-green-100 text-green-600 border-green-200"
          });
        }
        setRiskForecast(formattedRisks);
      }
    } catch (error) {
      console.error("Error fetching risk forecast:", error);
      setRiskForecast([]);
    }
  };

  const fetchDiseasesForCrop = async (cropName: string) => {
    setIsLoading(true);
    setError("");
    setPredictions([]);

    try {
      const response = await apiClient.predictDisease(cropName);
      
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

  const handlePredict = async () => {
    if (!cropSearch) {
      setError(t('enter_crop_error'));
      return;
    }
    await fetchDiseasesForCrop(cropSearch);
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
          
          {/* User's Crops Quick Select */}
          {userCrops.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Crops:</p>
              <div className="flex flex-wrap gap-2">
                {userCrops.map((crop) => (
                  <button
                    key={crop.id}
                    onClick={() => {
                      setCropSearch(crop.crop_name);
                      fetchDiseasesForCrop(crop.crop_name);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      cropSearch === crop.crop_name
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                    }`}
                  >
                    {crop.crop_name}
                  </button>
                ))}
              </div>
            </div>
          )}
          
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
            {riskForecast.length > 0 ? riskForecast.map((risk, idx) => (
              <div key={idx} className={`p-3 rounded-xl border flex items-center gap-3 ${risk.color}`}>
                <div className="text-xl opacity-80">{risk.icon}</div>
                <div>
                  <div className="font-bold text-sm">{risk.level}</div>
                  <div className="text-xs opacity-90">{risk.factor}</div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading risk data...</p>
            )}
          </div>
        </div>
      </div>

      {/* Loading state for initial crop fetch */}
      {loadingUserCrops && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mx-auto mb-2"></div>
          <p className="text-gray-500">Loading your crop diseases...</p>
        </div>
      )}

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
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 p-4"
          >
            {predictions.map((disease, idx) => (
              <DiseaseHoverCard 
                key={idx}
                title={disease.name}
                description={disease.symptoms}
                onMoreInfo={() => setSelectedDisease(disease)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Disease Detail Modal */}
      <AnimatePresence>
        {selectedDisease && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSelectedDisease(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
             />
             <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative z-10"
             >
                {selectedDisease.image_url && (
                  <div className="w-full h-64 relative">
                     <img 
                       src={selectedDisease.image_url} 
                       alt={selectedDisease.name} 
                       className="w-full h-full object-cover"
                       onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                     />
                     <button 
                       onClick={() => setSelectedDisease(null)}
                       className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-colors"
                     >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>
                )}
                
                <div className="p-8">
                   {!selectedDisease.image_url && (
                      <div className="flex justify-between items-start mb-4">
                         <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedDisease.name}</h2>
                         <button onClick={() => setSelectedDisease(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                      </div>
                   )}
                   {selectedDisease.image_url && <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{selectedDisease.name}</h2>}

                   <div className="space-y-6">
                      <div>
                         <h4 className="flex items-center gap-2 text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                            <FaSearch className="text-emerald-500" /> {t('symptoms_label')}
                         </h4>
                         <p className="text-gray-600 dark:text-gray-300 leading-relaxed bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                            {selectedDisease.symptoms}
                         </p>
                      </div>
                      
                      <div>
                         <h4 className="flex items-center gap-2 text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                            <FaLeaf className="text-emerald-500" /> {t('control_label')}
                         </h4>
                         <div className="bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-xl border border-emerald-100 dark:border-emerald-800">
                            <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                               {selectedDisease.control}
                            </p>
                         </div>
                      </div>

                      {selectedDisease.prevention && (
                        <div>
                           <h4 className="flex items-center gap-2 text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
                              <FaExclamationTriangle className="text-orange-500" /> Prevention Measures
                           </h4>
                           <div className="bg-orange-50 dark:bg-orange-900/20 p-5 rounded-xl border border-orange-100 dark:border-orange-800">
                              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                                 {selectedDisease.prevention}
                              </p>
                           </div>
                        </div>
                      )}
                   </div>
                   
                   <div className="mt-8 flex justify-end">
                      <button 
                        onClick={() => setSelectedDisease(null)}
                        className="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-medium transition-colors"
                      >
                         Close
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {!isLoading && !loadingUserCrops && predictions.length === 0 && !error && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <FaLeaf className="mx-auto text-4xl text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">{t('select_crop_prompt')}</p>
        </div>
      )}
    </div>
  );
}
