"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FaSeedling, FaRobot, FaCloudSun, FaChartLine, 
  FaStethoscope, FaLeaf, FaTasks, FaArrowRight,
  FaCheckCircle, FaBell, FaGlobe
} from "react-icons/fa";

export default function LandingPage() {
  const router = useRouter();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: <FaRobot className="text-4xl" />,
      title: "AI Voice Assistant",
      description: "Get instant farming advice in your language through voice commands",
      color: "from-purple-500 to-indigo-600"
    },
    {
      icon: <FaCloudSun className="text-4xl" />,
      title: "Real-Time Weather",
      description: "Hyperlocal weather forecasts and farming-specific insights",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: <FaChartLine className="text-4xl" />,
      title: "Market Prices",
      description: "Live market rates and price trends for your crops",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: <FaStethoscope className="text-4xl" />,
      title: "Disease Detection",
      description: "AI-powered crop disease diagnosis and treatment recommendations",
      color: "from-red-500 to-pink-600"
    },
    {
      icon: <FaTasks className="text-4xl" />,
      title: "Task Management",
      description: "Never miss critical farming activities with smart reminders",
      color: "from-orange-500 to-amber-600"
    },
    {
      icon: <FaLeaf className="text-4xl" />,
      title: "Crop Advisory",
      description: "Personalized recommendations for crop selection and care",
      color: "from-teal-500 to-green-600"
    }
  ];

  const stats = [
    { value: "10K+", label: "Active Farmers" },
    { value: "50+", label: "Crops Supported" },
    { value: "95%", label: "Accuracy Rate" },
    { value: "24/7", label: "AI Support" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-emerald-950 transition-colors duration-300">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-100 dark:bg-emerald-900/20 mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/2 -left-24 w-72 h-72 rounded-full bg-teal-100 dark:bg-teal-900/20 mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-80 h-80 rounded-full bg-blue-100 dark:bg-blue-900/20 mix-blend-multiply dark:mix-blend-overlay filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg transform rotate-3">
              <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain invert brightness-0" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-800 to-teal-700 dark:from-emerald-400 dark:to-teal-300">
              FarmVoice
            </span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <Link href="/login" className="px-6 py-2.5 text-emerald-700 dark:text-emerald-300 font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-lg transition-all">
              Login
            </Link>
            <Link href="/signup" className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center gap-2">
              Get Started
              <FaArrowRight className="text-sm" />
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 px-4 py-2 rounded-full mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                AI-Powered Farming Assistant
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
              Smart Farming for a{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
                Better Tomorrow
              </span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              Empower your farm with AI-driven insights, real-time weather updates, 
              market intelligence, and personalized crop recommendations—all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all flex items-center justify-center gap-3">
                Start Free Today
                <FaArrowRight />
              </Link>
              <Link href="/login" className="px-8 py-4 bg-white dark:bg-gray-800 text-emerald-700 dark:text-emerald-300 font-bold text-lg rounded-xl shadow-lg hover:shadow-xl border-2 border-emerald-200 dark:border-emerald-800 transition-all flex items-center justify-center">
                Sign In
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="text-center"
                >
                  <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-teal-200 dark:from-emerald-800 dark:to-teal-800 rounded-3xl blur-3xl opacity-20"></div>
            <div className="relative bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-gray-700/20">
              <img 
                src="/logo.png" 
                alt="FarmVoice Dashboard Preview" 
                className="w-full h-auto object-contain opacity-80 drop-shadow-2xl"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
            Everything You Need to{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400">
              Succeed
            </span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Comprehensive tools designed specifically for modern farmers
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onMouseEnter={() => setHoveredFeature(idx)}
              onMouseLeave={() => setHoveredFeature(null)}
              className="group relative bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700"
            >
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                {feature.description}
              </p>
              <div className={`mt-4 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity`}>
                Learn more
                <FaArrowRight className="text-sm" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-12 shadow-2xl text-center"
        >
          <h2 className="text-4xl font-extrabold text-white mb-4">
            Ready to Transform Your Farm?
          </h2>
          <p className="text-xl text-emerald-50 mb-8 max-w-2xl mx-auto">
            Join thousands of farmers already using FarmVoice to increase yields and reduce costs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="px-10 py-4 bg-white text-emerald-700 font-bold text-lg rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all inline-block">
              Get Started Free
            </Link>
            <Link href="/login" className="px-10 py-4 bg-transparent text-white font-bold text-lg rounded-xl border-2 border-white hover:bg-white/10 transition-all inline-block">
              Sign In
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            © 2026 FarmVoice. Empowering farmers with AI technology.
          </p>
        </div>
      </footer>
    </div>
  );
}
