"use client";

import { useState } from "react";
import { FaSearch, FaTimes } from "react-icons/fa";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onFeatureSelect: (feature: string) => void;
}

export default function SearchBar({ onSearch, onFeatureSelect }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestions = [
    { text: "Crop Recommendation", feature: "crop" },
    { text: "Disease Management", feature: "disease" },
    { text: "Market Prices", feature: "market" },
    { text: "Rice cultivation tips", feature: "crop" },
    { text: "Tomato diseases", feature: "disease" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setQuery("");
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: { text: string; feature: string }) => {
    setQuery(suggestion.text);
    onFeatureSelect(suggestion.feature);
    setShowSuggestions(false);
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.text.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative mb-8">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search features, crops, diseases, or ask a question..."
            className="w-full pl-12 pr-12 py-4 bg-white border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-gray-900 placeholder-gray-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setShowSuggestions(false);
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </form>

      {showSuggestions && query && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center space-x-3"
            >
              <FaSearch className="text-gray-400 text-sm" />
              <span className="text-gray-700">{suggestion.text}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

