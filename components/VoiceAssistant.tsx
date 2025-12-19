"use client";

import { useState, useEffect, useRef } from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaTimes,
  FaStop,
} from "react-icons/fa";
import { apiClient } from "@/lib/api";

interface VoiceAssistantProps {
  onClose: () => void;
}

interface Message {
  type: "user" | "assistant";
  text: string;
  timestamp: Date;
}

export default function VoiceAssistant({ onClose }: VoiceAssistantProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const lastTranscriptRef = useRef("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

        // Clear existing silence timer
        if (silenceTimer) {
          clearTimeout(silenceTimer);
        }

        // If we have final results and user is still listening, set timer to auto-process
        if (finalTranscript.trim() && isListening) {
          const timer = setTimeout(() => {
            if (lastTranscriptRef.current.trim()) {
              processQuery(lastTranscriptRef.current.trim());
              setTranscript("");
              lastTranscriptRef.current = "";
            }
          }, 2000); // Auto-process after 2 seconds of silence

          setSilenceTimer(timer);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "aborted" && event.error !== "no-speech") {
          setIsListening(false);
        }
      };

      recognitionRef.current.onend = () => {
        if (isListening && !isProcessing) {
          // Restart if still in listening mode
          try {
            recognitionRef.current?.start();
          } catch (e) {
            console.log("Could not restart recognition");
          }
        }
      };
    }

    return () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isListening, isProcessing, silenceTimer]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert(
        "Speech recognition is not supported in your browser. Please use Chrome or Edge."
      );
      return;
    }

    if (isListening) {
      // Stop listening
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        setSilenceTimer(null);
      }
      recognitionRef.current.stop();
      setIsListening(false);

      // Process any pending transcript
      if (transcript.trim()) {
        processQuery(transcript.trim());
        setTranscript("");
      }
    } else {
      // Start continuous listening
      setTranscript("");
      lastTranscriptRef.current = "";
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  };

  const processQuery = async (query: string) => {
    if (!query.trim()) return;

    // Add user message to history
    const userMessage: Message = {
      type: "user",
      text: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    setIsProcessing(true);

    try {
      const response = await apiClient.processVoiceQuery(query);

      if (response.error) {
        const errorMessage: Message = {
          type: "assistant",
          text: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsProcessing(false);
        return;
      }

      if (response.data) {
        const assistantMessage: Message = {
          type: "assistant",
          text: response.data.response,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsProcessing(false);
        speakResponse(response.data.response);
      }
    } catch (err) {
      const errorMessage: Message = {
        type: "assistant",
        text: "Sorry, I couldn't process your query. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setIsProcessing(false);
    }
  };

  const speakResponse = (text: string) => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Select a female voice if available
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(
        (voice) =>
          voice.name.includes("Female") ||
          voice.name.includes("Zira") ||
          voice.name.includes("Google US English") ||
          voice.name.includes("Samantha")
      );

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg max-w-2xl w-full h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-900">
              FarmVoice AI Assistant
            </h2>
            {isListening && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-red-600 font-medium">
                  Listening
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Conversation History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-lg font-medium mb-2">
                👋 Hello! I'm your FarmVoice assistant
              </p>
              <p className="text-sm">
                Ask me about crops, diseases, market prices, or farming tips.
              </p>
              <p className="text-xs mt-2">
                Click the mic button below to start speaking
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.type === "user"
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.type === "user"
                      ? "text-emerald-100"
                      : "text-gray-500"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-600 border-t-transparent"></div>
                  <span className="text-sm text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Current Transcript Display */}
        {isListening && transcript && (
          <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
            <p className="text-sm text-blue-900">
              <span className="font-medium">You're saying: </span>
              {transcript}
            </p>
          </div>
        )}

        {/* Input Area */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder="Or type your question here..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-gray-700"
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                  processQuery(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
              disabled={isListening}
            />
            <button
              onClick={(e) => {
                const input = e.currentTarget
                  .previousElementSibling as HTMLInputElement;
                if (input.value.trim()) {
                  processQuery(input.value);
                  input.value = "";
                }
              }}
              disabled={isListening}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={toggleListening}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 ${
                isListening
                  ? "bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200"
                  : "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
              } text-white ${isListening ? "animate-pulse" : ""}`}
              title={isListening ? "Stop listening" : "Start listening"}
            >
              {isListening ? (
                <FaMicrophoneSlash className="text-xl" />
              ) : (
                <FaMicrophone className="text-xl" />
              )}
            </button>

            {isSpeaking && (
              <button
                onClick={stopSpeaking}
                className="w-14 h-14 rounded-full flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white shadow-lg transition-all duration-200"
                title="Stop speaking"
              >
                <FaStop className="text-lg" />
              </button>
            )}
          </div>

          <p className="text-center text-xs text-gray-500 mt-2">
            {isListening
              ? "🎤 Listening... I'll auto-process after 2 seconds of silence"
              : "Click the microphone to start speaking"}
          </p>
        </div>
      </div>
    </div>
  );
}
