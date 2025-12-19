"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaLandmark, FaExternalLinkAlt, FaCheckCircle, FaRupeeSign, FaShieldAlt, FaLeaf, FaCreditCard, FaStore } from "react-icons/fa";
import { motion } from "framer-motion";
import { useSettings } from "@/context/SettingsContext";
import { apiClient } from "@/lib/api";

interface Scheme {
  id: string;
  name: string;
  ministry: string;
  description: string;
  benefits: string[];
  eligibility: string[];
  apply_link: string;
  status: string;
  color: string;
  icon: string;
}

export default function GovtSchemesPage() {
  const router = useRouter();
  const { theme } = useSettings();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      const response = await apiClient.request<any>('/api/govt-schemes');
      if (response.data) {
        setSchemes(response.data.schemes);
      }
    } catch (error) {
      console.error("Error fetching schemes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (icon: string) => {
    const icons: Record<string, React.ReactNode> = {
      money: <FaRupeeSign />,
      shield: <FaShieldAlt />,
      soil: <FaLeaf />,
      "credit-card": <FaCreditCard />,
      market: <FaStore />,
      leaf: <FaLeaf />,
    };
    return icons[icon] || <FaLandmark />;
  };

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      green: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
      blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      brown: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      purple: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      orange: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
      teal: "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800",
    };
    return colors[color] || colors.green;
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
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FaLandmark className="text-blue-600 dark:text-blue-400 text-xl" />
            </div>
            <h1 className="text-2xl font-bold">Government Schemes</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
        >
          <h2 className="text-2xl font-bold mb-2">💰 Financial Support for Farmers</h2>
          <p className="opacity-90">Explore government schemes and subsidies you may be eligible for. Get direct benefits and support for your farming activities.</p>
        </motion.div>

        {/* Schemes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme, index) => (
            <motion.div
              key={scheme.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5, scale: 1.02 }}
              onClick={() => setSelectedScheme(selectedScheme?.id === scheme.id ? null : scheme)}
              className={`rounded-3xl border p-6 cursor-pointer hover:shadow-xl transition-all ${
                theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${getColorClass(scheme.color)}`}>
                  <span className="text-2xl">{getIcon(scheme.icon)}</span>
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-bold rounded-full">
                  {scheme.status}
                </span>
              </div>

              <h3 className="text-lg font-bold mb-2">{scheme.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{scheme.description}</p>

              {selectedScheme?.id === scheme.id && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                >
                  <div className="mb-4">
                    <h4 className="font-bold text-sm mb-2 text-green-600">✨ Benefits</h4>
                    <ul className="space-y-1">
                      {scheme.benefits.map((benefit, i) => (
                        <li key={i} className="text-sm flex items-start">
                          <FaCheckCircle className="text-green-500 mr-2 mt-1 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-bold text-sm mb-2 text-blue-600">📋 Eligibility</h4>
                    <ul className="space-y-1">
                      {scheme.eligibility.map((item, i) => (
                        <li key={i} className="text-sm text-gray-600 dark:text-gray-400">• {item}</li>
                      ))}
                    </ul>
                  </div>

                  <a 
                    href={scheme.apply_link}
                    target="_blank"
                    className="block w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-center font-bold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all"
                  >
                    Apply Now <FaExternalLinkAlt className="inline ml-2" />
                  </a>
                </motion.div>
              )}

              {selectedScheme?.id !== scheme.id && (
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Click to view details →</p>
              )}
            </motion.div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading schemes...</p>
          </div>
        )}
      </main>
    </div>
  );
}
