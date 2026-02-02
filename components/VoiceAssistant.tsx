"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaTimes,
  FaStop,
} from "react-icons/fa";
import { apiClient } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveBackground from "./InteractiveBackground"; // Use local import if in same dir

interface VoiceAssistantProps {
  onClose: () => void;
}

interface Message {
  type: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export default function VoiceAssistant({ onClose }: VoiceAssistantProps) {
  // State Machine: 'idle' | 'listening' | 'processing' | 'responding' | 'error'
  const [voiceState, setVoiceState] = useState<"idle" | "listening" | "processing" | "responding" | "error">("idle");
  
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastTranscriptRef = useRef("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Geolocation State
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);

  const fetchLocation = () => {
    if (typeof navigator !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("Geolocation success:", position.coords);
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Geolocation error:", error);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  };

  // Capture location on mount
  useEffect(() => {
    fetchLocation();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      if (!recognitionRef.current) return;

      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        lastTranscriptRef.current = currentTranscript;

        if (silenceTimer) {
          clearTimeout(silenceTimer);
        }

        if (finalTranscript.trim() && voiceState === "listening") {
          const timer = setTimeout(() => {
            if (lastTranscriptRef.current.trim()) {
              processQuery(lastTranscriptRef.current.trim());
              setTranscript("");
              lastTranscriptRef.current = "";
            }
          }, 1500); 

          setSilenceTimer(timer);
        }
      };

      recognitionRef.current.onend = () => {
        // Automatically restart if we were in listening mode and NOT manually stopped
        // But if we are processing/responding, we should NOT restart.
        if (voiceState === "listening") {
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.log("Could not restart recognition");
          }
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        if (event.error !== "aborted" && event.error !== "no-speech") {
           // Only transition to error/idle if it's a real error
           console.error("Speech recognition error", event.error);
           setVoiceState("idle"); 
        }
      };
    }

    return () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      if (recognitionRef.current) recognitionRef.current.stop();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [voiceState, silenceTimer]);

  // Sync recognition with state
  useEffect(() => {
     if (voiceState === "listening") {
        try {
           recognitionRef.current?.start();
        } catch(e) { /* ignore */ }
     } else {
        recognitionRef.current?.stop();
     }
  }, [voiceState]);

  const toggleListening = () => {
    // Retry location if missing
    if (!location) fetchLocation();

    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }
    
    // User can manually cancel any state to return to IDLE/LISTENING
    if (voiceState === "listening") {
       // Stop listening -> Process what we have or Idle
       if (transcript.trim()) {
          setVoiceState("processing");
          processQuery(transcript.trim());
          setTranscript("");
       } else {
          setVoiceState("idle");
       }
    } else if (voiceState === "responding") {
       // Stop speaking and listen
       window.speechSynthesis.cancel();
       setVoiceState("listening");
    } else {
       // Idle/Error/Processing -> Start Listening
       // If Processing, we allow interruption!
       window.speechSynthesis.cancel();
       setTranscript("");
       lastTranscriptRef.current = "";
       setVoiceState("listening");
    }
  };

  // ===========================
  // VOICE ACK + ASYNC POLLING FLOW
  // ===========================
  
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const currentRequestIdRef = useRef<string | null>(null);
  const pollStartTimeRef = useRef<number>(0);
  const pollAttemptsRef = useRef<number>(0);
  const isRequestInFlightRef = useRef<boolean>(false);
  
  const POLL_INTERVAL_MS = 1000;  // Poll every 1 second
  const POLL_TIMEOUT_MS = 90000; // 90 second timeout

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, []);



