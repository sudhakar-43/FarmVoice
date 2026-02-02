"use client";

import { useState } from "react";
import { FaSearch, FaMapMarkerAlt, FaLeaf, FaCloudSun, FaTemperatureHigh, FaTint, FaWind, FaCloudRain } from "react-icons/fa";
import CropDetailsModal from "./CropDetailsModal";
import { useSettings } from "@/context/SettingsContext";

interface CropSelectionProps {
  onCropSelected: (crop: any) => void;
}

// Crop images mapping
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
  
  // Single search input state
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [locationData, setLocationData] = useState<any>(null);
  const [selectedCrop, setSelectedCrop] = useState<any>(null);
  const [showCropDetails, setShowCropDetails] = useState(false);
  const [searchType, setSearchType] = useState<"pincode" | "crop" | null>(null);

  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setError("Please enter a Pincode (6 digits) or a Crop Name");
      return;
    }

    // Smart detection logic: 6 digits = Pincode, otherwise = Crop Name
    const isPincode = /^\d{6}$/.test(searchInput.trim());
    
    if (isPincode) {
        handlePincodeSearch(searchInput.trim());
    } else {
        handleCropNameSearch(searchInput.trim());
    }
  };

  const handlePincodeSearch = async (pincode: string) => {
    setIsLoading(true);
    setError("");
    setRecommendations([]);
    setSearchType("pincode");

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

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/crop/recommend-by-pincode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pincode }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
            setError("Session expired. Please login.");
             if (typeof window !== "undefined") {
                localStorage.removeItem("farmvoice_token");
                window.location.href = "/";
            }
            setIsLoading(false);
            return;
        }
        let errorMessage = "Failed to fetch recommendations.";
        if (data.detail) {
             errorMessage = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
        }
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      if (data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations);
        setLocationData({
          location: data.location,
          weather: data.weather,
          soil: data.soil,
          climate: data.climate,
          pincode: data.pincode
        });
        if (data.pincode && typeof window !== "undefined") {
          localStorage.setItem("farmvoice_pincode", data.pincode);
        }
      } else {
        setError("No recommendations found for this location.");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCropNameSearch = async (name: string) => {
    setIsLoading(true);
    setError("");
    setRecommendations([]);
    setSearchType("crop");

    try {
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

      const requestBody: any = { crop_name: name };
      const storedPincode = typeof window !== "undefined" ? localStorage.getItem("farmvoice_pincode") : null;
      const pincodeToUse = locationData?.pincode || storedPincode;
      
      if (pincodeToUse) {
        requestBody.pincode = pincodeToUse;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/crop/check-suitability`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
         let errorMessage = "Failed to check suitability.";
         if (data.detail) {
             errorMessage = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
         }
         setError(errorMessage);
         setIsLoading(false);
         return;
      }

      setSelectedCrop(data);
      setShowCropDetails(true);
    } catch (err) {
      setError("Network error. Please check your connection.");
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
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/crop/select`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify(payload),
        });
        
        const data = await response.json();

        if (response.ok) {
            onCropSelected(crop);
        } else {
            setError(data.detail || "Failed to select crop");
        }
    } catch(e) {
        setError("Network error");
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
          setSearchInput(""); 
          setRecommendations([]);
          setSearchType(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl p-8 md:p-12 transition-all duration-300">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 mb-6 tracking-tight">
            Find Your Perfect Crop
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Enter a <span className="font-semibold text-emerald-600 dark:text-emerald-400">Pincode</span> to get AI recommendations or a <span className="font-semibold text-blue-600 dark:text-blue-400">Crop Name</span> to check suitability.
          </p>
        </div>

        {/* Unified Search Box */}
        <div className="max-w-3xl mx-auto mb-12 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-2">
                <div className="pl-6 text-gray-400">
                    <FaSearch className="text-2xl" />
                </div>
                <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full text-xl md:text-2xl font-medium text-gray-800 dark:text-white placeholder-gray-400 bg-transparent border-none focus:ring-0 px-6 py-4 outline-none"
                    placeholder="Enter Pincode (e.g. 500081) or Crop Name..."
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    className="hidden md:flex bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-4 px-10 rounded-xl transition-all duration-200 shadow-md hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed items-center space-x-2"
                >
                    {isLoading ? (
                        <>
                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                            <span>Analyzing...</span>
                        </>
                    ) : (
                        <span>Search</span>
                    )}
                </button>
            </div>
            {/* Mobile Search Button */}
             <button
                onClick={handleSearch}
                disabled={isLoading}
                className="md:hidden w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-xl shadow-lg flex justify-center items-center space-x-2"
            >
                 {isLoading ? <span>Analyzing...</span> : <span>Search</span>}
            </button>
        </div>

        {error && (
            <div className="max-w-3xl mx-auto mb-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-6 py-4 rounded-xl text-center shadow-sm animate-fade-in flex items-center justify-center space-x-2">
                <span>⚠️</span>
                <span>{error}</span>
            </div>
        )}

        {/* Results Area */}
        <div className="animate-fade-in">
             {/* Pincode Results: Location & Weather */}
             {searchType === 'pincode' && locationData && (
                 <div className="mb-12 border-t pt-8 border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col md:flex-row items-center justify-between bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl p-6 mb-8 border border-emerald-100 dark:border-emerald-800/30">
                        <div className="flex items-center space-x-4 mb-4 md:mb-0">
                             <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-sm text-emerald-600">
                                <FaMapMarkerAlt className="text-2xl" />
                             </div>
                             <div>
                                 <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                     {locationData.location?.city || locationData.location?.name}, {locationData.location?.state}
                                 </h3>
                                 <p className="text-emerald-700 dark:text-emerald-400 text-sm">
                                     Pincode: {locationData.pincode} • Soil: <span className="capitalize">{locationData.soil?.type}</span>
                                 </p>
                             </div>
                        </div>
                        {locationData.weather?.current && (
                             <div className="flex items-center space-x-6">
                                 <div className="text-center">
                                     <div className="text-2xl font-bold text-gray-900 dark:text-white">{locationData.weather.current.temperature}°C</div>
                                     <div className="text-xs text-gray-500">Temp</div>
                                 </div>
                                 <div className="text-center">
                                     <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{locationData.weather.current.humidity}%</div>
                                     <div className="text-xs text-gray-500">Humidity</div>
                                 </div>
                             </div>
                        )}
                    </div>

                    {/* Recommendations Grid */}
                    {recommendations.length > 0 && (
                        <div>
                             <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                                <span className="bg-emerald-100 dark:bg-emerald-900 p-2 rounded-lg mr-3">🌾</span>
                                Recommended Crops
                             </h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {recommendations
                                  .sort((a, b) => {
                                      const scoreA = a.suitability_score || a.suitability || 0;
                                      const scoreB = b.suitability_score || b.suitability || 0;
                                      return scoreB - scoreA;
                                  })
                                  .map((crop, index) => {
                                    const score = crop.suitability_score || crop.suitability;
                                    return (
                                    <div key={index} 
                                        onClick={() => handleCropSelect(crop)}
                                        className="group cursor-pointer bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl p-6 hover:shadow-2xl hover:border-emerald-500 dark:hover:border-emerald-500 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            {score ? `${score}% Match` : 'Recommended'}
                                        </div>
                                        <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                                            {cropImages[crop.name] || "🌱"}
                                        </div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="text-xl font-bold text-gray-800 dark:text-white">{crop.name}</h4>
                                             {/* Badge for Score if needed */}
                                        </div>
                                        
                                        <div className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-y-2 group-hover:translate-y-0 mt-4">
                                            View Details →
                                        </div>
                                    </div>
                                  )})}
                             </div>
                        </div>
                    )}
                 </div>
             )}

             {/* Loader State for better visual feedback */}
             {isLoading && (
                 <div className="flex flex-col items-center justify-center py-20 opacity-75">
                     <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                     <p className="mt-4 text-emerald-800 dark:text-emerald-300 font-medium animate-pulse">Consulting AI Agronomist...</p>
                 </div>
             )}
        </div>
      </div>
      <style jsx>{loaderStyles}</style>
    </div>
  );
}
