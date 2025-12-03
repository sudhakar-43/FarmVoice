"use client";

import { useRouter } from "next/navigation";
import { FaArrowLeft, FaChartLine } from "react-icons/fa";
import CropHealthChart from "@/components/CropHealthChart";

export default function HealthOverviewPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
          <div className="flex items-center space-x-4 mb-8">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
              <FaChartLine className="text-3xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Crop Health Overview</h1>
              <p className="text-gray-600">Detailed analysis of your crop's growth and health metrics</p>
            </div>
          </div>

          <div className="h-[500px] w-full">
            <CropHealthChart />
          </div>
          
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-6 rounded-2xl border border-green-100">
              <h3 className="font-bold text-green-800 mb-2">Growth Rate</h3>
              <p className="text-3xl font-bold text-green-600">+12%</p>
              <p className="text-sm text-green-700 mt-1">Above average for this season</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="font-bold text-blue-800 mb-2">Moisture Level</h3>
              <p className="text-3xl font-bold text-blue-600">Optimal</p>
              <p className="text-sm text-blue-700 mt-1">Soil moisture is perfect</p>
            </div>
            <div className="bg-yellow-50 p-6 rounded-2xl border border-yellow-100">
              <h3 className="font-bold text-yellow-800 mb-2">Pest Risk</h3>
              <p className="text-3xl font-bold text-yellow-600">Low</p>
              <p className="text-sm text-yellow-700 mt-1">No immediate threats detected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
