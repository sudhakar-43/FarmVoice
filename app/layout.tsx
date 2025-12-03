import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FarmVoice - AI Farming Assistant",
  description: "Your intelligent farming companion for crop recommendations, disease management, and market insights",
};

import { SettingsProvider } from "@/context/SettingsContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SettingsProvider>
          {children}
        </SettingsProvider>
      </body>
    </html>
  );
}

