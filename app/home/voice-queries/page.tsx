"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaMicrophone, FaMicrophoneSlash, FaWaveSquare } from "react-icons/fa";
import { apiClient } from "@/lib/api";

export default function VoiceAssistantPage() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<{ type: 'user' | 'ai', text: string }[]>([]);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      if (!recognitionRef.current) return;
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "en-US";

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += t + " ";
          } else {
            interimTranscript += t;
          }
        }
        
        const currentText = finalTranscript || interimTranscript;
        setTranscript(currentText);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          handleQuery(transcript);
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, [transcript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation, isProcessing]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your browser. Please use Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleQuery = async (query: string) => {
    if (!query.trim()) return;
    
    setConversation(prev => [...prev, { type: 'user', text: query }]);
    setTranscript("");
    setIsProcessing(true);

    try {
      const res = await apiClient.processVoiceQuery(query);
      
      let aiResponse = "I'm sorry, I couldn't process that.";
      if (res.data && res.data.response) {
        aiResponse = res.data.response;
      } else if (res.error) {
        aiResponse = typeof res.error === 'string' ? res.error : "An error occurred.";
      }

      setConversation(prev => [...prev, { type: 'ai', text: aiResponse }]);
      speakResponse(aiResponse);
    } catch (error) {
      setConversation(prev => [...prev, { type: 'ai', text: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden font-sans text-gray-800">
      {/* Dynamic Background */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1740&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-teal-900/80 to-blue-900/90 backdrop-blur-sm"></div>
      </div>

      {/* Header */}
      <header className="relative z-20 px-6 py-6 flex items-center justify-between">
        <button 
          onClick={() => router.back()}
          className="text-white/80 hover:text-white hover:bg-white/10 p-3 rounded-full transition-all"
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <div className="flex items-center space-x-3">
           <img 
              src="/logo.png" 
              alt="FarmVoice Logo" 
              className="h-10 w-10 object-contain drop-shadow-lg" 
            />
          <span className="text-2xl font-bold text-white tracking-wide">FarmVoice AI</span>
        </div>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col h-[calc(100vh-100px)] max-w-4xl mx-auto px-4">
        
        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-6 py-4 px-2">
          {conversation.length === 0 && !transcript && (
            <div className="h-full flex flex-col items-center justify-center text-center text-white/60 space-y-4">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-4 animate-pulse">
                <FaWaveSquare className="text-4xl text-emerald-300" />
              </div>
              <h2 className="text-3xl font-bold text-white">How can I help you today?</h2>
              <p className="max-w-md text-lg">Ask about crop prices, weather, disease management, or farming tips.</p>
            </div>
          )}

          {conversation.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[80%] p-5 rounded-2xl backdrop-blur-md shadow-lg text-lg leading-relaxed ${
                  msg.type === 'user' 
                    ? 'bg-emerald-600/80 text-white rounded-tr-none border border-emerald-500/50' 
                    : 'bg-white/90 text-gray-800 rounded-tl-none border border-white/50'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}

          {/* Live Transcript */}
          {transcript && (
            <div className="flex justify-end">
              <div className="max-w-[80%] p-5 rounded-2xl rounded-tr-none bg-emerald-600/40 backdrop-blur-md text-white/90 border border-emerald-500/30 animate-pulse">
                {transcript}...
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl rounded-tl-none flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Interaction Area */}
        <div className="py-8 flex flex-col items-center justify-center relative">
          
          {/* Microphone Orb */}
          <div className="relative group">
            {/* Ripple Effects */}
            {isListening && (
              <>
                <div className="absolute inset-0 bg-emerald-500 rounded-full opacity-20 animate-ping"></div>
                <div className="absolute inset-0 bg-emerald-400 rounded-full opacity-20 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                <div className="absolute -inset-4 bg-emerald-500/30 rounded-full blur-xl animate-pulse"></div>
              </>
            )}

            <button
              onClick={toggleListening}
              className={`relative z-20 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 transform hover:scale-105 shadow-[0_0_40px_rgba(0,0,0,0.3)] border-4 ${
                isListening 
                  ? 'bg-gradient-to-br from-red-500 to-pink-600 border-red-300/50' 
                  : 'bg-gradient-to-br from-emerald-400 to-teal-600 border-emerald-300/50'
              }`}
            >
              {isListening ? (
                <FaMicrophoneSlash className="text-4xl text-white drop-shadow-md" />
              ) : (
                <FaMicrophone className="text-4xl text-white drop-shadow-md" />
              )}
            </button>
          </div>

          <p className="mt-6 text-white/70 font-medium tracking-wide">
            {isListening ? "Listening..." : "Tap to Speak"}
          </p>
        </div>
      </main>
    </div>
  );
}
