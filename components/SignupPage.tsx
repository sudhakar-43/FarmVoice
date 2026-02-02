"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FaSeedling, FaEye, FaEyeSlash, FaPhone, FaUser } from "react-icons/fa";
import { apiClient } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";

interface SignupPageProps {
  onSignup?: () => void;
}

export default function SignupPage({ onSignup }: SignupPageProps) {
  const { t } = useSettings();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (!val) {
      setName("");
      setError("");
      return;
    }

    // Check if starts with number
    if (/^\d/.test(val)) {
      setError("Name must start with an alphabet");
      setName(val);
    } else {
      if (error === "Name must start with an alphabet") {
         setError("");
      }
      setName(val);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Only allow numeric input
    const numericVal = val.replace(/\D/g, "");
    setPhoneNumber(numericVal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validation
    if (!name) {
      setError("Please enter your Name");
      setIsLoading(false);
      return;
    }

    if (!phoneNumber || phoneNumber.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Please enter a password");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.register(phoneNumber, password, name);

      if (response.error) {
        const errorMsg =
          typeof response.error === "string"
            ? response.error
            : String(response.error);

        // Handle "User already exists" specifically
        if (
          errorMsg.toLowerCase().includes("already registered") ||
          errorMsg.toLowerCase().includes("duplicate")
        ) {
          setError("User already registered. Please sign in.");
          setIsLoading(false);
          return;
        }

        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      if (response.data) {
        if (onSignup) {
          onSignup();
        }
        router.push("/personal-details");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-300">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-100 dark:bg-emerald-900/20 mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-teal-100 dark:bg-teal-900/20 mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 rounded-full bg-blue-100 dark:bg-blue-900/20 mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        {/* Left Side: Logo & Branding */}
        <div className="hidden md:flex flex-col items-center justify-center text-center space-y-6">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-200 dark:bg-emerald-500/20 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <img
              src="/logo.png"
              alt="FarmVoice Logo"
              className="h-64 w-64 object-contain relative z-10 drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
            />
          </div>
          <div>
            <h2 className="text-5xl font-bold text-emerald-900 dark:text-emerald-100 mb-4 tracking-tight">
              {t("app_name")}
            </h2>
            <p className="text-xl text-emerald-700 dark:text-emerald-300 max-w-md mx-auto leading-relaxed">
              Join thousands of farmers using AI-powered insights for sustainable farming.
            </p>
          </div>

          <div className="flex gap-4 mt-8">
            <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-white/20 dark:border-gray-700/30">
              <FaSeedling className="text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                Smart Farming
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-white/20 dark:border-gray-700/30">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                Free to Start
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Signup Form */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-white/50 dark:border-gray-700/50 transition-colors duration-300">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                Create Your Account
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-medium">
              Start your journey to smarter farming
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleNameChange}
                  className="input-field !pl-10 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Phone Number Field */}
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 text-sm font-medium pr-1">
                    +91
                  </span>
                </div>
                <input
                  id="phone"
                  type="text"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  maxLength={10}
                  className="input-field !pl-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="10-digit phone number"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field pr-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Retype your password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