  const processQuery = async (query: string) => {
    if (!query.trim()) return;

    // Chat UI: Add User Message
    const userMessage: Message = { type: "user", text: query, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    
    setVoiceState("processing");

    try {
      // Step 1: POST to /api/voice/chat - get immediate ACK
      // Pass captured location if available
      const response = await apiClient.processVoiceQuery(
        query, 
        "en", 
        location?.lat, 
        location?.lon
      );

      if (response.error) throw new Error(response.error);

      if ((response as any).data) {
        const data = (response as any).data;
        
        // Handle ACK mode - DO NOT SPEAK ACK. Just start polling.
        if (data.mode === "ack" && data.request_id) {
           // Wait silently for the real answer.
           // Start polling for final response
           pollStartTimeRef.current = Date.now();
           currentRequestIdRef.current = data.request_id;
           startPolling(data.request_id);
          
        } else {
          // Legacy/direct response
          handleFinalResponse(data);
        }
      }
    } catch (err: any) {
      console.error("Voice query error:", err);
      let errorSpeech = "I encountered a network configuration error. Please try again.";
      
      if (err.message && (err.message.includes("Session expired") || err.message.includes("log in"))) {
          errorSpeech = "Your session has expired. Please log in again to continue.";
      }
      
      const errorMessage: Message = { type: "assistant", text: errorSpeech, timestamp: new Date() };
      setMessages((prev) => [...prev, errorMessage]);
      setVoiceState("error");
      speakResponse(errorSpeech);
    }
  };

  const startPolling = (requestId: string) => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    
    // Reset state for new poll cycle
    pollAttemptsRef.current = 0;
    isRequestInFlightRef.current = false;

    const poll = async () => {
      // 1. Safety Checks
      if (currentRequestIdRef.current !== requestId) return; // Stale request
      
      if (isRequestInFlightRef.current) {
         // Previous poll still running, skip this tick but schedule next
         pollingRef.current = setTimeout(poll, POLL_INTERVAL_MS);
         return;
      }

      // Check timeout / max attempts (e.g. 60 attempts = 60 seconds)
      if (pollAttemptsRef.current > 60) {
        console.warn("Polling timeout reached (max attempts)");
        const timeoutSpeech = "I'm searching for that information, but it's taking a bit longer than usual.";
        const timeoutMessage: Message = {
          type: "assistant",
          text: timeoutSpeech,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, timeoutMessage]);
        
        // Timeout -> Error state
        setVoiceState("error");
        speakResponse(timeoutSpeech);
        currentRequestIdRef.current = null;
        return;
      }

      isRequestInFlightRef.current = true;
      pollAttemptsRef.current++;

      try {
        const response = await apiClient.request<any>(
          `/api/voice/chat/result/${requestId}`
        );

        // Ensure we are still relevant after await
        if (currentRequestIdRef.current !== requestId) return;

        if (response.error) {
           console.warn(`Polling error (attempt ${pollAttemptsRef.current}):`, response.error);
           // If 404, maybe it's gone? For now, retry a few times then fail? 
           // We'll just retry for now until timeout.
           pollingRef.current = setTimeout(poll, POLL_INTERVAL_MS);
           return;
        }

        if (response.data) {
          const data = response.data;
          
          if (data.status === "completed" || data.mode === "final") {
             // SUCCESS: Stop polling
             currentRequestIdRef.current = null;
             handleFinalResponse(data);
             return;
          } 
          
          if (data.status === "error" || data.error) {
             // ERROR: Stop polling
             currentRequestIdRef.current = null;
             console.error("Backend reported error:", data.error);
             speakResponse("I encountered a problem processing that.");
             setVoiceState("error");
             return;
          }

          // If "processing", continue loop
          // Fallthrough to schedule next poll
        }
        
        // Schedule next poll
        pollingRef.current = setTimeout(poll, POLL_INTERVAL_MS);

      } catch (err) {
        console.error("Polling network error:", err);
        // Retry on network error
        pollingRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      } finally {
        isRequestInFlightRef.current = false;
      }
    };

