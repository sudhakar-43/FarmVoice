"use client";

import { useState, useEffect } from "react";
import { FaMapMarkerAlt, FaMicrophone, FaUser, FaSeedling, FaCheckCircle } from "react-icons/fa";
import { apiClient } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { t } = useSettings();
  const [step, setStep] = useState(1);
  const [locationPermission, setLocationPermission] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    locationAddress: "",
    pincode: "",
    acresOfLand: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Check existing permissions
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationPermission(true),
        () => setLocationPermission(false)
      );
    }
    // We don't check mic permission here anymore, as we only want to capture intent
  };

  const requestLocationPermission = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationPermission(true);
        setIsLoading(false);
      },
      (err) => {
        setError("Location access denied. Please enable location in your browser settings.");
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.pincode || !formData.acresOfLand) {
      setError("Please fill in all required fields");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async () => {
    setError("");
    setIsLoading(true);

    try {
      // Check if user is authenticated
      const token = typeof window !== "undefined" ? localStorage.getItem("farmvoice_token") : null;
      const userId = typeof window !== "undefined" ? localStorage.getItem("farmvoice_user_id") : null;
      
      if (!token || !userId) {
        setError("You are not logged in. Please login again.");
        setIsLoading(false);
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }, 2000);
        return;
      }

      // Use apiClient for consistent error handling
      const result = await apiClient.updateFarmerProfile({
        full_name: formData.fullName,
        phone: formData.phone,
        location_address: formData.locationAddress,
        pincode: formData.pincode,
        latitude: location?.lat,
        longitude: location?.lng,
        acres_of_land: parseFloat(formData.acresOfLand),
        location_permission: locationPermission,
        microphone_permission: false, // Default to false, will be asked later
        onboarding_completed: true,
      });

      if (result.error) {
        if (result.error === "Unauthorized" || result.error.includes("credentials")) {
          setError("Your session has expired. Please login again.");
          if (typeof window !== "undefined") {
            localStorage.removeItem("farmvoice_token");
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
        setError(result.error || "Failed to save profile. Please try again.");
        setIsLoading(false);
        return;
      }

      // Save profile data to localStorage
      localStorage.setItem("farmvoice_profile", JSON.stringify(result.data));
      localStorage.setItem("farmvoice_onboarding_completed", "true");

      onComplete();
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-6xl w-full space-y-8">
        <div className="bg-white dark:bg-gray-800 p-8 md:p-12 rounded-2xl shadow-xl overflow-hidden transition-colors duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Side: Info & Progress */}
            <div className="space-y-8">
              <div className="text-left">
                <img 
                  src="/logo.png" 
                  alt="FarmVoice Logo" 
                  className="w-20 h-20 object-contain mb-6 drop-shadow-md hover:scale-105 transition-transform duration-300" 
                />
                <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('app_name')}</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  {t('personal_details_subtitle')}
                </p>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${step >= 1 ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500/50" : "border-gray-200 dark:border-gray-700"}`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? "bg-emerald-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                      {step > 1 ? <FaCheckCircle /> : "1"}
                    </div>
                    <div>
                      <h3 className={`font-bold ${step >= 1 ? "text-emerald-900 dark:text-emerald-300" : "text-gray-500 dark:text-gray-400"}`}>{t('personal_details_title')}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Name, Location & Land info</p>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${step >= 2 ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-500/50" : "border-gray-200 dark:border-gray-700"}`}>
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? "bg-emerald-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                      {step > 2 ? <FaCheckCircle /> : "2"}
                    </div>
                    <div>
                      <h3 className={`font-bold ${step >= 2 ? "text-emerald-900 dark:text-emerald-300" : "text-gray-500 dark:text-gray-400"}`}>Permissions</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Location access</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side: Form Content */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-8 border border-gray-100 dark:border-gray-600">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6 text-sm animate-fade-in">
                  {error}
                </div>
              )}

              {step === 1 && (
                <form onSubmit={handleNextStep} className="space-y-5">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('personal_details_title')}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="md:col-span-2">
                      <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('name_label')} *</label>
                      <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="input-field dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:placeholder-gray-400"
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('phone_label')}</label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="input-field dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:placeholder-gray-400"
                        placeholder="+91..."
                      />
                    </div>

                    <div>
                      <label htmlFor="pincode" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('pincode_label')} *</label>
                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        value={formData.pincode}
                        onChange={handleInputChange}
                        className="input-field dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:placeholder-gray-400"
                        placeholder="123456"
                        required
                        maxLength={6}
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="locationAddress" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('address_label')}</label>
                      <input
                        id="locationAddress"
                        name="locationAddress"
                        type="text"
                        value={formData.locationAddress}
                        onChange={handleInputChange}
                        className="input-field dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:placeholder-gray-400"
                        placeholder="Village, District..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="acresOfLand" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('land_size_label')} *</label>
                      <input
                        id="acresOfLand"
                        name="acresOfLand"
                        type="number"
                        value={formData.acresOfLand}
                        onChange={handleInputChange}
                        className="input-field dark:bg-gray-600 dark:border-gray-500 dark:text-white dark:placeholder-gray-400"
                        placeholder="e.g. 5.5"
                        required
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <button
                      type="submit"
                      className="btn-primary flex items-center space-x-2 px-8 py-3 text-lg"
                    >
                      <span>{t('continue')}</span>
                      <span>→</span>
                    </button>
                  </div>
                </form>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Grant Permissions</h3>
                  
                  {/* Location Permission */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${locationPermission ? "bg-emerald-100 dark:bg-emerald-900/30" : "bg-gray-100 dark:bg-gray-700"}`}>
                          <FaMapMarkerAlt className={`text-2xl ${locationPermission ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-gray-500"}`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Location Access</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Required for local weather and soil data.</p>
                          {location && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={requestLocationPermission}
                        disabled={locationPermission || isLoading}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          locationPermission
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 cursor-not-allowed"
                            : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                        }`}
                      >
                        {locationPermission ? "Granted" : isLoading ? "..." : "Allow"}
                      </button>
                    </div>
                  </div>



                  <div className="flex justify-between pt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium px-4"
                    >
                      {t('back')}
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="btn-primary flex items-center space-x-2 px-8 py-3 text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>{t('loading')}</span>
                        </>
                      ) : (
                        <>
                          <span>{t('complete_profile')}</span>
                          <FaCheckCircle />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

