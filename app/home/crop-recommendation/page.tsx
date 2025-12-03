"use client";

import { useRouter } from "next/navigation";
import { FaArrowLeft, FaSeedling } from "react-icons/fa";
import CropRecommendation from "@/components/CropRecommendation";

export default function CropRecommendationPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Standard Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
                aria-label="Go back"
              >
                <FaArrowLeft />
              </button>
              <div
                onClick={() => router.push("/home")}
                className="flex items-center space-x-2 cursor-pointer group"
              >
                <div className="bg-emerald-600 p-1.5 rounded-lg group-hover:bg-emerald-700 transition-colors">
                  <FaSeedling className="text-white text-lg" />
                </div>
                <span className="font-bold text-gray-900 text-lg group-hover:text-emerald-700 transition-colors">
                  FarmVoice
                </span>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-500">
              Crop Recommendation
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <CropRecommendation />
      </main>
    </div>
  );
}
