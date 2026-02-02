"use client";

import React, { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

interface AuthContextType {}

const AuthContext = createContext<AuthContextType>({});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    // Handler for global auth errors
    const handleAuthError = () => {
      console.log("AuthContext: Received auth error, redirecting to login...");
      
      // Clear any auth data from storage
      apiClient.clearToken();
      if (typeof window !== "undefined") {
        localStorage.removeItem("farmvoice_auth");
        localStorage.removeItem("farmvoice_token");
        localStorage.removeItem("farmvoice_user");
        localStorage.removeItem("farmvoice_user_id");
        localStorage.removeItem("farmvoice_user_name");
      }
      
      // Redirect to login
      router.push("/login");
    };

    // Listen for the custom event dispatched by ApiClient
    window.addEventListener("farmvoice:auth-error", handleAuthError);

    // Cleanup
    return () => {
      window.removeEventListener("farmvoice:auth-error", handleAuthError);
    };
  }, [router]);

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
