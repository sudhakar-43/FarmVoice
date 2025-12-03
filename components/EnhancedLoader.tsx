"use client";

import { useEffect, useState } from "react";
import { FaLeaf } from "react-icons/fa";

interface EnhancedLoaderProps {
  steps?: string[];
  title?: string;
  subtitle?: string;
}

export default function EnhancedLoader({ 
  steps = [
    "Fetching location coordinates...",
    "Getting real-time weather data...",
    "Analyzing soil composition...",
    "Generating crop recommendations..."
  ],
  title = "Analyzing Your Location...",
  subtitle = "Fetching real-time data from government & weather sources"
}: EnhancedLoaderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % steps.length);
    }, 2000);

    return () => clearInterval(stepInterval);
  }, [steps.length]);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 15;
      });
    }, 500);

    return () => clearInterval(progressInterval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-blue-50/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-32 h-32 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-32 h-32 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center">
          {/* Animated Center Circle */}
          <div className="flex justify-center mb-8">
            <div className="relative w-32 h-32">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 border-r-teal-500 animate-spin"></div>
              
              {/* Middle pulsing ring */}
              <div className="absolute inset-2 rounded-full border-2 border-emerald-200 animate-pulse"></div>
              
              {/* Inner icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 w-20 h-20 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <FaLeaf className="text-white text-3xl" />
                </div>
              </div>

              {/* Orbiting dots */}
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-emerald-400 rounded-full -translate-x-1/2"></div>
              </div>
              <div className="absolute inset-0 animate-spin" style={{ animationDuration: "4s", animationDirection: "reverse" }}>
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-teal-400 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 text-sm mb-8">{subtitle}</p>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{Math.round(progress)}%</p>
          </div>

          {/* Steps List */}
          <div className="space-y-3 mb-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-300 ${
                  index === currentStep
                    ? "bg-emerald-50 border border-emerald-300 scale-105"
                    : index < currentStep
                    ? "bg-green-50 border border-green-200"
                    : "bg-gray-50 border border-gray-200"
                }`}
              >
                <div className="flex-shrink-0">
                  {index < currentStep ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  ) : index === currentStep ? (
                    <div className="w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border-2 border-gray-300"></div>
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  index === currentStep ? "text-emerald-700" : index < currentStep ? "text-green-700" : "text-gray-600"
                }`}>
                  {step}
                </span>
              </div>
            ))}
          </div>

          {/* Animated Text */}
          <div className="text-center">
            <p className="text-emerald-600 font-medium">
              <span className="inline-block animate-pulse">Processing real-time data</span>
              <span className="inline-block ml-1">
                <span className="animate-bounce" style={{ animationDelay: "0s" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>.</span>
              </span>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
