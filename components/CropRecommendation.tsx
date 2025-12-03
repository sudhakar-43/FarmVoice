"use client";

import { useState } from "react";
import { FaLeaf, FaSearch } from "react-icons/fa";
import { apiClient } from "@/lib/api";
import CropDashboard from "./CropDashboard";

export default function CropRecommendation() {
  const [soilType, setSoilType] = useState("");
  const [climate, setClimate] = useState("");
  const [season, setSeason] = useState("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCrop, setSelectedCrop] = useState<any>(null);

  const handleRecommend = async () => {
    if (!soilType || !climate || !season) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await apiClient.getCropRecommendations(soilType, climate, season);
      
      if (response.error) {
        // Ensure error is a string
        setError(typeof response.error === "string" ? response.error : String(response.error));
        setIsLoading(false);
        return;
      }

      if (response.data) {
        setRecommendations(response.data);
      }
    } catch (err) {
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (selectedCrop) {
    return <CropDashboard crop={selectedCrop} onBack={() => setSelectedCrop(null)} />;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-emerald-100 p-3 rounded-lg">
            <FaLeaf className="text-emerald-600 text-2xl" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Crop Recommendation</h2>
            <p className="text-sm text-gray-600">AI-powered crop suggestions</p>
          </div>
        </div>

        <p className="text-gray-600 mb-8">
          Get AI-powered crop recommendations based on your soil type, climate, and season.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Soil Type
            </label>
            <select
              value={soilType}
              onChange={(e) => setSoilType(e.target.value)}
              className="input-field"
            >
              <option value="">Select soil type</option>
              <option value="clay">Clay</option>
              <option value="sandy">Sandy</option>
              <option value="loamy">Loamy</option>
              <option value="silt">Silt</option>
              <option value="peat">Peat</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Climate
            </label>
            <select
              value={climate}
              onChange={(e) => setClimate(e.target.value)}
              className="input-field"
            >
              <option value="">Select climate</option>
              <option value="tropical">Tropical</option>
              <option value="subtropical">Subtropical</option>
              <option value="temperate">Temperate</option>
              <option value="arid">Arid</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Season
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="input-field"
            >
              <option value="">Select season</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="monsoon">Monsoon</option>
              <option value="winter">Winter</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleRecommend}
          disabled={isLoading}
          className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <FaSearch />
              <span>Get Recommendations</span>
            </>
          )}
        </button>

        {recommendations.length > 0 && (
          <div className="mt-10 space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Recommended Crops</h3>
            {recommendations.map((crop, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-6 hover:border-emerald-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-xl font-semibold text-gray-900">{crop.name}</h4>
                  <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                    {crop.suitability}% Match
                  </div>
                </div>
                <p className="text-gray-600 mb-5 leading-relaxed">{crop.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-3">Key Benefits:</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {crop.benefits.map((benefit: string, i: number) => (
                        <li key={i} className="flex items-center space-x-2 text-gray-700 text-sm">
                          <span className="text-emerald-600 font-bold">✓</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => setSelectedCrop(crop)}
                    className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap ml-4"
                  >
                    View Dashboard
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
