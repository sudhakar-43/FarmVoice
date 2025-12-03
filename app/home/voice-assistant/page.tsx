"use client";

import { useState, useEffect, useRef } from "react";
import { FaMicrophone, FaStop, FaVolumeUp, FaKeyboard, FaPaperPlane } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";

export default function VoiceAssistantPage() {
  const { t } = useSettings();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Context for greeting
  useEffect(() => {
    const generateGreeting = () => {
      const hour = new Date().getHours();
      let timeGreeting = "greeting_morning";
      if (hour >= 12 && hour < 17) timeGreeting = "greeting_afternoon";
      else if (hour >= 17) timeGreeting = "greeting_evening";

      // In a real app, fetch weather/user name here
      const user = localStorage.getItem("farmvoice_user_name") || "Farmer";
      const weather = "sunny"; // Mock
      
      setGreeting(`${t(timeGreeting as any)}, ${user}. ${t('voice_greeting_part2').replace('{weather}', weather)}`);
    };
    generateGreeting();
  }, [t]);

  const handleToggleListening = async () => {
    if (isListening) {
      stopListening();
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        startListening();
      } catch (err) {
        console.error("Microphone permission denied:", err);
        setResponse(t('mic_permission_denied'));
      }
    }
  };

  const startListening = () => {
    setIsListening(true);
    // Mock speech recognition for now
    // In real app: use window.SpeechRecognition
    setTimeout(() => {
      const mockQuery = t('mock_query_tomato');
      setTranscript(mockQuery);
      stopListening();
      handleSendQuery(mockQuery);
    }, 2000);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const handleSendQuery = async (query: string) => {
    if (!query) return;
    
    setIsLoading(true);
    setResponse("");
    
    try {
      const res = await apiClient.processVoiceQuery(query);
      if (res.data) {
        setResponse(res.data.response);
        speakResponse(res.data.response);
      }
    } catch (err) {
      console.error("Voice query error:", err);
      setResponse(t('voice_query_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const speakResponse = (text: string) => {
    setIsSpeaking(true);
    const utterance = new SpeechSynthesisUtterance(text);
    // Try to set a female voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => v.name.includes("Female") || v.name.includes("Google US English"));
    if (femaleVoice) utterance.voice = femaleVoice;
    
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-white relative overflow-hidden flex flex-col items-center justify-center p-6">
      
      {/* Background Particles (CSS only for performance) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-blue-400 rounded-full opacity-20 animate-float"
            style={{
              width: Math.random() * 10 + 5 + "px",
              height: Math.random() * 10 + 5 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              animationDuration: Math.random() * 10 + 10 + "s",
              animationDelay: Math.random() * 5 + "s"
            }}
          />
        ))}
      </div>

      {/* 3D Orb Visualization */}
      <div className="relative mb-12">
        <div className={`w-64 h-64 rounded-full bg-gradient-to-br from-blue-400 to-purple-600 blur-md opacity-40 animate-pulse-slow ${isListening || isSpeaking ? "scale-110" : "scale-100"} transition-transform duration-500`}></div>
        <div className="absolute inset-0 rounded-full bg-blue-400 blur-xl opacity-20 animate-pulse"></div>
        
        {/* Inner Core */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center border-4 border-blue-100 shadow-[0_0_50px_rgba(59,130,246,0.3)]">
             {isSpeaking ? (
               <div className="flex gap-1 h-12 items-center">
                 {[...Array(5)].map((_, i) => (
                   <motion.div
                     key={i}
                     animate={{ height: [10, 40, 10] }}
                     transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                     className="w-2 bg-blue-500 rounded-full"
                   />
                 ))}
               </div>
             ) : (
               <FaMicrophone className={`text-5xl ${isListening ? "text-red-500 animate-pulse" : "text-blue-500"}`} />
             )}
          </div>
        </div>
      </div>

      {/* Greeting & Transcript */}
      <div className="text-center max-w-2xl z-10 space-y-6">
        <AnimatePresence mode="wait">
          {!response ? (
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-3xl md:text-4xl font-light leading-relaxed text-gray-800 dark:text-white"
            >
              "{greeting}"
            </motion.h1>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-md p-6 rounded-3xl border border-white/50 dark:border-gray-700 shadow-lg"
            >
              <p className="text-xl md:text-2xl font-light leading-relaxed text-gray-800 dark:text-white">{response}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {transcript && !response && (
          <p className="text-blue-600 dark:text-blue-400 italic font-medium">"{transcript}"</p>
        )}
      </div>

      {/* Controls */}
      <div className="fixed bottom-10 left-0 right-0 flex justify-center items-center gap-6 z-20">
        <button 
          onClick={() => setShowKeyboard(!showKeyboard)}
          className="p-4 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-all border border-gray-100 dark:border-gray-700"
        >
          <FaKeyboard className="text-xl" />
        </button>

        <button 
          onClick={handleToggleListening}
          className={`p-6 rounded-full transition-all transform hover:scale-105 shadow-xl ${
            isListening 
              ? "bg-red-500 hover:bg-red-600 shadow-red-500/30 text-white" 
              : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30 text-white"
          }`}
        >
          {isListening ? <FaStop className="text-2xl" /> : <FaMicrophone className="text-2xl" />}
        </button>
      </div>

      {/* Keyboard Input Overlay */}
      <AnimatePresence>
        {showKeyboard && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl p-6 rounded-t-3xl border-t border-gray-200 dark:border-gray-700 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30"
          >
            <div className="max-w-3xl mx-auto relative">
              <button 
                onClick={() => setShowKeyboard(false)}
                className="absolute -top-12 right-0 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full shadow-sm hover:bg-white dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendQuery(transcript);
                  setTranscript("");
                  setShowKeyboard(false);
                }}
                className="flex gap-4"
              >
                <input
                  type="text"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder={t('type_question_placeholder')}
                  className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-4 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  autoFocus
                />
                <button 
                  type="submit"
                  disabled={!transcript.trim() || isLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
                >
                  <FaPaperPlane />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
