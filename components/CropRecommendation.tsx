"use client";

import { useState } from "react";
import { FaLeaf, FaSearch, FaMapMarkerAlt, FaThermometerHalf, FaCloudSun, FaSeedling } from "react-icons/fa";
import { apiClient } from "@/lib/api";
import CropDashboard from "./CropDashboard";

export default function CropRecommendation() {
  const [step, setStep] = useState(1); // 1: Pincode, 2: Loading, 3: Results
  const [pincode, setPincode] = useState("");
  
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<any>(null);

  const handlePincodeSearch = async () => {
    if (!pincode || pincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }

    setStep(2);
    setError("");

    try {
      const response = await apiClient.getCropRecommendationsByPincode(pincode);
      
      if (response.error) {
        setError(typeof response.error === "string" ? response.error : String(response.error));
        setStep(1);
        return;
      }

      if (response.data) {
        setData(response.data);
        setStep(3);
      }
    } catch (err) {
      setError("Failed to fetch data. Please try again.");
      setStep(1);
    }
  };

  const handleReset = () => {
    setStep(1);
    setData(null);
    setPincode("");
  };

  if (selectedCrop) {
    return <CropDashboard crop={selectedCrop} onBack={() => setSelectedCrop(null)} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Smart Crop Advisor</h2>
        <p className="text-gray-600">AI-powered recommendations based on your local soil & weather</p>
      </div>

      {/* Main Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden min-h-[400px] transition-all duration-500">
        
        {/* Step 1: Pincode Input */}
        {step === 1 && (
          <div className="p-10 flex flex-col items-center justify-center h-full space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="bg-emerald-100 p-6 rounded-full shadow-inner">
              <FaMapMarkerAlt className="text-emerald-600 text-4xl" />
            </div>
            
            <div className="w-full max-w-md space-y-4">
              <label className="block text-sm font-semibold text-gray-700 text-center">
                Enter your area Pincode to get started
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => {
                    if (e.target.value.length <= 6 && /^\d*$/.test(e.target.value)) {
                      setPincode(e.target.value);
                      setError("");
                    }
                  }}
                  placeholder="Ex: 500001"
                  className="w-full px-6 py-4 text-center text-2xl tracking-widest font-bold border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all placeholder-gray-300 text-gray-800"
                />
              </div>
              
              {error && (
                <p className="text-red-500 text-sm text-center font-medium animate-pulse">{error}</p>
              )}

              <button
                onClick={handlePincodeSearch}
                disabled={!pincode || pincode.length !== 6}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <FaSearch />
                <span>Find Suitable Crops</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Loading Analysis */}
        {step === 2 && (
          <div className="p-20 flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in duration-500">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
              <FaLeaf className="absolute inset-0 m-auto text-emerald-500 text-2xl animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-800">Analyzing Local Conditions...</h3>
              <p className="text-gray-500 text-sm">Checking soil data, weather patterns, and climate compatibility</p>
            </div>
          </div>
        )}

        {/* Step 3: Results Dashboard */}
        {step === 3 && data && (
          <div className="animate-in slide-in-from-bottom-10 duration-500">
            {/* Location Header */}
            <div className="bg-emerald-50/50 border-b border-emerald-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-white p-3 rounded-full shadow-sm text-emerald-600">
                  <FaMapMarkerAlt className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{data.location.display_name}</h3>
                  <p className="text-sm text-gray-500">Pincode: {data.pincode}</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-emerald-100/50">
                   <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                   <div className="text-xs">
                      <span className="block text-gray-400 font-semibold uppercase tracking-wider">Soil</span>
                      <span className="font-semibold text-gray-800 capitalize">{data.soil.type || "Unknown"}</span>
                   </div>
                </div>
                <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-emerald-100/50">
                   <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                   <div className="text-xs">
                      <span className="block text-gray-400 font-semibold uppercase tracking-wider">Climate</span>
                      <span className="font-semibold text-gray-800 capitalize">{data.climate || "Unknown"}</span>
                   </div>
                </div>
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800 underline decoration-2 underline-offset-2"
                >
                  Change Location
                </button>
              </div>
            </div>

            {/* Recommendations Grid */}
            <div className="p-8 bg-gray-50/50 min-h-[500px]">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FaSeedling className="text-emerald-600" />
                    <span>Top Recommendations</span>
                 </h3>
                 <span className="text-xs font-medium px-2 py-1 bg-gray-200 rounded text-gray-600">
                    Source: {data.data_source}
                 </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {data.recommendations.map((crop: any, index: number) => (
                  <div
                    key={index}
                    onClick={() => setSelectedCrop(crop)}
                    className="group bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-500/30 hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden"
                  >
                    {/* Suitability Badge */}
                    <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl shadow-sm z-10">
                      {crop.suitability}% Match
                    </div>

                    <div className="flex gap-5">
                      {/* Image */}
                      <div className="w-24 h-24 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100 group-hover:border-emerald-200 transition-colors">
                        {crop.image_url ? (
                          <img 
                            src={crop.image_url} 
                            alt={crop.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <FaLeaf className="text-3xl" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">{crop.name}</h4>
                          {index === 0 && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Top Pick</span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3 h-10">{crop.description}</p>
                        
                        <div className="flex flex-wrap gap-2">
                          {crop.benefits.slice(0, 2).map((benefit: string, i: number) => (
                            <span key={i} className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-100/50">
                              {benefit}
                            </span>
                          ))}
                          {crop.benefits.length > 2 && (
                             <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded">+{crop.benefits.length - 2} more</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Arrow */}
                      <div className="flex items-center justify-center w-8 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                         <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                            ➔
                         </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {data.recommendations.length === 0 && (
                 <div className="text-center py-20 text-gray-500">
                    <p>No crops found for this specific combination.</p>
                 </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