    // Start immediate first poll
    poll();
  };

  const handleFinalResponse = (data: any) => {
    // Handle UI updates
    if (data.ui_updates) {
      if (data.ui_updates.refresh_tasks) 
        window.dispatchEvent(new CustomEvent('farmvoice:refresh_tasks'));
      if (data.ui_updates.refresh_crops) 
        window.dispatchEvent(new CustomEvent('farmvoice:refresh_crops'));
    }

    // Valid final response
    const speechText = data.speech || data.response || "Here is what I found.";
    
    // Add final message
    const assistantMessage: Message = {
       type: "assistant",
       text: speechText,
       timestamp: new Date()
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    
    // Transition to RESPONDING -> TTS
    setVoiceState("responding");
    speakResponse(speechText);
  };

  // ===========================
  // TTS - Text to Speech
  // ===========================
  
  const speakResponse = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    
    // CRITICAL: Cancel any ongoing speech to prevent overlap
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; 
    utterance.pitch = 1.0;
    utterance.volume = 1;

    // Get voices and select appropriate one
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(
      (voice) =>
        voice.name.includes("Google US English") ||
        voice.name.includes("Samantha") ||
        voice.name.includes("Zira") ||
        voice.name.includes("Female")
    ) || voices.find(v => v.lang.startsWith("en"));

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
        console.log("Final speech started");
        // Ensure state is responding
        setVoiceState("responding");
    };

    utterance.onend = () => {
        console.log("Final speech ended — voice idle");
        setVoiceState("idle");
    };

    utterance.onerror = (e) => {
        console.error("TTS Error", e);
        setVoiceState("idle");
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();

    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center font-sans text-white overflow-hidden"
    >
      <InteractiveBackground />
      
      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
           {/* Optional Logo or status */}
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <FaTimes className="text-2xl text-white/80" />
        </button>
      </div>

      {/* Main Content Area - Minimalistic */}
      <div className="flex-1 w-full max-w-4xl flex flex-col items-center justify-center p-8 relative z-0">
        <AnimatePresence mode="wait">
          {messages.length === 0 && !transcript ? (
            <motion.div 
              key="intro"
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: -20, opacity: 0 }}
              className="text-center space-y-6"
            >
              <h1 className="text-5xl md:text-7xl font-light tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                Good Evening, krish
              </h1>
              <p className="text-xl text-emerald-400/80 font-light">
                How can I help you today?
                {location && (
                   <span className="ml-3 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-full border border-emerald-500/30">
                     📍 Location Active
                   </span>
                )}
              </p>
            </motion.div>
          ) : (
            <div className="w-full space-y-8 flex flex-col items-center">
              {/* Show only the latest conversation context for minimalism, or full history with scroll if needed.
                  The user asked for "minimalistic way", so let's focus on the active interaction. 
              */}
              <div className="flex-1 w-full overflow-y-auto max-h-[60vh] space-y-6 scrollbar-hide">
                 {messages.map((msg, idx) => (
                   <motion.div 
                     key={idx}
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={`flex w-full ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                   >
                     <div className={`max-w-2xl text-2xl md:text-3xl font-light leading-relaxed ${
                       msg.type === 'user' ? 'text-white/90 text-right' : 'text-emerald-300 text-left'
                     }`}>
                       {msg.text}
                     </div>
                   </motion.div>
                 ))}
                 
                 {/* Live Transcript */}
                 {voiceState === "listening" && transcript && (
                    <motion.div 
                      key="transcript"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex w-full justify-end"
                    >
                      <p className="max-w-2xl text-2xl md:text-3xl font-light text-white/50 text-right italic">
                        {transcript}
                      </p>
                    </motion.div>
                 )}

                 {/* Processing Indicator */}
                 {voiceState === "processing" && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     className="flex w-full justify-start"
                   >
                     <div className="flex gap-2 items-center">
                       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                     </div>
                   </motion.div>
                 )}
                 <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Input / Control Area */}
      <div className="w-full max-w-2xl p-8 z-10">
        {/* Minimal Input */}
        <div className="relative mb-12 group">
            <input 
              type="text" 
              placeholder="Ask anything..." 
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-lg text-white placeholder-white/20 focus:outline-none focus:bg-white/10 focus:border-emerald-500/50 transition-all backdrop-blur-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  processQuery(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Mic Control */}
        <div className="flex justify-center items-center gap-6">
           <motion.button
             whileHover={{ scale: 1.1 }}
             whileTap={{ scale: 0.95 }}
             onClick={toggleListening}
             className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all shadow-[0_0_30px_rgba(0,0,0,0.3)] ${
               voiceState === "listening" 
                 ? "bg-red-500/90 text-white animate-pulse shadow-[0_0_50px_rgba(239,68,68,0.4)]" 
                 : "bg-white text-emerald-900 hover:bg-emerald-50"
             }`}
           >
             {voiceState === "listening" ? <FaMicrophoneSlash /> : <FaMicrophone />}
           </motion.button>

           {voiceState === "responding" && (
             <motion.button
               initial={{ scale: 0, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0, opacity: 0 }}
               onClick={stopSpeaking}
               className="w-14 h-14 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all border border-white/10"
             >
               <FaStop className="text-lg" />
             </motion.button>
           )}
        </div>
      </div>

    </motion.div>
  );
}
