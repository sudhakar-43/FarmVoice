import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FarmVoice - AI Farming Assistant",
  description: "Your intelligent farming companion for crop recommendations, disease management, and market insights",
};

import { SettingsProvider } from "@/context/SettingsContext";
import ErrorBoundary from "@/components/ErrorBoundary";

import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          <AuthProvider>
            <SettingsProvider>
              {children}
            </SettingsProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

