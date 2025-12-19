"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaStore, FaMapMarkerAlt, FaPhone, FaClock, FaStar, FaTruck } from "react-icons/fa";
import { motion } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import { apiClient } from "@/lib/api";

interface Mandi {
  id: string;
  name: string;
  type: string;
  distance_km: number;
  address: string;
  phone: string;
  timing: string;
  commodities: string[];
  today_arrivals: number;
  rating: number;
}

export default function NearbyMandisPage() {
  const router = useRouter();
  const { theme } = useSettings();
  const [mandis, setMandis] = useState<Mandi[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMandi, setSelectedMandi] = useState<Mandi | null>(null);

  useEffect(() => {
    fetchMandis();
  }, []);

  const fetchMandis = async () => {
    try {
      const response = await apiClient.request<any>('/api/nearby-mandis');
      if (response.data) {
        setMandis(response.data.mandis);
      }
    } catch (error) {
      console.error("Error fetching mandis:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 border-b shadow-sm ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button onClick={() => router.push('/home')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full mr-4">
            <FaArrowLeft />
          </button>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <FaStore className="text-orange-600 dark:text-orange-400 text-xl" />
            </div>
            <h1 className="text-2xl font-bold">Nearby Mandis</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-6 mb-8 bg-gradient-to-r from-orange-500 to-amber-500 text-white`}
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-extrabold">{mandis.length}</p>
              <p className="text-sm opacity-90">Mandis Found</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold">{mandis.length > 0 ? mandis[0].distance_km : 0} km</p>
              <p className="text-sm opacity-90">Nearest</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold">{mandis.reduce((acc, m) => acc + m.today_arrivals, 0)}</p>
              <p className="text-sm opacity-90">Today's Arrivals</p>
            </div>
          </div>
        </motion.div>

        {/* Mandis List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mandis.map((mandi, index) => (
            <motion.div
              key={mandi.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => setSelectedMandi(mandi)}
              className={`rounded-3xl border p-6 cursor-pointer hover:shadow-xl transition-all ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } ${selectedMandi?.id === mandi.id ? 'ring-2 ring-orange-500' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{mandi.name}</h3>
                  <p className="text-sm text-orange-600 dark:text-orange-400">{mandi.type}</p>
                </div>
                <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                  <FaStar className="text-yellow-500 text-sm" />
                  <span className="text-sm font-bold">{mandi.rating}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FaMapMarkerAlt className="mr-2 text-red-500" />
                  <span>{mandi.distance_km} km away</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FaClock className="mr-2 text-blue-500" />
                  <span>{mandi.timing}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <FaTruck className="mr-2 text-green-500" />
                  <span>{mandi.today_arrivals} arrivals today</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {mandi.commodities.map(commodity => (
                  <span key={commodity} className={`px-3 py-1 rounded-full text-xs font-medium ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {commodity}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <a 
                  href={`tel:${mandi.phone}`}
                  className="flex-1 py-2 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl text-center font-medium hover:bg-green-200 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaPhone className="inline mr-2" />Call
                </a>
                <a 
                  href={`https://maps.google.com/?q=${encodeURIComponent(mandi.address)}`}
                  target="_blank"
                  className="flex-1 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-center font-medium hover:bg-blue-200 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <FaMapMarkerAlt className="inline mr-2" />Directions
                </a>
              </div>
            </motion.div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Finding nearby mandis...</p>
          </div>
        )}
      </main>
    </div>
  );
}
