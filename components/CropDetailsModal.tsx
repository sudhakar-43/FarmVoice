"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaCheckCircle, FaExclamationTriangle, FaCalendarAlt, FaBug, FaLeaf, FaMapMarkerAlt, FaTemperatureHigh, FaTint, FaCloudRain, FaCloudSun, FaArrowUp } from "react-icons/fa";
import { apiClient } from "@/lib/api";

interface CropDetailsModalProps {
  crop: any;
  onClose: () => void;
  onConfirm: (crop: any) => void;
  onRecommendCrop?: () => void;
}

export default function CropDetailsModal({ crop, onClose, onConfirm, onRecommendCrop }: CropDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "farming" | "disease">("overview");
  const [locationData, setLocationData] = useState<any>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  useEffect(() => {
    // Fetch location data if available
    if (crop.location_data) {
      // If location_data is already an object with location, weather, etc.
      if (crop.location_data.location || crop.location_data.weather) {
        setLocationData(crop.location_data);
      } else {
        // If it's the old format, restructure it
        setLocationData({
          location: {
            name: crop.location_data.display_name || `${crop.location_data.city || ''}, ${crop.location_data.state || ''}`,
            state: crop.location_data.state,
            district: crop.location_data.district,
            city: crop.location_data.city
          },
          weather: crop.location_data.weather,
          soil: { type: crop.location_data.soil_type },
          climate: crop.location_data.climate,
          pincode: crop.pincode || crop.location_data.pincode
        });
      }
    } else if (crop.pincode) {
      fetchLocationData(crop.pincode);
    } else if (typeof window !== "undefined") {
      // Try to get pincode from farmer profile
      const storedPincode = localStorage.getItem("farmvoice_pincode");
      if (storedPincode) {
        fetchLocationData(storedPincode);
      }
    }
  }, [crop]);

  const fetchLocationData = async (pincode: string) => {
    setIsLoadingLocation(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("farmvoice_token") : null;
      if (token) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/location/pincode/${pincode}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setLocationData(data);
        }
      }
    } catch (error) {
      console.error("Error fetching location data:", error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleGetRecommendations = async () => {
    setShowRecommendations(true);
    setIsLoadingRecommendations(true);
    
    // Slide up animation delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Fetch recommendations
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("farmvoice_token") : null;
      const pincode = locationData?.pincode || crop.pincode || (typeof window !== "undefined" ? localStorage.getItem("farmvoice_pincode") : null);
      
      if (token && pincode) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/crop/recommend-by-pincode`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ pincode })
        });
        
        if (response.ok) {
          const data = await response.json();
          setRecommendations(data.recommendations || []);
        } else {
          setRecommendations([]);
        }
      } else {
        // If no pincode, call onRecommendCrop to go back to pincode search
        if (onRecommendCrop) {
          onRecommendCrop();
        }
        setShowRecommendations(false);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecommendations([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  const handleCropSelect = (selectedCrop: any) => {
    onConfirm(selectedCrop);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden relative flex flex-col border border-gray-200 dark:border-gray-700">
        {/* Professional Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 flex items-center justify-between z-10 shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="bg-white w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg border-2 border-white/50">
              <span className="text-4xl">
                {(() => {
                  const rawName = crop.name || crop.original_name || crop.crop_name || "";
                  const cropName = rawName.toLowerCase().trim();
                  
                  // Find matching emoji using includes (partial match)
                  const cropEmojiList: [string, string][] = [
                    ["tomato", "🍅"],
                    ["rice", "🌾"],
                    ["wheat", "🌾"],
                    ["potato", "🥔"],
                    ["onion", "🧅"],
                    ["maize", "🌽"],
                    ["corn", "🌽"],
                    ["cotton", "☁️"],
                    ["sugarcane", "🎋"],
                    ["banana", "🍌"],
                    ["mango", "🥭"],
                    ["apple", "🍎"],
                    ["orange", "🍊"],
                    ["grape", "🍇"],
                    ["carrot", "🥕"],
                    ["cabbage", "🥬"],
                    ["pepper", "🌶️"],
                    ["chili", "🌶️"],
                    ["cucumber", "🥒"],
                    ["brinjal", "🍆"],
                    ["eggplant", "🍆"],
                    ["pumpkin", "🎃"],
                    ["spinach", "🥬"],
                    ["groundnut", "🥜"],
                    ["peanut", "🥜"],
                    ["soybean", "🫘"],
                    ["coconut", "🥥"],
                    ["watermelon", "🍉"],
                    ["lemon", "🍋"],
                    ["pineapple", "🍍"],
                    ["strawberry", "🍓"],
                    ["garlic", "🧄"],
                    ["ginger", "🫚"],
                    ["mushroom", "🍄"],
                    ["pea", "🫛"],
                    ["cherry", "🍒"],
                    ["peach", "🍑"],
                    ["pear", "🍐"],
                    ["papaya", "🥭"],
                    ["broccoli", "🥦"],
                    ["lettuce", "🥬"],
                    ["bean", "🫘"],
                    ["coffee", "☕"],
                    ["tea", "🍵"],
                    ["sunflower", "🌻"],
                    ["mustard", "🌼"],
                  ];
                  
                  for (const [keyword, emoji] of cropEmojiList) {
                    if (cropName.includes(keyword)) {
                      return emoji;
                    }
                  }
                  return "🌱"; // Default seedling
                })()}
              </span>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                {crop.name || crop.original_name || crop.crop_name || crop.title || "Crop Details"}
              </h2>
              <div className="flex items-center space-x-3 mt-2">
                {crop.suitability_score !== undefined && (
                  <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-md ${
                    crop.is_suitable !== false
                      ? "bg-white text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {crop.is_suitable !== false ? `✓ ${crop.suitability_score}% Suitable` : "✗ Not Suitable"}
                  </span>
                )}
                {crop.category && (
                  <span className="px-3 py-1 bg-white/20 text-white rounded-full text-xs font-medium">
                    {crop.category}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200 group"
            aria-label="Close modal"
          >
            <FaTimes className="text-white text-xl group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Location and Weather Info */}
        {locationData && (
          <div className="bg-gradient-to-r from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-10 h-10 rounded-xl flex items-center justify-center shadow-md">
                  <FaMapMarkerAlt className="text-white text-lg" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {/* Check nested location object first, then flat structure */}
                    {locationData.location?.name || 
                     locationData.location?.display_name ||
                     locationData.display_name ||
                     locationData.location?.city || 
                     locationData.city ||
                     locationData.location?.district ||
                     locationData.district ||
                     locationData.location?.state ||
                     locationData.state ||
                     `Pincode ${locationData.pincode || crop.pincode}`}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {[
                      locationData.location?.district || locationData.district, 
                      locationData.location?.state || locationData.state
                    ].filter(Boolean).join(", ") || "India"} 
                    {(locationData.pincode || crop.pincode) && ` • ${locationData.pincode || crop.pincode}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Weather Info Grid */}
            {locationData.weather && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {locationData.weather.current && (
                  <>
                    <div className="bg-white rounded-xl p-4 border border-emerald-200 hover:shadow-lg transition-shadow">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaTemperatureHigh className="text-emerald-600" />
                        <span className="text-xs text-gray-600 font-medium">Temperature</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {locationData.weather.current.temperature}°C
                      </p>
                      {locationData.weather.forecast && (
                        <p className="text-xs text-gray-500 mt-1">
                          Range: {locationData.weather.forecast.min_temp}° - {locationData.weather.forecast.max_temp}°C
                        </p>
                      )}
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-emerald-200 hover:shadow-lg transition-shadow">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaTint className="text-blue-600" />
                        <span className="text-xs text-gray-600 font-medium">Humidity</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {locationData.weather.current.humidity}%
                      </p>
                      {locationData.weather.forecast?.avg_humidity_24h && (
                        <p className="text-xs text-gray-500 mt-1">
                          24h avg: {locationData.weather.forecast.avg_humidity_24h}%
                        </p>
                      )}
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-emerald-200 hover:shadow-lg transition-shadow">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaCloudRain className="text-blue-500" />
                        <span className="text-xs text-gray-600 font-medium">Precipitation</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {locationData.weather.current.precipitation}mm
                      </p>
                      {locationData.weather.forecast?.next_24h_precip_probability && (
                        <p className="text-xs text-gray-500 mt-1">
                          Rain chance: {locationData.weather.forecast.next_24h_precip_probability}%
                        </p>
                      )}
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-emerald-200 hover:shadow-lg transition-shadow">
                      <div className="flex items-center space-x-2 mb-2">
                        <FaCloudSun className="text-yellow-600" />
                        <span className="text-xs text-gray-600 font-medium">Condition</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 truncate">
                        {locationData.weather.current.condition || 'Moderate'}
                      </p>
                      {locationData.weather.season && (
                        <p className="text-xs text-gray-500 mt-1">
                          Season: {locationData.weather.season}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Soil and Climate Info */}
            <div className="flex flex-wrap gap-4">
              {locationData.soil && (
                <div className="bg-white rounded-lg px-4 py-2 border border-emerald-200">
                  <span className="text-xs text-gray-600">Soil Type: </span>
                  <span className="text-sm font-semibold text-gray-900 capitalize">{locationData.soil.type || 'Unknown'}</span>
                </div>
              )}
              {locationData.climate && (
                <div className="bg-white rounded-lg px-4 py-2 border border-emerald-200">
                  <span className="text-xs text-gray-600">Climate: </span>
                  <span className="text-sm font-semibold text-gray-900 capitalize">{locationData.climate}</span>
                </div>
              )}
              {locationData.weather?.last_updated && (
                <div className="bg-white rounded-lg px-4 py-2 border border-emerald-200 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-600">Real-time data</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 bg-white">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: FaLeaf },
              { id: "farming", label: "Farming Guide", icon: FaCalendarAlt },
              { id: "disease", label: "Disease Prediction", icon: FaBug },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 border-b-3 font-semibold transition-all ${
                    activeTab === tab.id
                      ? "border-emerald-600 text-emerald-600 bg-emerald-50"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Icon />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {crop.description && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 leading-relaxed">{crop.description}</p>
                </div>
              )}

              {crop.benefits && crop.benefits.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Key Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {crop.benefits.map((benefit: string, i: number) => (
                      <div key={i} className="flex items-center space-x-3 p-3 bg-emerald-50 rounded-lg">
                        <FaCheckCircle className="text-emerald-600 flex-shrink-0" />
                        <span className="text-gray-700 font-medium">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {crop.is_suitable === false && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                  <div className="flex items-start space-x-4">
                    <FaExclamationTriangle className="text-red-600 text-2xl flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-red-900 text-lg mb-2">Crop Not Suitable</h4>
                      <p className="text-red-700 mb-3">
                        This crop may not be ideal for your location based on soil type, climate, and weather conditions.
                      </p>
                      {crop.reasons && crop.reasons.length > 0 && (
                        <ul className="list-disc list-inside text-red-700 space-y-1">
                          {crop.reasons.map((reason: string, i: number) => (
                            <li key={i}>{reason}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "farming" && (
            <div className="space-y-6">
              {crop.farming_guide ? (
                <div className="bg-white rounded-xl p-6 shadow-sm space-y-6">
                  {crop.farming_guide.season && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center space-x-2">
                        <FaCalendarAlt className="text-emerald-600" />
                        <span>Best Season</span>
                      </h3>
                      <p className="text-gray-700 bg-emerald-50 p-4 rounded-lg font-medium">{crop.farming_guide.season}</p>
                    </div>
                  )}

                  {crop.farming_guide.planting && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Planting Instructions</h3>
                      <div className="space-y-3">
                        {crop.farming_guide.planting.map((step: string, i: number) => (
                          <div key={i} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-colors">
                            <span className="bg-emerald-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-gray-700 flex-1 pt-1">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {crop.farming_guide.watering && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center space-x-2">
                        <FaTint className="text-blue-600" />
                        <span>Watering Schedule</span>
                      </h3>
                      <p className="text-gray-700 bg-blue-50 p-4 rounded-lg">{crop.farming_guide.watering}</p>
                    </div>
                  )}

                  {crop.farming_guide.fertilizer && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Fertilizer Requirements</h3>
                      <p className="text-gray-700 bg-yellow-50 p-4 rounded-lg">{crop.farming_guide.fertilizer}</p>
                    </div>
                  )}

                  {crop.farming_guide.harvesting && (
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">Harvesting</h3>
                      <p className="text-gray-700 bg-green-50 p-4 rounded-lg">{crop.farming_guide.harvesting}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center">
                  <p className="text-gray-500">Farming guide details coming soon...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "disease" && (
            <div className="space-y-6">
              {crop.disease_predictions && crop.disease_predictions.length > 0 ? (
                <div className="space-y-4">
                  {crop.disease_predictions.map((disease: any, i: number) => (
                    <div key={i} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-bold text-gray-900 text-lg">{disease.name}</h4>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                          disease.severity === "High" ? "bg-red-100 text-red-700" :
                          disease.severity === "Medium" ? "bg-yellow-100 text-yellow-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {disease.severity} Risk
                        </span>
                      </div>
                      <p className="text-gray-700 mb-4">{disease.description}</p>
                      {Array.isArray(disease.prevention) && disease.prevention.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-gray-900 mb-2">Prevention Measures:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {disease.prevention.map((item: string, j: number) => (
                              <div key={j} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                                <FaCheckCircle className="text-emerald-600 text-sm flex-shrink-0" />
                                <span className="text-sm text-gray-700">{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center">
                  <p className="text-gray-500">Disease prediction data coming soon...</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recommendations Slide-up Panel */}
        {showRecommendations && (
          <div className="absolute inset-0 bg-white rounded-3xl z-20 animate-slide-up overflow-hidden">
            <div className="h-full flex flex-col">
              <div className="p-6 border-b-2 border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Recommended Crops for Your Location</h3>
                  <p className="text-sm text-gray-600 mt-1">Based on real-time weather, soil, and climate data</p>
                </div>
                <button onClick={() => setShowRecommendations(false)} className="p-2 hover:bg-white/50 rounded-lg transition-colors">
                  <FaTimes className="text-gray-600 text-xl" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                {isLoadingRecommendations ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative mb-6">
                      <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-600 border-t-transparent"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FaLeaf className="text-emerald-600 text-2xl animate-pulse" />
                      </div>
                    </div>
                    <p className="text-gray-600 font-medium">Loading recommendations...</p>
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          handleCropSelect(rec);
                          setShowRecommendations(false);
                        }}
                        className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-emerald-500 hover:shadow-2xl transition-all cursor-pointer transform hover:-translate-y-1"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                            #{idx + 1}
                          </div>
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-bold">
                            {rec.suitability_score || 75}%
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">{rec.name}</h4>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{rec.description}</p>
                        <button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-2.5 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md hover:shadow-lg">
                          Select This Crop
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <FaLeaf className="text-gray-400 text-5xl mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No recommendations available</p>
                    <button 
                      onClick={() => setShowRecommendations(false)}
                      className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Go Back
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 p-6 flex items-center justify-between">
          <div>
            {crop.is_suitable === false && onRecommendCrop && (
              <button
                onClick={handleGetRecommendations}
                className="btn-secondary flex items-center space-x-2 hover:bg-emerald-50 hover:border-emerald-300"
              >
                <FaArrowUp />
                <span>Get Better Recommendations</span>
              </button>
            )}
          </div>
          <div className="flex space-x-4">
            <button onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button onClick={() => onConfirm(crop)} className="btn-primary flex items-center space-x-2">
              <FaCheckCircle />
              <span>Select This Crop</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
