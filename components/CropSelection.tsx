"use client";

import { useState } from "react";
import { FaSearch, FaMapMarkerAlt, FaLeaf, FaCloudSun, FaTemperatureHigh, FaTint, FaWind, FaCloudRain } from "react-icons/fa";
import CropDetailsModal from "./CropDetailsModal";
import { useSettings } from "@/context/SettingsContext";

interface CropSelectionProps {
  onCropSelected: (crop: any) => void;
}

// Crop images mapping (using emoji/icon placeholders - in production use actual images)
const cropImages: { [key: string]: string } = {
  "Rice": "🌾",
  "Wheat": "🌾",
  "Tomato": "🍅",
  "Corn": "🌽",
  "Soybean": "🫘",
  "Cotton": "🌿",
  "Potato": "🥔",
  "Sugarcane": "🌾",
  "Onion": "🧅",
  "Chilli": "🌶️",
  "Groundnut": "🥜",
  "Pulses": "🫘",
  "Millets": "🌾",
};

export default function CropSelection({ onCropSelected }: CropSelectionProps) {
  const { t } = useSettings();
  const loaderStyles = `
    @keyframes orbit {
      from { transform: rotate(0deg) translateX(72px) rotate(0deg); }
      to { transform: rotate(360deg) translateX(72px) rotate(-360deg); }
    }
    @keyframes progress {
      0% { width: 0%; }
      50% { width: 100%; }
      100% { width: 0%; }
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    .animate-orbit { animation: orbit 4s linear infinite; }
    .animate-progress { animation: progress 2s ease-in-out infinite; }
    .animate-shimmer { animation: shimmer 2s infinite; }
  `;
  const [inputType, setInputType] = useState<"pincode" | "crop" | null>(null);
  const [pincode, setPincode] = useState("");
  const [cropName, setCropName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any>(null);
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  const [showCropDetails, setShowCropDetails] = useState(false);

  const handlePincodeSearch = async () => {
    if (!pincode || pincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }

    setIsLoading(true);
    setError("");
    setRecommendations([]);

    // Show loading animation
    const startTime = Date.now();

    try {
      // Check if user is authenticated
      const token = typeof window !== "undefined" ? localStorage.getItem("farmvoice_token") : null;
      
      if (!token) {
        setError("You are not logged in. Please login again.");
        setIsLoading(false);
        // Redirect to login after a short delay
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }, 2000);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/crop/recommend-by-pincode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pincode }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          setError("Your session has expired. Please login again.");
          // Clear invalid token
          if (typeof window !== "undefined") {
            localStorage.removeItem("farmvoice_token");
            localStorage.removeItem("farmvoice_user_id");
            localStorage.removeItem("farmvoice_auth");
          }
          setIsLoading(false);
          setTimeout(() => {
            if (typeof window !== "undefined") {
              window.location.href = "/";
            }
          }, 2000);
          return;
        }
        // Handle Pydantic validation errors (422) - detail can be an array
        let errorMessage = "Failed to fetch recommendations. Please try again.";
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail
              .map((err: any) => {
                const field = err.loc?.join(".") || "field";
                return `${field}: ${err.msg || "Invalid value"}`;
              })
              .join(", ");
          } else if (typeof data.detail === "string") {
            errorMessage = data.detail;
          }
        }
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (data.recommendations && data.recommendations.length > 0) {
        // Ensure minimum loading time for better UX
        const elapsed = Date.now() - startTime;
        const minLoadTime = 1500; // 1.5 seconds minimum for smooth animation
        if (elapsed < minLoadTime) {
          await new Promise((resolve) => setTimeout(resolve, minLoadTime - elapsed));
        }
        setRecommendations(data.recommendations);
        // Store location and weather data
        setLocationData({
          location: data.location,
          weather: data.weather,
          soil: data.soil,
          climate: data.climate,
          pincode: data.pincode
        });
        // Store pincode for later use
        if (data.pincode && typeof window !== "undefined") {
          localStorage.setItem("farmvoice_pincode", data.pincode);
        }
      } else {
        setError("No crop recommendations found for this pincode");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropNameSearch = async () => {
    if (!cropName.trim()) {
      setError("Please enter a crop name");
      return;
    }

    setIsLoading(true);
    setError("");
    setRecommendations([]);

    try {
      // Check if user is authenticated
      const token = typeof window !== "undefined" ? localStorage.getItem("farmvoice_token") : null;
      
      if (!token) {
        setError("You are not logged in. Please login again.");
        setIsLoading(false);
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }, 2000);
        return;
      }

      // Try to get pincode from locationData or stored value
      const requestBody: any = { crop_name: cropName };
      const storedPincode = typeof window !== "undefined" ? localStorage.getItem("farmvoice_pincode") : null;
      const pincodeToUse = locationData?.pincode || storedPincode;
      
      if (pincodeToUse) {
        requestBody.pincode = pincodeToUse;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/crop/check-suitability`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          setError("Your session has expired. Please login again.");
          // Clear invalid token
          if (typeof window !== "undefined") {
            localStorage.removeItem("farmvoice_token");
            localStorage.removeItem("farmvoice_user_id");
            localStorage.removeItem("farmvoice_auth");
          }
          setIsLoading(false);
          setTimeout(() => {
            if (typeof window !== "undefined") {
              window.location.href = "/";
            }
          }, 2000);
          return;
        }
        // Handle Pydantic validation errors (422) - detail can be an array
        let errorMessage = "Failed to check crop suitability. Please try again.";
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail
              .map((err: any) => {
                const field = err.loc?.join(".") || "field";
                return `${field}: ${err.msg || "Invalid value"}`;
              })
              .join(", ");
          } else if (typeof data.detail === "string") {
            errorMessage = data.detail;
          }
        }
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Show crop details even if not suitable
      setSelectedCrop(data);
      setShowCropDetails(true);
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropSelect = (crop: any) => {
    setSelectedCrop(crop);
    setShowCropDetails(true);
  };

  const handleConfirmCrop = async (crop: any) => {
    try {
      // Check if user is authenticated
      const token = typeof window !== "undefined" ? localStorage.getItem("farmvoice_token") : null;
      
      if (!token) {
        setError("You are not logged in. Please login again.");
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }, 2000);
        return;
      }

      const payload = {
        ...crop,
        location: locationData ? {
          pincode: locationData.pincode,
          city: locationData.location?.city,
          district: locationData.location?.district,
          state: locationData.location?.state
        } : undefined
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/crop/select`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle authentication errors specifically
        if (response.status === 401) {
          setError("Your session has expired. Please login again.");
          // Clear invalid token
          if (typeof window !== "undefined") {
            localStorage.removeItem("farmvoice_token");
            localStorage.removeItem("farmvoice_user_id");
            localStorage.removeItem("farmvoice_auth");
          }
          setTimeout(() => {
            if (typeof window !== "undefined") {
              window.location.href = "/";
            }
          }, 2000);
          return;
        }
        // Handle Pydantic validation errors (422) - detail can be an array
        let errorMessage = "Failed to select crop. Please try again.";
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            errorMessage = data.detail
              .map((err: any) => {
                const field = err.loc?.join(".") || "field";
                return `${field}: ${err.msg || "Invalid value"}`;
              })
              .join(", ");
          } else if (typeof data.detail === "string") {
            errorMessage = data.detail;
          }
        }
        setError(errorMessage);
        return;
      }

      onCropSelected(crop);
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    }
  };

  if (showCropDetails && selectedCrop) {
    return (
      <CropDetailsModal
        crop={selectedCrop}
        onClose={() => {
          setShowCropDetails(false);
          setSelectedCrop(null);
        }}
        onConfirm={handleConfirmCrop}
        onRecommendCrop={() => {
          setShowCropDetails(false);
          setSelectedCrop(null);
          setInputType("pincode");
        }}
      />
    );
  }

  if (!inputType) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-8 md:p-12 transition-colors duration-300">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('crop_selection_title')}</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">{t('crop_selection_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pincode Option */}
            <button
              onClick={() => setInputType("pincode")}
              className="group bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 p-8 text-left hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FaMapMarkerAlt className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {t('search_by_pincode')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                  Enter your pincode to get AI-powered crop recommendations based on your location's soil type, climate, and weather conditions.
                </p>
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>{t('continue')}</span>
                  <span className="ml-2">→</span>
                </div>
              </div>
            </button>

            {/* Crop Name Option */}
            <button
              onClick={() => setInputType("crop")}
              className="group bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-8 text-left hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-600 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                  <FaLeaf className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t('search_by_crop_name')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                  Check if a specific crop is suitable for your location. Get detailed information about farming practices, disease predictions, and profit estimates.
                </p>
                <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>{t('continue')}</span>
                  <span className="ml-2">→</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-8 md:p-12 transition-colors duration-300">
        <button
          onClick={() => {
            setInputType(null);
            setPincode("");
            setCropName("");
            setRecommendations([]);
            setLocationData(null);
            setError("");
          }}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          <span className="font-medium">{t('back')}</span>
        </button>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {inputType === "pincode" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl mb-4 shadow-lg">
                <FaMapMarkerAlt className="text-white text-3xl" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('enter_pincode')}</h2>
              <p className="text-gray-600 dark:text-gray-400">We'll analyze your location and recommend the best crops for you</p>
            </div>

            <div className="flex space-x-4">
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="input-field flex-1 text-center text-2xl font-semibold tracking-widest dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="123456"
                maxLength={6}
              />
              <button
                onClick={handlePincodeSearch}
                disabled={isLoading || pincode.length !== 6}
                className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>{t('analyzing')}</span>
                  </>
                ) : (
                  <>
                    <FaSearch />
                    <span>{t('search')}</span>
                  </>
                )}
              </button>
            </div>


            {/* Loading Animation */}
            {isLoading && (
              <div className="mt-10 flex flex-col items-center justify-center py-12 animate-fade-in">
                <div className="relative mb-8">
                  <div className="w-24 h-24 border-4 border-emerald-200 dark:border-emerald-800 border-t-emerald-600 dark:border-t-emerald-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FaMapMarkerAlt className="text-emerald-600 dark:text-emerald-500 text-2xl animate-bounce" />
                  </div>
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('analyzing')}</h3>
                  <p className="text-gray-600 dark:text-gray-400">Fetching real-time data from government sources</p>
                </div>
              </div>
            )}

            {/* Location and Weather Info */}
            {locationData && !isLoading && (
              <div className="mt-10 mb-8 animate-fade-in">
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-blue-900/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 p-6 md:p-8 shadow-lg">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-16 h-16 rounded-xl flex items-center justify-center shadow-lg">
                        <FaMapMarkerAlt className="text-white text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{locationData.location?.name || `${locationData.location?.city || ''}, ${locationData.location?.state || ''}`}</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                          {locationData.location?.district && `${locationData.location.district}, `}
                          {locationData.location?.state} • Pincode: {locationData.pincode}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Weather Info Grid */}
                  {locationData.weather && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {locationData.weather.current && (
                          <>
                            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-shadow">
                              <div className="flex items-center space-x-2 mb-2">
                                <FaTemperatureHigh className="text-emerald-600 dark:text-emerald-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Temperature</span>
                              </div>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {locationData.weather.current.temperature}°C
                              </p>
                              {locationData.weather.forecast && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Range: {locationData.weather.forecast.min_temp}° - {locationData.weather.forecast.max_temp}°C
                                </p>
                              )}
                            </div>
                            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-shadow">
                              <div className="flex items-center space-x-2 mb-2">
                                <FaTint className="text-blue-600 dark:text-blue-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Humidity</span>
                              </div>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {locationData.weather.current.humidity}%
                              </p>
                              {locationData.weather.forecast?.avg_humidity_24h && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  24h avg: {locationData.weather.forecast.avg_humidity_24h}%
                                </p>
                              )}
                            </div>
                            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-shadow">
                              <div className="flex items-center space-x-2 mb-2">
                                <FaCloudRain className="text-blue-500 dark:text-blue-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Precipitation</span>
                              </div>
                              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {locationData.weather.current.precipitation}mm
                              </p>
                              {locationData.weather.forecast?.next_24h_precip_probability && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Rain chance: {locationData.weather.forecast.next_24h_precip_probability}%
                                </p>
                              )}
                            </div>
                            <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800 hover:shadow-lg transition-shadow">
                              <div className="flex items-center space-x-2 mb-2">
                                <FaCloudSun className="text-yellow-600 dark:text-yellow-400" />
                                <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Condition</span>
                              </div>
                              <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                {locationData.weather.current.condition || 'Moderate'}
                              </p>
                              {locationData.weather.season && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Season: {locationData.weather.season}
                                </p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Data Freshness Indicator */}
                      {locationData.weather.last_updated && (
                        <div className="flex items-center justify-end space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Real-time data • Updated just now</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Soil and Climate Info */}
                  <div className="mt-6 flex flex-wrap gap-4">
                    {locationData.soil && (
                      <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg px-4 py-2 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Soil Type: </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{locationData.soil.type || 'Unknown'}</span>
                      </div>
                    )}
                    {locationData.climate && (
                      <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg px-4 py-2 border border-emerald-200 dark:border-emerald-800">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Climate: </span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{locationData.climate}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Crop Recommendations Grid */}
            {recommendations.length > 0 && !isLoading && (
              <div className="mt-8 animate-fade-in">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                  <FaLeaf className="text-emerald-600 dark:text-emerald-500 mr-3" />
                  {t('recommended_crops')}
                  <span className="ml-3 text-lg font-normal text-gray-500 dark:text-gray-400">({recommendations.length} crops)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {recommendations.map((crop, index) => (
                    <div
                      key={index}
                      className="group bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-6 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative overflow-hidden"
                    >
                      {/* Animated background gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative z-10">
                        {/* Crop Image/Icon */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="text-6xl transform group-hover:scale-110 transition-transform duration-300">
                            {cropImages[crop.name] || "🌱"}
                          </div>
                          <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full text-xs font-bold">
                            #{index + 1}
                          </div>
                        </div>

                        {/* Crop Name */}
                        <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {crop.name}
                        </h4>

                        {/* Suitability Score */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400">{t('suitability')}</span>
                            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{crop.suitability_score || 75}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${crop.suitability_score || 75}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                          {crop.description || "High-value crop with good market potential."}
                        </p>

                        {/* Select Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCropSelect(crop);
                          }}
                          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                          <span>{t('select_crop')}</span>
                          <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                      </div>

                      {/* Shine effect on hover */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {inputType === "crop" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mb-4 shadow-lg">
                <FaLeaf className="text-white text-3xl" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('enter_crop_name')}</h2>
              <p className="text-gray-600 dark:text-gray-400">Check if this crop is suitable for your location</p>
            </div>

            <div className="flex space-x-4">
              <input
                type="text"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="input-field flex-1 text-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="e.g., Rice, Wheat, Tomato, etc."
              />
              <button
                onClick={handleCropNameSearch}
                disabled={isLoading || !cropName.trim()}
                className="btn-primary px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>{t('checking')}</span>
                  </>
                ) : (
                  <>
                    <FaSearch />
                    <span>{t('search')}</span>
                  </>
                )}
              </button>
            </div>

            {isLoading && (
              <div className="mt-10 flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-pulse text-blue-600 text-2xl">⏳</div>
                  </div>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Checking crop suitability...</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">Analyzing location, soil, and climate conditions</p>
              </div>
            )}
          </div>
        )}
      </div>
      <style jsx>{loaderStyles}</style>
    </div>
  );
}

