"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FaMicrophone, FaStop, FaArrowLeft, FaGlobe } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";
import dynamic from "next/dynamic";

export default function VoiceAssistantPage() {
  const { theme } = useSettings(); 
  const router = useRouter();
  
  // Voice State Machine
  type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'RESPONDING' | 'ERROR';
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  
  // Chat State
  interface Message {
      role: 'user' | 'assistant';
      content: string;
  }
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Core State
  const [errorMessage, setErrorMessage] = useState("");
  
  // Language State
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "te" | "hi">("en");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisRef>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSpokenRef = useRef(new Set<number>()); // Track spoken messages by index

  // Config 
  const languages = {
    en: { name: "English", code: "en-US", flag: "🇺🇸" },
    te: { name: "తెలుగు", code: "te-IN", flag: "🇮🇳" },
    hi: { name: "हिंदी", code: "hi-IN", flag: "🇮🇳" },
  };

  // --- Scroll to bottom ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, voiceState]);

  // --- Initialization ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        if (synthRef.current) {
          synthRef.current.getVoices();
        }
      };
      
      loadVoices();
      if (synthRef.current && synthRef.current.onvoiceschanged !== undefined) {
        synthRef.current.onvoiceschanged = loadVoices;
      }
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // --- TTS Logic ---
  const speakResponse = (text: string, msgIndex: number) => {
    if (!synthRef.current) return;
    
    // Check if duplicate speech
    if (hasSpokenRef.current.has(msgIndex)) return;
    hasSpokenRef.current.add(msgIndex);

    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languages[selectedLanguage].code;
    utterance.rate = 0.9;
    
    const voices = synthRef.current.getVoices();
    let preferredVoice;
    if (selectedLanguage === "te") preferredVoice = voices.find(v => v.lang.includes("te"));
    else if (selectedLanguage === "hi") preferredVoice = voices.find(v => v.lang.includes("hi"));
    else preferredVoice = voices.find(v => v.name.includes("Zira")) || voices.find(v => v.lang.startsWith("en"));
    
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
         // Keep state as RESPONDING if not error
         if (voiceState !== 'ERROR') setVoiceState('RESPONDING');
    };
    
    utterance.onend = () => { 
      setVoiceState('IDLE'); 
    };
    
    utterance.onerror = (e: any) => {
       if (e.error === 'canceled' || e.error === 'interrupted') return;
       console.error("TTS Error:", e.error);
       setVoiceState('IDLE');
    };
    
    synthRef.current.speak(utterance);
  };

  // Trigger TTS only on new assistant messages
  useEffect(() => {
      if (messages.length > 0) {
          const lastMsgIndex = messages.length - 1;
          const lastMsg = messages[lastMsgIndex];
          if (lastMsg.role === 'assistant') {
              speakResponse(lastMsg.content, lastMsgIndex);
          }
      }
  }, [messages]);

  // --- API Handling ---
  const processQuery = async (text: string) => {
      // 1. Apppend User Message
      setMessages(prev => [...prev, { role: 'user', content: text }]);
      setVoiceState('PROCESSING');
      setErrorMessage("");

      try {
          // 2. Call API (Synchronous)
          const res = await apiClient.processVoiceQuery(text, selectedLanguage);
          
          if (res.error) {
              const errorText = res.error;
              setMessages(prev => [...prev, { role: 'assistant', content: errorText }]);
              setErrorMessage(errorText); // Show visual indicator too if needed
              setVoiceState('ERROR');
          } else if (res.data) {
              const reply = res.data.speech || res.data.response || "I didn't catch that.";
              setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
              // TTS triggered by useEffect
          }
      } catch (err) {
          const errorText = "Connection failed. Please try again.";
          setMessages(prev => [...prev, { role: 'assistant', content: errorText }]);
          setVoiceState('ERROR');
      }
  };

  // --- Speech Recognition ---
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // CRITICAL: Single shot per click (Continuous = False)
      recognition.continuous = false;
      recognition.interimResults = false; // Only final results
      recognition.lang = languages[selectedLanguage].code;

      recognition.onresult = (event: any) => {
         const transcript = event.results[0][0].transcript;
         if (transcript) {
             processQuery(transcript);
         }
      };

      recognition.onerror = (e: any) => {
          console.log("Recognition error:", e.error);
          if (e.error !== 'no-speech') {
             setVoiceState('IDLE');
          } else {
             setVoiceState('IDLE'); 
          }
      };

      recognition.onend = () => {
          // If we haven't transitioned to processing (i.e., no result), back to IDLE
          setVoiceState(prev => prev === 'LISTENING' ? 'IDLE' : prev);
      };

      recognitionRef.current = recognition;
    }
  }, [selectedLanguage]);

  const toggleListening = () => {
    if (voiceState === 'PROCESSING' || voiceState === 'RESPONDING') return;

    if (voiceState === 'LISTENING') {
        try { recognitionRef.current?.stop(); } catch (e) {}
        setVoiceState('IDLE');
    } else {
        if (synthRef.current) synthRef.current.cancel(); // Stop talking logic
        try { recognitionRef.current?.start(); } catch (e) {}
        setVoiceState('LISTENING');
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans text-gray-800 bg-gray-50 flex flex-col">
      {/* Light Background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-white to-green-100" />
      
      {/* Header */}
      <div className="w-full p-4 flex justify-between items-center bg-white/80 backdrop-blur-md shadow-sm z-50">
        <button 
          onClick={() => router.back()} 
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <FaArrowLeft className="text-emerald-700 text-lg" />
        </button>
        
        <h1 className="text-lg font-medium text-emerald-800">FarmVoice Chat</h1>

        <button 
          onClick={() => setShowLanguageMenu(!showLanguageMenu)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium"
        >
          <span>{languages[selectedLanguage].flag}</span>
          <span>{selectedLanguage.toUpperCase()}</span>
        </button>
        
        {/* Language Menu */}
        <AnimatePresence>
            {showLanguageMenu && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-16 right-4 w-40 bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden z-[60]"
                >
                    {(Object.entries(languages) as [string, any][]).map(([key, lang]) => (
                        <button
                            key={key}
                            onClick={() => { setSelectedLanguage(key as any); setShowLanguageMenu(false); }}
                            className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-sm"
                        >
                            {lang.flag} {lang.name}
                        </button>
                    ))}
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
          {messages.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center text-emerald-800/50">
                 <p className="text-center text-lg">
                    Tap the mic to start talking<br/>
                    <span className="text-sm">Ask about crops, weather, or prices</span>
                 </p>
             </div>
          )}

          {messages.map((msg, idx) => (
             <motion.div 
               key={idx}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
             >
                 <div className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm text-base leading-relaxed
                     ${msg.role === 'user' 
                        ? 'bg-emerald-600 text-white rounded-br-none' 
                        : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'}`}
                 >
                    {msg.content}
                 </div>
             </motion.div>
          ))}
          
          {voiceState === 'PROCESSING' && (
              <div className="flex justify-start w-full">
                  <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none border border-gray-100 shadow-sm flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75" />
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150" />
                  </div>
              </div>
          )}
          
          <div ref={messagesEndRef} />
      </div>

      {/* Footer Controls */}
      <div className="absolute bottom-6 left-0 w-full flex justify-center z-50">
        <motion.button
            onClick={toggleListening}
            disabled={voiceState === 'PROCESSING' || voiceState === 'RESPONDING'}
            whileTap={{ scale: 0.95 }}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg transition-all
                 ${voiceState === 'LISTENING' 
                    ? 'bg-red-500 text-white shadow-red-200 ring-4 ring-red-100' 
                    : voiceState === 'PROCESSING'
                    ? 'bg-gray-100 text-gray-400 cursor-wait'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200 ring-4 ring-emerald-100'
                 }`}
        >
            {voiceState === 'LISTENING' ? (
                <FaStop />
            ) : voiceState === 'PROCESSING' ? (
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
                <FaMicrophone />
            )}
        </motion.button>
      </div>

    </div>
  );
}

type SpeechSynthesisRef = typeof window.speechSynthesis | null;
