"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FaMicrophone, FaStop, FaClosedCaptioning, FaArrowLeft, FaGlobe, FaMoon, FaSun } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api";
import { useSettings } from "@/context/SettingsContext";

export default function VoiceAssistantPage() {
  const { t, theme, toggleTheme } = useSettings();
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [showCaptions, setShowCaptions] = useState(true);
  const [greeting, setGreeting] = useState("");
  const [displayedResponse, setDisplayedResponse] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "te" | "hi">("en");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  // Language configurations
  const languages = {
    en: { name: "English", code: "en-US", flag: "🇺🇸", greeting: "How can I help you today?" },
    te: { name: "తెలుగు", code: "te-IN", flag: "🇮🇳", greeting: "నేను మీకు ఎలా సహాయం చేయగలను?" },
    hi: { name: "हिंदी", code: "hi-IN", flag: "🇮🇳", greeting: "मैं आपकी कैसे मदद कर सकता हूं?" },
  };

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisRef>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const latestTranscriptRef = useRef("");

  // Initialize Speech Synthesis Reference
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

  // Initialize Greeting
  useEffect(() => {
    const generateGreeting = () => {
      const hour = new Date().getHours();
      let timeGreeting = "";
      
      if (selectedLanguage === "te") {
        if (hour < 12) timeGreeting = "శుభోదయం";
        else if (hour < 17) timeGreeting = "శుభ మధ్యాహ్నం";
        else timeGreeting = "శుభ సాయంత్రం";
      } else if (selectedLanguage === "hi") {
        if (hour < 12) timeGreeting = "सुप्रभात";
        else if (hour < 17) timeGreeting = "नमस्ते";
        else timeGreeting = "शुभ संध्या";
      } else {
        if (hour < 12) timeGreeting = "Good Morning";
        else if (hour < 17) timeGreeting = "Good Afternoon";
        else timeGreeting = "Good Evening";
      }

      const user = localStorage.getItem("farmvoice_user_name") || "Farmer";
      setGreeting(`${timeGreeting}, ${user}. ${languages[selectedLanguage].greeting}`);
    };
    generateGreeting();
  }, [selectedLanguage]);

  // Canvas Particle System - Theme Aware
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles: Particle[] = [];
    const particleCount = 100; // Minimal density
    const connectionDistance = 140;
    let mouse = { x: -1000, y: -1000 };

    // Theme colors
    const getParticleColor = (alpha: number) => {
      return theme === 'dark' 
        ? `rgba(34, 211, 238, ${alpha})` // Cyan for dark
        : `rgba(99, 102, 241, ${alpha})`; // Indigo for light
    };

    class Particle {
      x: number;
      y: number;
      z: number;
      vx: number;
      vy: number;
      size: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.size = Math.random() * 1.5 + 0.5;
      }

      update() {
        // Soft mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 250;
        
        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          this.vx -= (dx / distance) * force * 0.2;
          this.vy -= (dy / distance) * force * 0.2;
        }

        this.x += this.vx * this.z * 0.5;
        this.y += this.vy * this.z * 0.5;

        // Friction
        this.vx *= 0.99;
        this.vy *= 0.99;

        // Keep moving
        if (Math.abs(this.vx) < 0.1) this.vx += (Math.random() - 0.5) * 0.02;
        if (Math.abs(this.vy) < 0.1) this.vy += (Math.random() - 0.5) * 0.02;

        // Wrap around
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }

      draw() {
        if (!ctx) return;
        const alpha = (this.z / 3) * (theme === 'dark' ? 0.4 : 0.3);
        ctx.fillStyle = getParticleColor(alpha);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      particles.forEach(p => {
        p.update();
        p.draw();
      });

      // Connections
      particles.forEach((a, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = (1 - dist / connectionDistance) * 0.15;
            if (alpha > 0) {
              ctx.strokeStyle = getParticleColor(alpha);
              ctx.lineWidth = 0.5;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
            }
          }
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [theme]); // Re-run when theme changes

  // ... (Voice Logic remains mostly same, just ensuring correct state handling)
  const processQuery = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;
    try { recognitionRef.current?.stop(); } catch (e) {}
    setIsListening(false);
    setIsProcessing(true);
    
    try {
      const res = await apiClient.processVoiceQuery(queryText, selectedLanguage);
      if (res.data) {
        setResponse(res.data.response);
        speakResponse(res.data.response);
      } else {
         const errorMsg = selectedLanguage === "te" 
          ? "క్షమించండి, నేను అర్థం చేసుకోలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి."
          : selectedLanguage === "hi"
          ? "क्षमा करें, मुझे समझ नहीं आया। कृपया पुनः प्रयास करें।"
          : "Sorry, I didn't catch that. Please try again.";
        setResponse(errorMsg);
      }
    } catch (err) {
      console.error("Voice query error:", err);
      setResponse("An error occurred. Please check your connection.");
    } finally {
      setIsProcessing(false);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).webkitSpeechRecognition) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = languages[selectedLanguage].code;

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        const currentText = finalTranscript || interimTranscript;
        
        if (currentText) {
          setTranscript(currentText);
          latestTranscriptRef.current = currentText;

          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          
          silenceTimerRef.current = setTimeout(() => {
            const textToProcess = latestTranscriptRef.current.trim();
            if (textToProcess) {
              try { recognition.stop(); } catch (e) {}
              setIsListening(false);
              setIsProcessing(true);
              
              apiClient.processVoiceQuery(textToProcess)
                .then((res) => {
                  if (res.data) {
                    const responseText = res.data.response;
                    setResponse(responseText);
                    // Speak
                    if (typeof window !== "undefined" && window.speechSynthesis) {
                        try{window.speechSynthesis.cancel();}catch(e){}
                        const utterance = new SpeechSynthesisUtterance(responseText);
                        utterance.rate = 0.9;
                        utterance.pitch = 1.05;
                        
                        const voices = window.speechSynthesis.getVoices();
                         const preferredVoice = voices.find(v => v.name.includes("Zira")) ||
                        voices.find(v => v.name.includes("Google US English")) ||
                        voices.find(v => v.name.toLowerCase().includes("female")) ||
                        voices.find(v => v.lang.startsWith("en"));
                        if (preferredVoice) utterance.voice = preferredVoice;

                        utterance.onstart = () => setIsSpeaking(true);
                        utterance.onend = () => { setIsSpeaking(false); setDisplayedResponse(responseText); };
                        utterance.onerror = () => { setIsSpeaking(false); setDisplayedResponse(responseText); };
                        
                        setDisplayedResponse("");
                        window.speechSynthesis.speak(utterance);
                    }
                  } else {
                    setResponse("Sorry, I didn't catch that.");
                  }
                })
                .catch((err) => {
                   setResponse("Connection error.");
                })
                .finally(() => setIsProcessing(false));
            }
          }, 2000);
        }
      };
      
      recognition.onerror = (e: any) => {
          console.error("Speech error", e);
          setIsListening(false);
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      };

      recognitionRef.current = recognition;
    }
  }, [selectedLanguage]);

  const startListening = () => {
    if (isSpeaking) {
        if (synthRef.current) { synthRef.current.cancel(); setIsSpeaking(false); }
    }
    setTranscript("");
    setResponse("");
    setDisplayedResponse("");
    setIsListening(true);
    try { recognitionRef.current?.start(); } catch (e) {}
  };

  const stopListeningAndProcess = async () => {
    setIsListening(false);
    try { recognitionRef.current?.stop(); } catch (e) {}
    if (!transcript.trim()) return;
    await processQuery(transcript);
  };

  const speakResponse = (text: string) => {
      // Re-use logic above or clean up duplication in future
      // Ideally move to helper, but keeping inline for stability in this large refactor
       if (!synthRef.current) return;
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = selectedLanguage === 'en' ? 0.9 : 0.85;
        utterance.lang = languages[selectedLanguage].code;
        
        setIsSpeaking(true);
        setDisplayedResponse("");

        // Voice selection logic...
        const voices = synthRef.current.getVoices();
        let preferredVoice;
        if (selectedLanguage === "te") {
            preferredVoice = voices.find(v => v.lang.includes("te")) || voices.find(v => v.name.toLowerCase().includes("telugu"));
        } else if (selectedLanguage === "hi") {
            preferredVoice = voices.find(v => v.lang.includes("hi")) || voices.find(v => v.name.toLowerCase().includes("hindi"));
        } else {
             preferredVoice = voices.find(v => v.name.includes("Zira")) || voices.find(v => v.lang.startsWith("en"));
        }
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onboundary = (event) => {
            const charIndex = event.charIndex;
            setDisplayedResponse(text.substring(0, charIndex + 50));
        };
        utterance.onend = () => { setIsSpeaking(false); setDisplayedResponse(text); };
        
        synthRef.current.speak(utterance);
        
        // Mobile fallback for boundary
        if (!('onboundary' in utterance)) {
             setDisplayedResponse(text);
        }
  };

  const handleOrbClick = () => {
    if (isListening) stopListeningAndProcess();
    else startListening();
  };

  return (
    <div className={`min-h-screen relative overflow-hidden flex flex-col items-center justify-center p-6 transition-colors duration-700 
      ${theme === 'dark' ? 'bg-[#0B1120] text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* Background Gradients */}
      <div className="absolute inset-0 transition-opacity duration-700">
         {theme === 'dark' ? (
             <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0B1120] to-[#0B1120]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[120px]" />
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[120px]" />
             </>
         ) : (
             <>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-slate-50" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px]" />
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-200/20 rounded-full blur-[100px]" />
             </>
         )}
      </div>

      {/* Canvas Layer */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />

      {/* Navigation & Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20">
        <motion.button
          onClick={() => router.back()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-3 rounded-full backdrop-blur-md border shadow-sm transition-all
            ${theme === 'dark' 
                ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200' 
                : 'bg-white/70 border-white/40 hover:bg-white/90 text-slate-700'}`}
        >
          <FaArrowLeft />
        </motion.button>

        <div className="flex gap-4">
            {/* Theme Toggle */}
            <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`p-3 rounded-full backdrop-blur-md border shadow-sm transition-all
                    ${theme === 'dark' 
                        ? 'bg-white/5 border-white/10 hover:bg-white/10 text-yellow-400' 
                        : 'bg-white/70 border-white/40 hover:bg-white/90 text-indigo-600'}`}
            >
                {theme === 'dark' ? <FaSun /> : <FaMoon />}
            </motion.button>
            
            {/* Language Selector */}
            <div className="relative">
                <motion.button
                    onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                    whileHover={{ scale: 1.05 }}
                    className={`flex items-center gap-2 px-4 py-3 rounded-full backdrop-blur-md border shadow-sm transition-all
                        ${theme === 'dark' 
                            ? 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200' 
                            : 'bg-white/70 border-white/40 hover:bg-white/90 text-slate-700'}`}
                >
                    <span className="text-xl">{languages[selectedLanguage].flag}</span>
                    <span className="text-sm font-medium hidden md:block">{languages[selectedLanguage].name}</span>
                </motion.button>

                <AnimatePresence>
                    {showLanguageMenu && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`absolute right-0 mt-2 w-48 rounded-xl border shadow-xl backdrop-blur-xl overflow-hidden
                                ${theme === 'dark' ? 'bg-[#151e32]/90 border-white/10' : 'bg-white/90 border-slate-200'}`}
                        >
                            {(Object.keys(languages) as Array<"en" | "te" | "hi">).map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => { setSelectedLanguage(lang); setShowLanguageMenu(false); }}
                                    className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors
                                        ${theme === 'dark' ? 'hover:bg-white/5 text-slate-200' : 'hover:bg-slate-50 text-slate-700'}
                                        ${selectedLanguage === lang ? (theme === 'dark' ? 'bg-white/10' : 'bg-blue-50/50 text-blue-600') : ''}`}
                                >
                                    <span className="text-xl">{languages[lang].flag}</span>
                                    <span className="text-sm font-medium">{languages[lang].name}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="z-10 flex flex-col items-center w-full max-w-3xl">
         
         {/* Greeting Status */}
         <div className="h-32 flex items-end justify-center mb-16 text-center">
            <AnimatePresence mode="wait">
                {!isListening && !isProcessing && !isSpeaking && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                    >
                         <h1 className={`text-4xl md:text-5xl font-light tracking-tight mb-3 
                            ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {greeting.split('.')[0]}
                         </h1>
                         <p className={`text-sm md:text-base font-medium tracking-wide opacity-60
                             ${theme === 'dark' ? 'text-cyan-200' : 'text-indigo-600'}`}>
                             {greeting.split('.').slice(1).join('.')}
                         </p>
                    </motion.div>
                )}
                {isListening && (
                     <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center"
                    >
                        <h2 className={`text-4xl font-light bg-clip-text text-transparent bg-gradient-to-r 
                            ${theme === 'dark' ? 'from-cyan-400 to-blue-500' : 'from-blue-600 to-indigo-600'}`}>
                            Listening...
                        </h2>
                    </motion.div>
                )}
                {isProcessing && (
                     <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0, scale: 0.9 }}
                         className="flex flex-col items-center"
                     >
                         <h2 className={`text-4xl font-light bg-clip-text text-transparent bg-gradient-to-r 
                             ${theme === 'dark' ? 'from-purple-400 to-pink-500' : 'from-purple-600 to-pink-600'}`}>
                             Thinking...
                         </h2>
                     </motion.div>
                 )}
            </AnimatePresence>
         </div>

         {/* Central Orb */}
         <motion.div
            onClick={handleOrbClick}
            className="relative group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
         >
            {/* Glow / Ring Effects */}
            <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-500
                 ${isListening 
                    ? (theme === 'dark' ? 'bg-cyan-500/30 scale-150' : 'bg-blue-500/30 scale-150')
                    : isProcessing
                    ? (theme === 'dark' ? 'bg-purple-500/30 scale-150' : 'bg-purple-500/30 scale-150')
                    : (theme === 'dark' ? 'bg-indigo-500/10 scale-110 group-hover:scale-125' : 'bg-blue-500/10 scale-110 group-hover:scale-125')
                 }`} 
            />
            
            <div className={`relative w-40 h-40 md:w-56 md:h-56 rounded-full flex items-center justify-center 
                  backdrop-blur-2xl border shadow-2xl transition-all duration-500
                  ${theme === 'dark' 
                      ? 'bg-white/5 border-white/10 shadow-cyan-900/20' 
                      : 'bg-white/40 border-white/60 shadow-blue-900/5'}`}
            >
                 {isListening ? (
                     <div className="flex items-center gap-1.5 h-12">
                         {[1,2,3,4,5].map(i => (
                             <motion.div 
                                key={i}
                                animate={{ height: [10, 32, 10] }}
                                transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.1 }}
                                className={`w-1.5 rounded-full ${theme === 'dark' ? 'bg-cyan-400' : 'bg-blue-600'}`}
                             />
                         ))}
                     </div>
                 ) : isProcessing ? (
                     <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className={`w-16 h-16 border-2 border-t-transparent rounded-full
                            ${theme === 'dark' ? 'border-purple-400' : 'border-purple-600'}`}
                     />
                 ) : (
                     <FaMicrophone className={`text-4xl md:text-6xl transition-colors duration-300
                         ${theme === 'dark' ? 'text-white/80 group-hover:text-cyan-300' : 'text-slate-600 group-hover:text-blue-600'}`} 
                     />
                 )}
            </div>
         </motion.div>


         {/* Transcript / Response Card */}
         <div className="mt-16 w-full min-h-[160px] px-4 flex justify-center">
             <AnimatePresence mode="wait">
                 {(transcript || response) && (
                     <motion.div
                        initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                        className={`max-w-2xl w-full p-8 rounded-3xl backdrop-blur-xl border shadow-xl text-center
                             ${theme === 'dark' 
                                 ? 'bg-white/5 border-white/5 text-slate-200' 
                                 : 'bg-white/60 border-white/60 text-slate-800'}`}
                     >
                         <p className={`text-lg md:text-2xl leading-relaxed font-light
                            ${isListening ? 'italic opacity-70' : ''}`}>
                             {isListening ? `"${transcript}"` : (displayedResponse || response)}
                         </p>
                     </motion.div>
                 )}
             </AnimatePresence>
         </div>

      </div>

      {/* Footer Controls */}
      <div className="absolute bottom-8 z-20">
          <motion.button 
             onClick={() => setShowCaptions(!showCaptions)}
             className={`p-3 rounded-xl backdrop-blur transition-all border
                 ${theme === 'dark' 
                    ? (showCaptions ? 'bg-white/10 text-cyan-400 border-cyan-500/30' : 'bg-transparent text-white/30 border-transparent') 
                    : (showCaptions ? 'bg-white/80 text-blue-600 border-blue-200' : 'bg-transparent text-slate-400 border-transparent')}`}
          >
              <FaClosedCaptioning size={20} />
          </motion.button>
      </div>
      
    </div>
  );
}

type SpeechSynthesisRef = typeof window.speechSynthesis | null;
