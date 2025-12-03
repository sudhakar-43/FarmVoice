"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { translations, Language as TransLanguage } from "@/lib/translations";

type Theme = "light" | "dark";
type Language = TransLanguage;

interface SettingsContextType {
  theme: Theme;
  language: Language;
  notifications: boolean;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
  setNotifications: (enabled: boolean) => void;
  toggleTheme: () => void;
  t: (key: keyof typeof translations.en) => string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("en");
  const [notifications, setNotifications] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load settings from localStorage
    const savedTheme = localStorage.getItem("farmvoice_theme_v1") as Theme;
    const savedLanguage = localStorage.getItem("farmvoice_language") as Language;
    const savedNotifications = localStorage.getItem("farmvoice_notifications");

    if (savedTheme) setTheme(savedTheme);
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
    if (savedNotifications !== null) setNotifications(savedNotifications === "true");
    
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Apply theme to document
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Save to localStorage
    localStorage.setItem("farmvoice_theme_v1", theme);
    localStorage.setItem("farmvoice_language", language);
    localStorage.setItem("farmvoice_notifications", String(notifications));
  }, [theme, language, notifications, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const t = (key: keyof typeof translations.en) => {
    const lang = translations[language] ? language : "en";
    return translations[lang][key] || translations["en"][key] || key;
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        language,
        notifications,
        setTheme,
        setLanguage,
        setNotifications,
        toggleTheme,
        t,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}

