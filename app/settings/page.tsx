"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaUser, FaLeaf, FaGlobe, FaBell, FaMoon, FaQuestionCircle, FaInfoCircle, FaSignOutAlt, FaChevronRight } from "react-icons/fa";
import { motion } from "framer-motion";

import { useSettings } from "@/context/SettingsContext";

export default function SettingsPage() {
  const router = useRouter();
  const { theme, language, notifications, setTheme, setLanguage, setNotifications, toggleTheme, t } = useSettings();
  const [userName, setUserName] = useState("");
  const [userPhone, setUserPhone] = useState("");

  useEffect(() => {
    // Load user data from local storage
    const name = localStorage.getItem("farmvoice_user_name") || "Farmer";
    const profile = localStorage.getItem("farmvoice_profile");
    if (profile) {
      try {
        const profileData = JSON.parse(profile);
        setUserPhone(profileData.phone || "");
      } catch (e) {
        console.error("Error parsing profile", e);
      }
    }
    setUserName(name);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("farmvoice_auth");
    localStorage.removeItem("farmvoice_user");
    localStorage.removeItem("farmvoice_token");
    localStorage.removeItem("farmvoice_user_id");
    localStorage.removeItem("farmvoice_user_name");
    localStorage.removeItem("farmvoice_profile");
    router.push("/");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-10 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center">
          <button 
            onClick={() => router.push("/home")}
            className={`p-2 -ml-2 rounded-full transition-all ${theme === 'dark' ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}
          >
            <FaArrowLeft className="text-lg" />
          </button>
          <h1 className={`ml-4 text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('settings_header')}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="space-y-8"
        >
          {/* Account Section */}
          <motion.section variants={itemVariants}>
            <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 px-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('account_section')}</h2>
            <div className={`rounded-2xl shadow-sm border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className={`p-4 flex items-center space-x-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl font-bold">
                  {userName ? userName[0].toUpperCase() : <FaUser />}
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{userName}</h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{userPhone || t('no_phone')}</p>
                </div>
                <button 
                  onClick={() => router.push("/personal-details")}
                  className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
                >
                  {t('edit_profile')}
                </button>
              </div>
            </div>
          </motion.section>

          {/* Farming Section */}
          <motion.section variants={itemVariants}>
            <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 px-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('farming_section')}</h2>
            <div className={`rounded-2xl shadow-sm border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <button 
                onClick={() => router.push("/crop-selection")}
                className={`w-full p-4 flex items-center justify-between transition-colors group ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
                    <FaLeaf />
                  </div>
                  <div className="text-left">
                    <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('crop_recommendation_title')}</h3>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('crop_recommendation_desc')}</p>
                  </div>
                </div>
                <FaChevronRight className="text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </button>
            </div>
          </motion.section>

          {/* App Preferences */}
          <motion.section variants={itemVariants}>
            <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 px-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('app_preferences_section')}</h2>
            <div className={`rounded-2xl shadow-sm border overflow-hidden divide-y ${theme === 'dark' ? 'bg-gray-800 border-gray-700 divide-gray-700' : 'bg-white border-gray-200 divide-gray-100'}`}>
              
              {/* Language */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <FaGlobe />
                  </div>
                  <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('language_setting')}</span>
                </div>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as any)}
                  className={`border text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                >
                  <option value="en">English</option>
                  <option value="te">Telugu</option>
                  <option value="hi">Hindi</option>
                </select>
              </div>

              {/* Notifications */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                    <FaBell />
                  </div>
                  <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('notifications_setting')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={notifications} 
                    onChange={() => setNotifications(!notifications)} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Dark Mode */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <FaMoon />
                  </div>
                  <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('dark_mode_setting')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={theme === 'dark'} 
                    onChange={toggleTheme} 
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </motion.section>

          {/* Support */}
          <motion.section variants={itemVariants}>
            <h2 className={`text-sm font-bold uppercase tracking-wider mb-3 px-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('support_section')}</h2>
            <div className={`rounded-2xl shadow-sm border overflow-hidden divide-y ${theme === 'dark' ? 'bg-gray-800 border-gray-700 divide-gray-700' : 'bg-white border-gray-200 divide-gray-100'}`}>
              <button className={`w-full p-4 flex items-center justify-between transition-colors group ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-cyan-100 dark:bg-cyan-900/30 rounded-full flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    <FaQuestionCircle />
                  </div>
                  <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('help_feedback')}</span>
                </div>
                <FaChevronRight className="text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </button>
              <button className={`w-full p-4 flex items-center justify-between transition-colors group ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300">
                    <FaInfoCircle />
                  </div>
                  <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('about_farmvoice')}</span>
                </div>
                <FaChevronRight className="text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </button>
            </div>
          </motion.section>

          {/* Logout */}
          <motion.section variants={itemVariants} className="pt-4">
            <button 
              onClick={handleLogout}
              className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-2xl font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center space-x-2"
            >
              <FaSignOutAlt />
              <span>{t('logout_button')}</span>
            </button>
            <p className="text-center text-gray-400 text-sm mt-4">{t('version')} 1.0.0</p>
          </motion.section>

        </motion.div>
      </main>
    </div>
  );
}
